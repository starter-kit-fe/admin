package db

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	_ "embed"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
)

//go:embed seed_data.sql
var seedSQL string

func SeedDefaults(ctx context.Context, db *gorm.DB, logger *slog.Logger) error {
	if db == nil {
		return errors.New("gorm db is nil")
	}

	prefix := constant.DB_PREFIX
	statements := buildSeedStatements(prefix)
	if len(statements) == 0 {
		if logger != nil {
			logger.Warn("no seed statements generated")
		}
		return nil
	}

	tx := db.WithContext(ctx)
	for _, stmt := range statements {
		if err := tx.Exec(stmt).Error; err != nil {
			return fmt.Errorf("execute seed statement: %w", err)
		}
	}

	roleMenuTable := prefix + "sys_role_menu"
	menuTable := prefix + "sys_menu"
	if err := tx.Exec(fmt.Sprintf("INSERT INTO %s (role_id, menu_id) SELECT 1, menu_id FROM %s ON CONFLICT DO NOTHING;", roleMenuTable, menuTable)).Error; err != nil {
		return fmt.Errorf("seed role menus: %w", err)
	}

	roleDeptTable := prefix + "sys_role_dept"
	deptTable := prefix + "sys_dept"
	if err := tx.Exec(fmt.Sprintf("INSERT INTO %s (role_id, dept_id) SELECT 1, dept_id FROM %s ON CONFLICT DO NOTHING;", roleDeptTable, deptTable)).Error; err != nil {
		return fmt.Errorf("seed role depts: %w", err)
	}

	if logger != nil {
		logger.Info("seeded default data", "statements", len(statements))
	}

	return nil
}

func buildSeedStatements(prefix string) []string {
	const insertPrefix = "insert into "

	scanner := bufio.NewScanner(strings.NewReader(seedSQL))
	scanner.Buffer(make([]byte, 0, 1024), 1024*1024)

	var statements []string
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}

		lower := strings.ToLower(line)
		if !strings.HasPrefix(lower, insertPrefix) {
			continue
		}

		idx := strings.Index(lower, " values")
		if idx == -1 {
			continue
		}

		tableName := strings.TrimSpace(line[len(insertPrefix):idx])
		if !strings.HasPrefix(strings.ToLower(tableName), "sys_") {
			continue
		}

		suffix := line[idx:]
		statement := fmt.Sprintf("INSERT INTO %s%s%s", prefix, tableName, suffix)
		statement = strings.ReplaceAll(statement, "sysdate()", "NOW()")
		statement = strings.ReplaceAll(statement, "\\'", "''")
		statement = strings.TrimSuffix(statement, ";")
		statement = normalizeSeedStatement(tableName, statement)
		statement += " ON CONFLICT DO NOTHING;"
		statements = append(statements, statement)
	}

	return statements
}

var booleanColumnPositions = map[string][]int{
	"sys_role": {5, 6},
	"sys_menu": {8, 9},
}

func normalizeSeedStatement(tableName, statement string) string {
	positions, ok := booleanColumnPositions[strings.ToLower(tableName)]
	if !ok {
		return statement
	}

	lowerStmt := strings.ToLower(statement)
	valuesIdx := strings.Index(lowerStmt, " values")
	if valuesIdx == -1 {
		return statement
	}

	prefix := statement[:valuesIdx+len(" VALUES")]
	valueSection := strings.TrimSpace(statement[valuesIdx+len(" VALUES"):])
	if !strings.HasPrefix(valueSection, "(") {
		return statement
	}

	closeIdx := strings.LastIndex(valueSection, ")")
	if closeIdx == -1 {
		return statement
	}

	valueBody := valueSection[1:closeIdx]
	values := splitSQLValues(valueBody)

	for _, pos := range positions {
		if pos >= len(values) {
			continue
		}
		switch strings.TrimSpace(strings.ToLower(values[pos])) {
		case "1", "'1'":
			values[pos] = "TRUE"
		case "0", "'0'":
			values[pos] = "FALSE"
		}
	}

	newBody := "(" + strings.Join(values, ", ") + ")" + valueSection[closeIdx+1:]
	return prefix + " " + newBody
}

func splitSQLValues(s string) []string {
	var (
		result []string
		buf    strings.Builder
		inStr  bool
		escape bool
	)

	for _, r := range s {
		switch {
		case escape:
			buf.WriteRune(r)
			escape = false
		case r == '\\':
			buf.WriteRune(r)
			escape = true
		case r == '\'':
			inStr = !inStr
			buf.WriteRune(r)
		case r == ',' && !inStr:
			result = append(result, strings.TrimSpace(buf.String()))
			buf.Reset()
		default:
			buf.WriteRune(r)
		}
	}
	if buf.Len() > 0 {
		result = append(result, strings.TrimSpace(buf.String()))
	}
	return result
}
