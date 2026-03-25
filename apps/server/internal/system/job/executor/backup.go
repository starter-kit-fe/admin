package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// BackupExecutor 数据库备份执行器
type BackupExecutor struct {
	db         *gorm.DB
	cfg        *config.Config
	logger     *slog.Logger
	stepLogger types.StepLoggerInterface
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
	S3Endpoint     string `json:"s3Endpoint"`
	S3AccessKey    string `json:"s3AccessKey"`
	S3SecretKey    string `json:"s3SecretKey"`
	S3Bucket       string `json:"s3Bucket"`
	S3Region       string `json:"s3Region"`
	S3UsePathStyle bool   `json:"s3UsePathStyle"`
}

// NewBackupExecutor 创建备份执行器
func NewBackupExecutor(db *gorm.DB, cfg *config.Config) types.Executor {
	return func(ctx context.Context, payload types.ExecutionPayload) error {
		e := &BackupExecutor{
			db:         db,
			cfg:        cfg,
			logger:     payload.Logger,
			stepLogger: payload.StepLogger,
		}
		return e.execute(ctx, payload.Params)
	}
}

func (e *BackupExecutor) execute(ctx context.Context, rawParams json.RawMessage) error {
	params, err := e.parseParams(rawParams)
	if err != nil {
		return fmt.Errorf("parse backup params: %w", err)
	}

	tempDir := params.TempDir
	if tempDir == "" {
		tempDir = e.cfg.Backup.TempDir
	}
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("create temp dir: %w", err)
	}

	timestamp := time.Now().Format("20060102-150405")
	dbName := params.Database
	if dbName == "" {
		dbName = extractDatabaseName(e.cfg)
	}
	filename := fmt.Sprintf("backup-%s-%s.sql", dbName, timestamp)
	if params.Compress {
		filename += ".gz"
	}
	backupPath := filepath.Join(tempDir, filename)

	backupStep := e.startStep("生成备份文件")
	e.logStep(backupStep, "输出目录: %s", backupPath)

	if e.logger != nil {
		e.logger.Info("starting database backup", "database", dbName, "file", filename)
	}

	if err := performBackup(ctx, e.cfg, params, backupPath); err != nil {
		e.failStep(backupStep, err)
		return fmt.Errorf("perform backup: %w", err)
	}
	e.logStep(backupStep, "备份文件已生成: %s", backupPath)
	e.successStep(backupStep)

	if params.UploadToS3 {
		url, err := uploadToS3(ctx, e, params, backupPath, filename)
		if err != nil {
			_ = os.Remove(backupPath)
			return fmt.Errorf("upload to s3: %w", err)
		}
		if e.logger != nil {
			e.logger.Info("backup uploaded to s3", "file", filename, "url", url)
		}
	} else {
		e.logStep(backupStep, "已禁用上传到 S3，跳过上传和远端存储路径记录")
	}

	if err := os.Remove(backupPath); err != nil && e.logger != nil {
		e.logger.Warn("failed to remove local backup", "file", backupPath, "error", err)
	}

	if params.CleanupOldBackups && params.UploadToS3 {
		if err := cleanupOldBackups(ctx, e.cfg, params); err != nil && e.logger != nil {
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
			return nil, fmt.Errorf("invalid backup params: %w", err)
		}
	}

	if params.RetentionDays <= 0 {
		params.RetentionDays = e.cfg.Backup.RetentionDays
	}

	return params, nil
}

// step helpers

func (e *BackupExecutor) startStep(name string) types.StepInterface {
	if e == nil || e.stepLogger == nil {
		return nil
	}
	return e.stepLogger.StartStep(name)
}

func (e *BackupExecutor) logStep(step types.StepInterface, format string, args ...interface{}) {
	if step != nil {
		step.Log(format, args...)
		return
	}
	if e != nil && e.logger != nil {
		e.logger.Info(fmt.Sprintf(format, args...))
	}
}

func (e *BackupExecutor) successStep(step types.StepInterface) {
	if step == nil {
		return
	}
	_ = step.Success()
}

func (e *BackupExecutor) failStep(step types.StepInterface, err error) {
	if step == nil {
		return
	}
	_ = step.Fail(err)
}
