package db

import (
	"log"
	"os"

	"github.com/starter-kit-fe/admin/constant"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func LoadSqlite(dsn string) (*gorm.DB, error) {
	config := &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   constant.DB_PREFIX, // Table name prefix
			SingularTable: true,               // Use singular table name
		},
		DryRun: false,
		Logger: logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				LogLevel: logger.Info,
			}),
	}
	db, err := gorm.Open(sqlite.Open(dsn), config)
	if err != nil {
		return nil, err
	}
	// Enable foreign keys
	db.Exec("PRAGMA foreign_keys = ON")
	return db, nil
}
