package db

import (
	"log"
	"os"

	"github.com/starter-kit-fe/admin/constant"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func LoadPostgres(url string) (*gorm.DB, error) {
	config := &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   constant.DB_PREFIX, // Table name prefix, e.g., `it_`
			SingularTable: true,               // Use singular table name, e.g., `it_article`
		},
		DryRun: false,
		Logger: logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), // 输出到标准输出
			logger.Config{
				LogLevel: logger.Info, // 设置日志级别
			}),
	}
	db, err := gorm.Open(postgres.Open(url), config)
	if err != nil {
		return nil, err
	}
	return db, nil
}
