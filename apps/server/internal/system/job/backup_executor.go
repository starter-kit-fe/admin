package job

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
)

const (
	s3MultipartThreshold  = int64(100 * 1024 * 1024) // 100MB 默认启用分片
	s3MultipartPartSize   = int64(8 * 1024 * 1024)   // 8MB 分片大小
	s3MultipartConcurrent = 4                        // 并发分片数量
)

// BackupExecutor 数据库备份执行器
type BackupExecutor struct {
	db         *gorm.DB
	cfg        *config.Config
	logger     *slog.Logger
	stepLogger *StepLogger
}

// BackupParams 备份任务参数
type BackupParams struct {
	Database          string   `json:"database"`          // 数据库名称,可选,默认使用配置中的数据库
	IncludeSchemas    []string `json:"includeSchemas"`    // 要包含的 schema,可选
	ExcludeTables     []string `json:"excludeTables"`     // 要排除的表,可选
	Compress          bool     `json:"compress"`          // 是否压缩,默认 true
	UploadToS3        bool     `json:"uploadToS3"`        // 是否上传到 S3,默认 true
	CleanupOldBackups bool     `json:"cleanupOldBackups"` // 是否清理旧备份,默认 true
	RetentionDays     int      `json:"retentionDays"`     // 保留天数,默认使用配置值
	TempDir           string   `json:"tempDir"`           // 临时目录,可选,默认使用配置值

	// S3 配置,可选,默认使用配置值
	S3Endpoint     string `json:"s3Endpoint"`     // S3 端点
	S3AccessKey    string `json:"s3AccessKey"`    // S3 访问密钥
	S3SecretKey    string `json:"s3SecretKey"`    // S3 密钥
	S3Bucket       string `json:"s3Bucket"`       // S3 存储桶
	S3Region       string `json:"s3Region"`       // S3 区域
	S3UsePathStyle bool   `json:"s3UsePathStyle"` // S3 是否使用路径样式
}

// NewBackupExecutor 创建备份执行器
func NewBackupExecutor(db *gorm.DB, cfg *config.Config) Executor {
	return func(ctx context.Context, payload ExecutionPayload) error {
		executor := &BackupExecutor{
			db:         db,
			cfg:        cfg,
			logger:     payload.Logger,
			stepLogger: payload.StepLogger,
		}
		return executor.execute(ctx, payload.Params)
	}
}

func (e *BackupExecutor) execute(ctx context.Context, rawParams json.RawMessage) error {
	// 解析参数
	params, err := e.parseParams(rawParams)
	if err != nil {
		return fmt.Errorf("parse backup params: %w", err)
	}

	// 确保临时目录存在
	tempDir := params.TempDir
	if tempDir == "" {
		tempDir = e.cfg.Backup.TempDir
	}
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("create temp dir: %w", err)
	}

	// 生成备份文件名
	timestamp := time.Now().Format("20060102-150405")
	dbName := params.Database
	if dbName == "" {
		dbName = e.extractDatabaseName()
	}
	filename := fmt.Sprintf("backup-%s-%s.sql", dbName, timestamp)
	if params.Compress {
		filename += ".gz"
	}
	backupPath := filepath.Join(tempDir, filename)

	backupStep := e.startStep("生成备份文件")
	e.logStep(backupStep, "输出目录: %s", backupPath)

	// 执行备份
	if e.logger != nil {
		e.logger.Info("starting database backup", "database", dbName, "file", filename)
	}

	if err := e.performBackup(ctx, params, backupPath); err != nil {
		e.failStep(backupStep, err)
		return fmt.Errorf("perform backup: %w", err)
	}
	e.logStep(backupStep, "备份文件已生成: %s", backupPath)
	e.successStep(backupStep)

	// 上传到 S3
	if params.UploadToS3 {
		url, err := e.uploadToS3(ctx, params, backupPath, filename)
		if err != nil {
			// 清理本地文件
			_ = os.Remove(backupPath)
			return fmt.Errorf("upload to s3: %w", err)
		}
		if e.logger != nil {
			e.logger.Info("backup uploaded to s3", "file", filename, "url", url)
		}
	} else {
		e.logStep(backupStep, "已禁用上传到 S3，跳过上传和远端存储路径记录")
	}

	// 清理本地临时文件
	if err := os.Remove(backupPath); err != nil && e.logger != nil {
		e.logger.Warn("failed to remove local backup", "file", backupPath, "error", err)
	}

	// 清理旧备份
	if params.CleanupOldBackups && params.UploadToS3 {
		if err := e.cleanupOldBackups(ctx, params); err != nil && e.logger != nil {
			e.logger.Warn("failed to cleanup old backups", "error", err)
		}
	}

	return nil
}

func (e *BackupExecutor) parseParams(raw json.RawMessage) (*BackupParams, error) {
	params := &BackupParams{
		Compress:          true,
		UploadToS3:        true,
		CleanupOldBackups: true,
		RetentionDays:     e.cfg.Backup.RetentionDays,
	}

	if len(raw) > 0 {
		if err := decodeBackupParams(raw, params); err != nil {
			return nil, err
		}
	}

	if params.RetentionDays <= 0 {
		params.RetentionDays = e.cfg.Backup.RetentionDays
	}

	return params, nil
}

