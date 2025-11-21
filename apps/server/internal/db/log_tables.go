package db

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

const (
	logRetentionMonths    = 6
	logPrecreateMonths    = 2
	logDropLookbackMonths = 48
	partitionDateLayout   = "2006-01-02"
)

func ensureLogTables(db *gorm.DB) error {
	if db == nil {
		return errors.New("gorm db is nil")
	}

	switch db.Dialector.Name() {
	case "postgres":
		if err := ensurePartitionedOperLogTable(db); err != nil {
			return err
		}
		if err := ensurePartitionedLoginLogTable(db); err != nil {
			return err
		}
		return nil
	default:
		return db.AutoMigrate(&model.SysOperLog{}, &model.SysLogininfor{})
	}
}

func ensurePartitionedOperLogTable(db *gorm.DB) error {
	spec := model.OperLogTableSpec()
	return ensureRangePartitionedTable(db, spec)
}

func ensurePartitionedLoginLogTable(db *gorm.DB) error {
	spec := model.LoginLogTableSpec()
	return ensureRangePartitionedTable(db, spec)
}

func ensureRangePartitionedTable(db *gorm.DB, spec model.LogTableSpec) error {
	exists, err := tableExists(db, spec.TableName)
	if err != nil {
		return err
	}

	if !exists {
		if err := createPartitionedTable(db, spec); err != nil {
			return err
		}
	} else {
		partitioned, err := isPartitionedTable(db, spec.TableName)
		if err != nil {
			return err
		}
		if !partitioned {
			if err := convertToPartitionedTable(db, spec); err != nil {
				return err
			}
		}
	}

	if err := ensureIndexes(db, spec); err != nil {
		return err
	}
	if err := ensurePartitions(db, spec, nil, nil); err != nil {
		return err
	}

	return analyzeTable(db, spec.TableName)
}

func createPartitionedTable(db *gorm.DB, spec model.LogTableSpec) error {
	stmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (%s) PARTITION BY RANGE (%s)`,
		quoteIdent(spec.TableName), strings.TrimSpace(spec.ColumnsSQL), quoteIdent(spec.TimeColumn))
	if err := db.Exec(stmt).Error; err != nil {
		return err
	}

	return applyLogTableStorageSettings(db, spec.TableName)
}

func convertToPartitionedTable(db *gorm.DB, spec model.LogTableSpec) error {
	legacyName := spec.TableName + "_legacy"
	if exists, err := tableExists(db, legacyName); err != nil {
		return err
	} else if exists {
		return fmt.Errorf("temporary table %s already exists; remove it before re-running migration", legacyName)
	}

	renameSQL := fmt.Sprintf(`ALTER TABLE %s RENAME TO %s`, quoteIdent(spec.TableName), quoteIdent(legacyName))
	if err := db.Exec(renameSQL).Error; err != nil {
		return err
	}

	if err := createPartitionedTable(db, spec); err != nil {
		return err
	}

	var minTime, maxTime *time.Time
	boundsSQL := fmt.Sprintf(`SELECT MIN(%s), MAX(%s) FROM %s`,
		quoteIdent(spec.TimeColumn), quoteIdent(spec.TimeColumn), quoteIdent(legacyName))
	if err := db.Raw(boundsSQL).Row().Scan(&minTime, &maxTime); err != nil {
		return err
	}

	if err := ensurePartitions(db, spec, minTime, maxTime); err != nil {
		return err
	}

	if err := copyLegacyData(db, spec, legacyName); err != nil {
		return err
	}

	dropSQL := fmt.Sprintf(`DROP TABLE %s`, quoteIdent(legacyName))
	if err := db.Exec(dropSQL).Error; err != nil {
		return err
	}

	return nil
}

func copyLegacyData(db *gorm.DB, spec model.LogTableSpec, legacyName string) error {
	if len(spec.Columns) == 0 {
		return nil
	}

	var count int64
	countSQL := fmt.Sprintf(`SELECT COUNT(*) FROM %s`, quoteIdent(legacyName))
	if err := db.Raw(countSQL).Scan(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return nil
	}

	quotedCols := make([]string, len(spec.Columns))
	for i, col := range spec.Columns {
		quotedCols[i] = quoteIdent(col)
	}
	columnList := strings.Join(quotedCols, ", ")

	insertSQL := fmt.Sprintf(`INSERT INTO %s (%s) SELECT %s FROM %s`,
		quoteIdent(spec.TableName), columnList, columnList, quoteIdent(legacyName))
	if err := db.Exec(insertSQL).Error; err != nil {
		return err
	}

	return setIdentitySequence(db, spec.TableName, spec.IDColumn)
}

func applyLogTableStorageSettings(db *gorm.DB, tableName string) error {
	params := []storageParameter{
		{name: "autovacuum_vacuum_scale_factor", value: "0.0"},
		{name: "autovacuum_vacuum_threshold", value: "0"},
		{name: "autovacuum_analyze_scale_factor", value: "0.02"},
		{name: "autovacuum_analyze_threshold", value: "50"},
		{name: "toast.autovacuum_vacuum_scale_factor", value: "0.0"},
		{name: "toast.autovacuum_analyze_scale_factor", value: "0.02"},
	}

	partitioned, err := isPartitionedTable(db, tableName)
	if err != nil {
		return err
	}

	targets := []string{tableName}
	if partitioned {
		partitions, err := listTablePartitions(db, tableName)
		if err != nil {
			return err
		}
		if len(partitions) == 0 {
			return nil
		}
		targets = partitions
	}

	for _, target := range targets {
		if err := setTableStorageParameters(db, target, params); err != nil {
			return err
		}
	}

	return nil
}

type storageParameter struct {
	name  string
	value string
}

func setTableStorageParameters(db *gorm.DB, tableName string, params []storageParameter) error {
	for _, param := range params {
		stmt := fmt.Sprintf(`ALTER TABLE %s SET (%s = %s)`, quoteIdent(tableName), param.name, param.value)
		if err := db.Exec(stmt).Error; err != nil {
			if isIgnorableStorageParameterError(err) {
				log.Printf("db: skipping storage parameter %s for %s: %v", param.name, tableName, err)
				continue
			}
			return err
		}
	}
	return nil
}

func isIgnorableStorageParameterError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "cannot specify storage parameters for a partitioned table") ||
		strings.Contains(msg, "unrecognized parameter") ||
		strings.Contains(msg, "unrecognized storage parameter")
}

func ensureIndexes(db *gorm.DB, spec model.LogTableSpec) error {
	for _, idx := range spec.Indexes {
		if strings.TrimSpace(idx.Name) == "" || len(idx.Columns) == 0 {
			continue
		}
		stmt := buildIndexSQL(spec.TableName, idx)
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}
	}
	return nil
}

func buildIndexSQL(tableName string, idx model.LogIndexSpec) string {
	columns := make([]string, len(idx.Columns))
	for i, col := range idx.Columns {
		columns[i] = quoteIdent(col)
	}

	usingClause := ""
	if uc := strings.TrimSpace(idx.Using); uc != "" {
		usingClause = fmt.Sprintf(" USING %s", strings.ToUpper(uc))
	}

	return fmt.Sprintf(`CREATE INDEX IF NOT EXISTS %s ON %s%s (%s)`,
		quoteIdent(idx.Name), quoteIdent(tableName), usingClause, strings.Join(columns, ", "))
}

func ensurePartitions(db *gorm.DB, spec model.LogTableSpec, historyStart, historyEnd *time.Time) error {
	now := time.Now().UTC()
	start := floorMonth(now.AddDate(0, -logRetentionMonths, 0))
	end := floorMonth(now.AddDate(0, logPrecreateMonths+1, 0))

	if historyStart != nil {
		hs := floorMonth(historyStart.UTC())
		if hs.Before(start) {
			start = hs
		}
	}
	if historyEnd != nil {
		he := floorMonth(historyEnd.UTC().AddDate(0, 1, 0))
		if he.After(end) {
			end = he
		}
	}

	for ts := start; ts.Before(end); ts = ts.AddDate(0, 1, 0) {
		name := partitionName(spec.TableName, ts)
		from := ts.Format(partitionDateLayout)
		to := ts.AddDate(0, 1, 0).Format(partitionDateLayout)

		stmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s PARTITION OF %s FOR VALUES FROM ('%s') TO ('%s')`,
			quoteIdent(name), quoteIdent(spec.TableName), from, to)
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}
	}

	dropStart := floorMonth(now.AddDate(0, -logDropLookbackMonths, 0))
	dropEnd := floorMonth(now.AddDate(0, -logRetentionMonths, 0))
	for ts := dropStart; ts.Before(dropEnd); ts = ts.AddDate(0, 1, 0) {
		name := partitionName(spec.TableName, ts)
		stmt := fmt.Sprintf(`DROP TABLE IF EXISTS %s`, quoteIdent(name))
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}
	}

	if err := applyLogTableStorageSettings(db, spec.TableName); err != nil {
		return err
	}

	return nil
}

