package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// BackupDemoParams 备份参数（演示用）
type BackupDemoParams struct {
	Database string `json:"database"`
	S3Bucket string `json:"s3Bucket"`
}

// BackupDatabaseExecutor 数据库备份执行器
func BackupDatabaseExecutor(ctx context.Context, payload types.ExecutionPayload) error {
	stepLogger := payload.StepLogger
	if stepLogger == nil {
		return fmt.Errorf("step logger not available")
	}

	// 解析参数
	var params BackupDemoParams
	if len(payload.Params) > 0 {
		if err := decodeBackupParams(payload.Params, &params); err != nil {
			return fmt.Errorf("invalid params: %w", err)
		}
	}

	// 默认参数
	if params.Database == "" {
		params.Database = "production_db"
	}
	if params.S3Bucket == "" {
		params.S3Bucket = "backups"
	}

	// === 步骤 1: 开始备份 ===
	step1 := stepLogger.StartStep("开始备份")
	step1.Log("任务开始执行")
	step1.Log("目标数据库: %s", params.Database)

	// 模拟检测数据大小
	dataSize := 1.2 // GB
	step1.Log("检测到数据大小为 %.2f GB", dataSize)

	if err := step1.Success(); err != nil {
		return err
	}

	// === 步骤 2: 生成备份文件 ===
	step2 := stepLogger.StartStep("生成备份文件")
	step2.Log("正在读取数据库...")

	backupFile := fmt.Sprintf("backup_%s.sql", time.Now().Format("20060102_150405"))

	// 模拟导出进度
	for i := 0; i <= 100; i += 20 {
		step2.Log("已导出 %d%%", i)
		time.Sleep(500 * time.Millisecond)

		// 检查上下文取消
		select {
		case <-ctx.Done():
			step2.Fail(ctx.Err())
			return ctx.Err()
		default:
		}
	}

	step2.Log("备份文件生成完成: %s", backupFile)

	if err := step2.Success(); err != nil {
		return err
	}

	// === 步骤 3: 压缩文件 ===
	step3 := stepLogger.StartStep("压缩文件")
	step3.Log("正在压缩备份文件...")
	time.Sleep(1 * time.Second)

	step3.Log("压缩率: 75%%")

	compressedFile := backupFile + ".gz"
	compressedSize := dataSize * 0.25
	step3.Log("压缩完成: %s (%.2f MB)", compressedFile, compressedSize*1024)

	if err := step3.Success(); err != nil {
		return err
	}

	// === 步骤 4: 上传到云存储 ===
	step4 := stepLogger.StartStep("上传到云存储")
	step4.Log("正在上传到 S3 bucket: %s", params.S3Bucket)

	// 模拟上传进度
	for i := 0; i <= 100; i += 25 {
		step4.Log("上传进度: %d%%", i)
		time.Sleep(800 * time.Millisecond)

		select {
		case <-ctx.Done():
			step4.Fail(ctx.Err())
			return ctx.Err()
		default:
		}
	}

	step4.Log("上传完成")
	step4.Log("文件路径: s3://%s/%s", params.S3Bucket, compressedFile)

	if err := step4.Success(); err != nil {
		return err
	}

	return nil
}

// decodeBackupParams 支持标准 JSON 对象或被包裹成字符串的 JSON 文本
func decodeBackupParams(raw json.RawMessage, out interface{}) error {
	if len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, out); err == nil {
		return nil
	}

	var text string
	if err := json.Unmarshal(raw, &text); err != nil {
		return err
	}

	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}

	return json.Unmarshal([]byte(text), out)
}
