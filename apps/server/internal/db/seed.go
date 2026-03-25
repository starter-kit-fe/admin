package db

import (
	"bufio"
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"strings"
	"time"

	_ "embed"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/model"
)

//go:embed seed_data.sql
var seedSQL string

func SeedDefaults(ctx context.Context, db *gorm.DB, logger *slog.Logger) error {
	if db == nil {
		return errors.New("gorm db is nil")
	}

	prefix := constant.DB_PREFIX
	seeded := false
	statementCount := 0

	exists, err := alreadySeeded(ctx, db, prefix)
	if err != nil {
		return fmt.Errorf("check seed data: %w", err)
	}
	if exists {
		if logger != nil {
			logger.Info("skipping default seed; data already present")
		}
	} else {
		statements := buildSeedStatements(prefix)
		if len(statements) == 0 {
			if logger != nil {
				logger.Warn("no seed statements generated")
			}
		} else {
			tx := db.WithContext(ctx)
			for _, stmt := range statements {
				if err := tx.Exec(stmt).Error; err != nil {
					return fmt.Errorf("execute seed statement: %w", err)
				}
			}

			roleMenuTable := prefix + "sys_role_menu"
			menuTable := prefix + "sys_menu"
			roleDeptTable := prefix + "sys_role_dept"
			deptTable := prefix + "sys_dept"

			sqlRoleMenu := fmt.Sprintf("INSERT INTO %s (role_id, menu_id) SELECT 1, id FROM %s ON CONFLICT DO NOTHING;", roleMenuTable, menuTable)
			sqlRoleDept := fmt.Sprintf("INSERT INTO %s (role_id, dept_id) SELECT 1, id FROM %s ON CONFLICT DO NOTHING;", roleDeptTable, deptTable)

			if tx.Dialector.Name() == "mysql" {
				sqlRoleMenu = fmt.Sprintf("INSERT IGNORE INTO %s (role_id, menu_id) SELECT 1, id FROM %s;", roleMenuTable, menuTable)
				sqlRoleDept = fmt.Sprintf("INSERT IGNORE INTO %s (role_id, dept_id) SELECT 1, id FROM %s;", roleDeptTable, deptTable)
			} else if tx.Dialector.Name() == "sqlite" {
				sqlRoleMenu = fmt.Sprintf("INSERT OR IGNORE INTO %s (role_id, menu_id) SELECT 1, id FROM %s;", roleMenuTable, menuTable)
				sqlRoleDept = fmt.Sprintf("INSERT OR IGNORE INTO %s (role_id, dept_id) SELECT 1, id FROM %s;", roleDeptTable, deptTable)
			}

			if err := tx.Exec(sqlRoleMenu).Error; err != nil {
				return fmt.Errorf("seed role menus: %w", err)
			}
			if err := tx.Exec(sqlRoleDept).Error; err != nil {
				return fmt.Errorf("seed role depts: %w", err)
			}

			if err := seedAdminUser(ctx, db, prefix, logger); err != nil {
				return fmt.Errorf("seed admin user: %w", err)
			}

			seeded = true
			statementCount = len(statements)
		}
	}

	if seeded && logger != nil {
		logger.Info("seeded default data", "statements", statementCount)
	}

	if err := syncSequences(ctx, db, prefix, logger); err != nil {
		return fmt.Errorf("sync sequences: %w", err)
	}

	return nil
}

