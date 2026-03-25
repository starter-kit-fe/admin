package executor

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/starter-kit-fe/admin/internal/config"
)

const (
	s3MultipartThreshold  = int64(100 * 1024 * 1024) // 100MB
	s3MultipartPartSize   = int64(8 * 1024 * 1024)   // 8MB
	s3MultipartConcurrent = 4
)

func uploadToS3(ctx context.Context, e *BackupExecutor, params *BackupParams, filePath, filename string) (string, error) {
	prepareStep := e.startStep("准备存储配置")

	endpoint := coalesce(params.S3Endpoint, e.cfg.S3.Endpoint)
	bucket := coalesce(params.S3Bucket, e.cfg.S3.Bucket)

	if endpoint == "" || bucket == "" {
		err := errors.New("s3 configuration is incomplete")
		e.failStep(prepareStep, err)
		return "", err
	}

	objectKey := "backups/" + filename
	e.logStep(prepareStep, "存储配置就绪: endpoint=%s, bucket=%s, key=%s", endpoint, bucket, objectKey)

	accessKey := coalesce(params.S3AccessKey, e.cfg.S3.AccessKey)
	secretKey := coalesce(params.S3SecretKey, e.cfg.S3.SecretKey)
	region := coalesce(params.S3Region, e.cfg.S3.Region)
	usePathStyle := params.S3UsePathStyle || e.cfg.S3.UsePathStyle

	e.logStep(prepareStep, "使用 %s 模式构建客户端", pathStyleLabel(usePathStyle))
	e.successStep(prepareStep)

	readStep := e.startStep("读取备份文件")
	file, err := os.Open(filePath)
	if err != nil {
		e.failStep(readStep, err)
		return "", err
	}
	defer file.Close()

	var size int64
	if info, err := file.Stat(); err == nil {
		size = info.Size()
	}
	e.logStep(readStep, "待上传文件: %s (%.2f MB)", filePath, float64(size)/(1024*1024))
	e.successStep(readStep)

	uploadStep := e.startStep("上传备份文件")

	s3Client := s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		UsePathStyle: usePathStyle,
	})

	e.logStep(uploadStep, "客户端初始化完成，开始上传")

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

	objURL := buildObjectURL(endpoint, bucket, objectKey, usePathStyle)
	if objURL != "" {
		e.logStep(uploadStep, "上传成功，访问地址: %s", objURL)
	} else {
		e.logStep(uploadStep, "上传成功")
	}
	e.successStep(uploadStep)

	return objURL, nil
}

func cleanupOldBackups(ctx context.Context, cfg *config.Config, params *BackupParams) error {
	endpoint := coalesce(params.S3Endpoint, cfg.S3.Endpoint)
	bucket := coalesce(params.S3Bucket, cfg.S3.Bucket)

	if endpoint == "" || bucket == "" {
		return nil
	}

	accessKey := coalesce(params.S3AccessKey, cfg.S3.AccessKey)
	secretKey := coalesce(params.S3SecretKey, cfg.S3.SecretKey)
	region := coalesce(params.S3Region, cfg.S3.Region)
	usePathStyle := params.S3UsePathStyle || cfg.S3.UsePathStyle

	s3Client := s3.New(s3.Options{
		Region:       region,
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		UsePathStyle: usePathStyle,
	})

	result, err := s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String("backups/"),
	})
	if err != nil {
		return err
	}

	cutoff := time.Now().AddDate(0, 0, -params.RetentionDays)
	for _, obj := range result.Contents {
		if obj.LastModified != nil && obj.LastModified.Before(cutoff) {
			if _, err := s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(bucket),
				Key:    obj.Key,
			}); err != nil {
				return err
			}
		}
	}

	return nil
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

func coalesce(primary, fallback string) string {
	if primary != "" {
		return primary
	}
	return fallback
}

func pathStyleLabel(usePathStyle bool) string {
	if usePathStyle {
		return "path-style"
	}
	return "virtual-hosted"
}
