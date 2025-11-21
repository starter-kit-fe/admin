package db

import (
	"errors"
	"fmt"

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
		&model.SysDictType{},
		&model.SysDictData{},
		&model.SysConfig{},
		&model.SysJob{},
		&model.SysJobLog{},
		&model.SysJobLogStep{},
		&model.SysNotice{},
	}

	if err := db.AutoMigrate(models...); err != nil {
		return err
	}

	if err := ensureLogTables(db); err != nil {
		return err
	}

	return ensureUserPostCompositePrimaryKey(db)
}

func ensureUserPostCompositePrimaryKey(db *gorm.DB) error {
	if db == nil {
		return errors.New("gorm db is nil")
	}

	tableName := model.SysUserPost{}.TableName()
	dialect := db.Dialector.Name()

	switch dialect {
	case "postgres":
		query := fmt.Sprintf(`
SELECT COUNT(*)
FROM pg_index idx
JOIN pg_attribute attr ON attr.attrelid = idx.indrelid AND attr.attnum = ANY(idx.indkey)
WHERE idx.indrelid = to_regclass('%s')
  AND idx.indisprimary
  AND attr.attname = 'post_id'
`, tableName)
		var count int64
		if err := db.Raw(query).Scan(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return nil
		}
		dropSQL := fmt.Sprintf(`ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s_pkey`, tableName, tableName)
		addSQL := fmt.Sprintf(`ALTER TABLE %s ADD CONSTRAINT %s_pkey PRIMARY KEY (user_id, post_id)`, tableName, tableName)
		if err := db.Exec(dropSQL).Error; err != nil {
			return err
		}
		if err := db.Exec(addSQL).Error; err != nil {
			return err
		}
	case "mysql":
		query := fmt.Sprintf(`
SELECT COUNT(*)
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = '%s'
  AND index_name = 'PRIMARY'
  AND column_name = 'post_id'
`, tableName)
		var count int64
		if err := db.Raw(query).Scan(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return nil
		}
		alterSQL := fmt.Sprintf(`ALTER TABLE %s DROP PRIMARY KEY, ADD PRIMARY KEY (user_id, post_id)`, tableName)
		if err := db.Exec(alterSQL).Error; err != nil {
			return err
		}
	default:
		// Other dialects fall back to AutoMigrate result.
	}

	return nil
}