func (e *BackupExecutor) extractDatabaseName() string {
	parsed, err := url.Parse(e.cfg.Database.DSN)
	if err != nil {
		return "admin"
	}

	db := strings.TrimPrefix(parsed.Path, "/")
	if db != "" {
		return db
	}

	if name := parsed.Query().Get("dbname"); name != "" {
		return name
	}

	return "admin"
}

func (e *BackupExecutor) performBackup(ctx context.Context, params *BackupParams, outputPath string) error {
	// 构建 pg_dump 命令
	args := []string{
		"--format=plain",
		"--no-owner",
		"--no-acl",
	}

	// 添加 schema 过滤
	for _, schema := range params.IncludeSchemas {
		args = append(args, fmt.Sprintf("--schema=%s", schema))
	}

	// 添加表排除
	for _, table := range params.ExcludeTables {
		args = append(args, fmt.Sprintf("--exclude-table=%s", table))
	}

	// 添加数据库名称
	if params.Database != "" {
		args = append(args, params.Database)
	} else {
		args = append(args, e.extractDatabaseName())
	}

	// 创建命令
	cmd := exec.CommandContext(ctx, "pg_dump", args...)

	// 设置环境变量(从 DSN 中提取连接信息)
	env := e.buildPgEnv()
	cmd.Env = append(os.Environ(), env...)

	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create backup file: %w", err)
	}
	defer file.Close()

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	var gzipWriter *gzip.Writer
	if params.Compress {
		gzipWriter = gzip.NewWriter(file)
		cmd.Stdout = gzipWriter
	} else {
		cmd.Stdout = file
	}

	runErr := cmd.Run()
	if gzipWriter != nil {
		if closeErr := gzipWriter.Close(); runErr == nil && closeErr != nil {
			runErr = closeErr
		}
	}

	if runErr != nil {
		_ = os.Remove(outputPath)
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg != "" {
			return fmt.Errorf("pg_dump failed: %w, stderr: %s", runErr, errMsg)
		}
		return fmt.Errorf("pg_dump failed: %w", runErr)
	}

	return nil
}

func (e *BackupExecutor) buildPgEnv() []string {
	parsed, err := url.Parse(e.cfg.Database.DSN)
	if err != nil {
		return nil
	}

	env := make([]string, 0, 4)

	if parsed.User != nil {
		if user := parsed.User.Username(); user != "" {
			env = append(env, "PGUSER="+user)
		}
		if pass, ok := parsed.User.Password(); ok {
			env = append(env, "PGPASSWORD="+pass)
		}
	}

	if host := parsed.Hostname(); host != "" {
		env = append(env, "PGHOST="+host)
	}
	port := parsed.Port()
	if port == "" && parsed.Hostname() != "" {
		port = "5432"
	}
	if port != "" {
		env = append(env, "PGPORT="+port)
	}

	return env
}

func (e *BackupExecutor) uploadToS3(ctx context.Context, params *BackupParams, filePath, filename string) (string, error) {
	prepareStep := e.startStep("准备存储配置")

	// 获取 S3 配置,优先使用参数中的值
	endpoint := params.S3Endpoint
	if endpoint == "" {
		endpoint = e.cfg.S3.Endpoint
	}
	bucket := params.S3Bucket
	if bucket == "" {
		bucket = e.cfg.S3.Bucket
	}

	// 检查 S3 配置
	if endpoint == "" || bucket == "" {
		err := errors.New("s3 configuration is incomplete")
		e.failStep(prepareStep, err)
		return "", err
	}
	objectKey := "backups/" + filename
	e.logStep(prepareStep, "存储配置就绪: endpoint=%s, bucket=%s, key=%s", endpoint, bucket, objectKey)

	accessKey := params.S3AccessKey
	if accessKey == "" {
		accessKey = e.cfg.S3.AccessKey
	}
	secretKey := params.S3SecretKey
	if secretKey == "" {
		secretKey = e.cfg.S3.SecretKey
	}
	region := params.S3Region
	if region == "" {
		region = e.cfg.S3.Region
	}
	usePathStyle := params.S3UsePathStyle
	if !usePathStyle {
		usePathStyle = e.cfg.S3.UsePathStyle
	}

	e.logStep(prepareStep, "使用 %s 模式构建客户端", func() string {
		if usePathStyle {
			return "path-style"
		}
		return "virtual-hosted"
	}())
	e.successStep(prepareStep)

	// 打开文件
	readStep := e.startStep("读取备份文件")
	file, err := os.Open(filePath)
	if err != nil {
		e.failStep(readStep, err)
		return "", err
	}
	defer file.Close()
	statInfo, statErr := file.Stat()
	var size int64
	if statErr == nil {
		size = statInfo.Size()
	}
	e.logStep(readStep, "待上传文件: %s (%.2f MB)", filePath, float64(size)/(1024*1024))
	e.successStep(readStep)

	uploadStep := e.startStep("上传备份文件")

	// 创建 S3 客户端
	s3Client := s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			accessKey,
			secretKey,
			"",
		),
		UsePathStyle: usePathStyle,
	})

	e.logStep(uploadStep, "客户端初始化完成，开始上传")

	// 上传文件，小文件直接单请求，大文件使用分片上传提高鲁棒性
	useMultipart := size == 0 || size >= s3MultipartThreshold
	if useMultipart {
		uploader := manager.NewUploader(s3Client, func(u *manager.Uploader) {
			u.Concurrency = s3MultipartConcurrent
			if s3MultipartPartSize > manager.MinUploadPartSize {
				u.PartSize = s3MultipartPartSize
			}
		})
		_, err = uploader.Upload(ctx, &s3.PutObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(objectKey),
			Body:   file,
		})
	} else {
		_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(objectKey),
			Body:   file,
		})
	}

	if err != nil {
		method := "单请求上传"
		if useMultipart {
			method = "分片上传"
		}
		e.failStep(uploadStep, fmt.Errorf("%s失败: %w", method, err))
		return "", err
	}
	if useMultipart {
		e.logStep(uploadStep, "分片上传完成")
	} else {
		e.logStep(uploadStep, "单请求上传完成")
	}

	url := buildObjectURL(endpoint, bucket, objectKey, usePathStyle)
	if url != "" {
		e.logStep(uploadStep, "上传成功，访问地址: %s", url)
	} else {
		e.logStep(uploadStep, "上传成功")
	}
	e.successStep(uploadStep)

	return url, nil
}