// seedAdminUser generates a random password for the initial admin account,
// creates the user, and prints the credentials to the logger.
func seedAdminUser(ctx context.Context, db *gorm.DB, prefix string, logger *slog.Logger) error {
	password, err := generatePassword(16)
	if err != nil {
		return fmt.Errorf("generate admin password: %w", err)
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}

	now := time.Now()
	deptID := int64(100)
	remark := "系统初始化管理员"
	user := model.SysUser{
		DeptID:        &deptID,
		UserName:      "admin",
		NickName:      "超级管理员",
		UserType:      "00",
		Email:         "",
		Phonenumber:   "",
		Sex:           "1",
		Avatar:        "",
		Password:      string(hashed),
		Status:        "0",
		LoginIP:       "127.0.0.1",
		LoginDate:     &now,
		PwdUpdateDate: &now,
		CreateBy:      "system",
		Remark:        &remark,
	}

	userTable := prefix + "sys_user"
	if err := db.WithContext(ctx).Table(userTable).Create(&user).Error; err != nil {
		return fmt.Errorf("insert admin user: %w", err)
	}

	userRoleTable := prefix + "sys_user_role"
	if err := db.WithContext(ctx).Table(userRoleTable).
		Exec(fmt.Sprintf("INSERT INTO %s (user_id, role_id) VALUES (?, 1)", userRoleTable), user.ID).Error; err != nil {
		return fmt.Errorf("assign admin role: %w", err)
	}

	userPostTable := prefix + "sys_user_post"
	if err := db.WithContext(ctx).Table(userPostTable).
		Exec(fmt.Sprintf("INSERT INTO %s (user_id, post_id) VALUES (?, 1)", userPostTable), user.ID).Error; err != nil {
		return fmt.Errorf("assign admin post: %w", err)
	}

	if logger != nil {
		logger.Info("════════════════════════════════════════════")
		logger.Info("  INITIAL ADMIN ACCOUNT CREATED")
		logger.Info("  Username : admin")
		logger.Info("  Password : " + password)
		logger.Info("  Please change the password after first login.")
		logger.Info("════════════════════════════════════════════")
	}

	return nil
}

const passwordChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

func generatePassword(length int) (string, error) {
	buf := make([]byte, length)
	charLen := big.NewInt(int64(len(passwordChars)))
	for i := range buf {
		n, err := rand.Int(rand.Reader, charLen)
		if err != nil {
			return "", err
		}
		buf[i] = passwordChars[n.Int64()]
	}
	return string(buf), nil
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

func alreadySeeded(ctx context.Context, db *gorm.DB, prefix string) (bool, error) {
	table := prefix + "sys_user"
	var count int64

	if err := db.WithContext(ctx).Table(table).Count(&count).Error; err != nil {
		if isTableMissingErr(err) {
			return false, nil
		}
		return false, err
	}
	return count > 0, nil
}

func syncSequences(ctx context.Context, db *gorm.DB, prefix string, logger *slog.Logger) error {
	sequenceTargets := map[string]string{
		"sys_dept":       "id",
		"sys_user":       "id",
		"sys_post":       "id",
		"sys_role":       "id",
		"sys_menu":       "id",
		"sys_dict_type":  "id",
		"sys_dict_data":  "dict_code",
		"sys_config":     "id",
		"sys_logininfor": "id",
		"sys_oper_log":   "id",
		"sys_job":        "job_name",
		"sys_job_log":    "id",
		"sys_notice":     "id",
	}

	for table, column := range sequenceTargets {
		fullTable := prefix + table
		if err := ensureSequenceOffset(ctx, db, fullTable, column); err != nil {
			if isTableMissingErr(err) {
				if logger != nil {
					logger.Warn("skip sequence sync; table missing", "table", fullTable)
				}
				continue
			}
			return fmt.Errorf("ensure sequence for %s: %w", fullTable, err)
		}
	}

	if logger != nil {
		logger.Info("sequence offsets synchronized", "tables", len(sequenceTargets))
	}
	return nil
}

func ensureSequenceOffset(ctx context.Context, db *gorm.DB, table, column string) error {
	if db.Dialector.Name() != "postgres" {
		return nil
	}

	var seqName sql.NullString
	if err := db.WithContext(ctx).
		Raw("SELECT pg_get_serial_sequence(?, ?) AS seq_name", table, column).
		Scan(&seqName).Error; err != nil {
		return err
	}

	if !seqName.Valid || strings.TrimSpace(seqName.String) == "" {
		return nil
	}

	maxSQL := fmt.Sprintf("SELECT COALESCE(MAX(%s), 0) AS max_id FROM %s", column, table)
	var maxValue sql.NullInt64
	if err := db.WithContext(ctx).Raw(maxSQL).Scan(&maxValue).Error; err != nil {
		return err
	}

	target := int64(0)
	if maxValue.Valid {
		target = maxValue.Int64
	}

	if target <= 0 {
		return db.WithContext(ctx).Exec("SELECT setval(?, 1, false)", seqName.String).Error
	}

	return db.WithContext(ctx).Exec("SELECT setval(?, ?, true)", seqName.String, target).Error
}

func isTableMissingErr(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "does not exist")
}
