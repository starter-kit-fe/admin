package job

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
)

// BackupExecutor 数据库备份执行器
type BackupExecutor struct {
	db     *gorm.DB
	cfg    *config.Config
	logger *slog.Logger
}

// BackupParams 备份任务参数
type BackupParams struct {
	Database          string   `json:"database"`           // 数据库名称,可选,默认使用配置中的数据库
	IncludeSchemas    []string `json:"includeSchemas"`     // 要包含的 schema,可选
	ExcludeTables     []string `json:"excludeTables"`      // 要排除的表,可选
	Compress          bool     `json:"compress"`           // 是否压缩,默认 true
	UploadToS3        bool     `json:"uploadToS3"`         // 是否上传到 S3,默认 true
	CleanupOldBackups bool     `json:"cleanupOldBackups"`  // 是否清理旧备份,默认 true
	RetentionDays     int      `json:"retentionDays"`      // 保留天数,默认使用配置值
	TempDir           string   `json:"tempDir"`            // 临时目录,可选,默认使用配置值
	
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
			db:     db,
			cfg:    cfg,
			logger: payload.Logger,
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

	// 执行备份
	if e.logger != nil {
		e.logger.Info("starting database backup", "database", dbName, "file", filename)
	}

	if err := e.performBackup(ctx, params, backupPath); err != nil {
		return fmt.Errorf("perform backup: %w", err)
	}

	// 上传到 S3
	if params.UploadToS3 {
		if err := e.uploadToS3(ctx, params, backupPath, filename); err != nil {
			// 清理本地文件
			_ = os.Remove(backupPath)
			return fmt.Errorf("upload to s3: %w", err)
		}
		if e.logger != nil {
			e.logger.Info("backup uploaded to s3", "file", filename)
		}
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
		if err := json.Unmarshal(raw, params); err != nil {
			return nil, err
		}
	}

	if params.RetentionDays <= 0 {
		params.RetentionDays = e.cfg.Backup.RetentionDays
	}

	return params, nil
}

func (e *BackupExecutor) extractDatabaseName() string {
	// 从 DSN 中提取数据库名称
	dsn := e.cfg.Database.DSN
	// postgres://user:pass@host:port/dbname?options
	parts := strings.Split(dsn, "/")
	if len(parts) >= 4 {
		dbPart := parts[3]
		if idx := strings.Index(dbPart, "?"); idx > 0 {
			return dbPart[:idx]
		}
		return dbPart
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

	// 执行备份
	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("pg_dump failed: %w, output: %s", err, output.String())
	}

	// 写入文件(可能需要压缩)
	if params.Compress {
		return e.writeCompressed(output.Bytes(), outputPath)
	}
	return os.WriteFile(outputPath, output.Bytes(), 0644)
}

func (e *BackupExecutor) buildPgEnv() []string {
	dsn := e.cfg.Database.DSN
	env := []string{}

	// 解析 DSN: postgres://user:pass@host:port/dbname?options
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		dsn = strings.TrimPrefix(dsn, "postgres://")
		dsn = strings.TrimPrefix(dsn, "postgresql://")

		// 提取用户名和密码
		if idx := strings.Index(dsn, "@"); idx > 0 {
			userPass := dsn[:idx]
			if colonIdx := strings.Index(userPass, ":"); colonIdx > 0 {
				user := userPass[:colonIdx]
				pass := userPass[colonIdx+1:]
				env = append(env, "PGUSER="+user)
				env = append(env, "PGPASSWORD="+pass)
			}

			// 提取主机和端口
			hostPart := dsn[idx+1:]
			if slashIdx := strings.Index(hostPart, "/"); slashIdx > 0 {
				hostPort := hostPart[:slashIdx]
				if colonIdx := strings.Index(hostPort, ":"); colonIdx > 0 {
					host := hostPort[:colonIdx]
					port := hostPort[colonIdx+1:]
					env = append(env, "PGHOST="+host)
					env = append(env, "PGPORT="+port)
				} else {
					env = append(env, "PGHOST="+hostPort)
					env = append(env, "PGPORT=5432")
				}
			}
		}
	}

	return env
}

func (e *BackupExecutor) writeCompressed(data []byte, outputPath string) error {
	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	gzWriter := gzip.NewWriter(file)
	defer gzWriter.Close()

	_, err = gzWriter.Write(data)
	return err
}

func (e *BackupExecutor) uploadToS3(ctx context.Context, params *BackupParams, filePath, filename string) error {
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
		return errors.New("s3 configuration is incomplete")
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

	// 打开文件
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 创建 S3 客户端
	s3Client := s3.New(s3.Options{
		Region: region,
		BaseEndpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			accessKey,
			secretKey,
			"",
		),
		UsePathStyle: usePathStyle,
	})

	// 上传文件
	_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String("backups/" + filename),
		Body:   file,
	})

	return err
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
		Region: region,
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
