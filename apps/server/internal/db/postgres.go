package db

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/starter-kit-fe/admin/constant"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func LoadPostgres(url string, mode string) (*gorm.DB, error) {
	config := &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   constant.DB_PREFIX,
			SingularTable: true,
		},
		DryRun: false,
		Logger: newGormLogger(mode),
	}
	db, err := gorm.Open(postgres.Open(url), config)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func newGormLogger(mode string) logger.Interface {
	writer := log.New(os.Stdout, "\r\n", log.LstdFlags)

	if mode == gin.ReleaseMode {
		// 生产：只记录慢查询（>500ms）和错误，不输出颜色
		return logger.New(writer, logger.Config{
			SlowThreshold:             500 * time.Millisecond,
			LogLevel:                  logger.Warn,
			Colorful:                  false,
			IgnoreRecordNotFoundError: true,
		})
	}

	// 开发：记录所有 SQL，高亮慢查询（>200ms），彩色输出
	return logger.New(writer, logger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  logger.Info,
		Colorful:                  true,
		IgnoreRecordNotFoundError: false,
	})
}
