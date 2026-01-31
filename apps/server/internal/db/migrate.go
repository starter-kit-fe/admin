package db

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

// AutoMigrate automatically migrates the schema for all models.
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

func ensureLogTables(db *gorm.DB) error {
	if db.Dialector.Name() != "postgres" {
		return nil
	}

	specs := []model.LogTableSpec{
		model.OperLogTableSpec(),
		model.LoginLogTableSpec(),
	}

	for _, spec := range specs {
		// 1. Create UNLOGGED partitioned table
		stmt := fmt.Sprintf(`CREATE UNLOGGED TABLE IF NOT EXISTS %q (%s) PARTITION BY RANGE (%q)`,
			spec.TableName, strings.TrimSpace(spec.ColumnsSQL), spec.TimeColumn)
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}

		// 2. Ensure indexes (BRIN etc)
		for _, idx := range spec.Indexes {
			using := ""
			if idx.Using != "" {
				using = " USING " + idx.Using
			}
			with := ""
			if strings.ToUpper(idx.Using) == "BRIN" {
				with = " WITH (autosummarize = on)"
			}
			cols := strings.Join(idx.Columns, ", ")
			idxStmt := fmt.Sprintf(`CREATE INDEX IF NOT EXISTS %q ON %q %s (%s)%s`,
				idx.Name, spec.TableName, using, cols, with)
			if err := db.Exec(idxStmt).Error; err != nil {
				return err
			}
		}

		// 3. Ensure partitions
		now := time.Now().UTC()
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).AddDate(0, -6, 0)
		end := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).AddDate(0, 3, 0)

		for ts := start; ts.Before(end); ts = ts.AddDate(0, 1, 0) {
			pName := fmt.Sprintf("%s_p%04d%02d", spec.TableName, ts.Year(), int(ts.Month()))
			from := ts.Format("2006-01-02")
			to := ts.AddDate(0, 1, 0).Format("2006-01-02")

			pStmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %q PARTITION OF %q FOR VALUES FROM ('%s') TO ('%s')`,
				pName, spec.TableName, from, to)
			if err := db.Exec(pStmt).Error; err != nil {
				return err
			}
		}
	}
	return nil
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
