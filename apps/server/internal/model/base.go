package model

import (
	"github.com/starter-kit-fe/admin/constant"
	"gorm.io/gorm"
)

type BaseModel struct {
	gorm.Model
}

func tableName(suffix string) string {
	return constant.DB_PREFIX + suffix
}