func (e *BackupExecutor) cleanupOldBackups(ctx context.Context, params *BackupParams) error {
	// 获取 S3 配置
	endpoint := params.S3Endpoint
	if endpoint == "" {
		endpoint = e.cfg.S3.Endpoint
	}
	bucket := params.S3Bucket
	if bucket == "" {
		bucket = e.cfg.S3.Bucket
	}

	if endpoint == "" || bucket == "" {
		return nil
	}

	accessKey := params.S3AccessKey
	if accessKey == "" {
		accessKey = e.cfg.S3.AccessKey
	}
	secretKey := params.S3SecretKey
	if secretKey == "" {
		secretKey = e.cfg.S3.SecretKey
	}
	region := params.S3Region
	if region == "" {
		region = e.cfg.S3.Region
	}
	usePathStyle := params.S3UsePathStyle
	if !usePathStyle {
		usePathStyle = e.cfg.S3.UsePathStyle
	}

	// 创建 S3 客户端
	s3Client := s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			accessKey,
			secretKey,
			"",
		),
		UsePathStyle: usePathStyle,
	})

	// 列出所有备份文件
	result, err := s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String("backups/"),
	})
	if err != nil {
		return err
	}

	// 计算截止时间
	cutoffTime := time.Now().AddDate(0, 0, -params.RetentionDays)

	// 删除过期文件
	for _, obj := range result.Contents {
		if obj.LastModified != nil && obj.LastModified.Before(cutoffTime) {
			_, err := s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(bucket),
				Key:    obj.Key,
			})
			if err != nil && e.logger != nil {
				e.logger.Warn("failed to delete old backup", "key", *obj.Key, "error", err)
			} else if e.logger != nil {
				e.logger.Info("deleted old backup", "key", *obj.Key)
			}
		}
	}

	return nil
}

func (e *BackupExecutor) startStep(name string) *Step {
	if e == nil || e.stepLogger == nil {
		return nil
	}
	return e.stepLogger.StartStep(name)
}

func (e *BackupExecutor) logStep(step *Step, format string, args ...interface{}) {
	if step != nil {
		step.Log(format, args...)
		return
	}
	if e != nil && e.logger != nil {
		e.logger.Info(fmt.Sprintf(format, args...))
	}
}

func (e *BackupExecutor) successStep(step *Step) {
	if step == nil {
		return
	}
	if err := step.Success(); err != nil && e.logger != nil {
		e.logger.Warn("mark step success failed", "step", step.stepName, "error", err)
	}
}

func (e *BackupExecutor) failStep(step *Step, err error) {
	if step == nil {
		return
	}
	if closeErr := step.Fail(err); closeErr != nil && e.logger != nil {
		e.logger.Warn("mark step failed failed", "step", step.stepName, "error", closeErr)
	}
}

func buildObjectURL(endpoint, bucket, key string, usePathStyle bool) string {
	if endpoint == "" || bucket == "" || key == "" {
		return ""
	}
	endpoint = strings.TrimSuffix(endpoint, "/")
	if usePathStyle {
		return fmt.Sprintf("%s/%s/%s", endpoint, bucket, key)
	}

	parsed, err := url.Parse(endpoint)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}

	parsed.Host = bucket + "." + parsed.Host
	parsed.Path = path.Join(parsed.Path, key)
	return parsed.String()
}
