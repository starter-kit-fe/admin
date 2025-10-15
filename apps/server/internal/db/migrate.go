package db

import (
	"errors"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

func AutoMigrate(db *gorm.DB) error {
	if db == nil {
		return errors.New("gorm db is nil")
	}

	models := []interface{}{
		&model.SysDept{},
		&model.SysUser{},
		&model.SysPost{},
		&model.SysRole{},
		&model.SysMenu{},
		&model.SysUserRole{},
		&model.SysRoleMenu{},
		&model.SysRoleDept{},
		&model.SysUserPost{},
		&model.SysOperLog{},
		&model.SysDictType{},
		&model.SysDictData{},
		&model.SysConfig{},
		&model.SysLogininfor{},
		&model.SysJob{},
		&model.SysJobLog{},
		&model.SysNotice{},
		&model.GenTable{},
		&model.GenTableColumn{},
	}

	return db.AutoMigrate(models...)
}