func analyzeTable(db *gorm.DB, tableName string) error {
	stmt := fmt.Sprintf(`ANALYZE %s`, quoteIdent(tableName))
	return db.Exec(stmt).Error
}

func setIdentitySequence(db *gorm.DB, tableName, column string) error {
	if tableName == "" || column == "" {
		return nil
	}
	stmt := fmt.Sprintf(`SELECT setval(pg_get_serial_sequence(%s, %s), COALESCE((SELECT MAX(%s) FROM %s), 0))`,
		quoteLiteral(tableName), quoteLiteral(column), quoteIdent(column), quoteIdent(tableName))
	return db.Exec(stmt).Error
}

func tableExists(db *gorm.DB, tableName string) (bool, error) {
	if strings.TrimSpace(tableName) == "" {
		return false, errors.New("table name is required")
	}
	var exists bool
	query := `
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = ?
)`
	if err := db.Raw(query, tableName).Scan(&exists).Error; err != nil {
		return false, err
	}
	return exists, nil
}

func isPartitionedTable(db *gorm.DB, tableName string) (bool, error) {
	var relkind string
	query := `SELECT COALESCE(relkind, '') FROM pg_class WHERE oid = to_regclass(?)`
	if err := db.Raw(query, tableName).Scan(&relkind).Error; err != nil {
		return false, err
	}
	return relkind == "p", nil
}

func listTablePartitions(db *gorm.DB, tableName string) ([]string, error) {
	if strings.TrimSpace(tableName) == "" {
		return nil, errors.New("table name is required")
	}

	query := `
SELECT c.relname
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
JOIN pg_namespace pn ON pn.oid = p.relnamespace
WHERE p.relname = ?
  AND pn.nspname = current_schema()
ORDER BY c.relname`

	var partitions []string
	if err := db.Raw(query, tableName).Scan(&partitions).Error; err != nil {
		return nil, err
	}

	return partitions, nil
}

func floorMonth(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.UTC)
}

func partitionName(tableName string, ts time.Time) string {
	return fmt.Sprintf("%s_p%04d%02d", tableName, ts.Year(), int(ts.Month()))
}

func quoteIdent(ident string) string {
	ident = strings.ReplaceAll(ident, "\"", "\"\"")
	return fmt.Sprintf("\"%s\"", ident)
}

func quoteLiteral(value string) string {
	value = strings.ReplaceAll(value, "'", "''")
	return fmt.Sprintf("'%s'", value)
}
