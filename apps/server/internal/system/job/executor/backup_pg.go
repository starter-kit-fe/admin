package executor

import (
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strings"

	"github.com/starter-kit-fe/admin/internal/config"
)

func performBackup(ctx context.Context, cfg *config.Config, params *BackupParams, outputPath string) error {
	args := []string{
		"--format=plain",
		"--no-owner",
		"--no-acl",
	}

	for _, schema := range params.IncludeSchemas {
		args = append(args, fmt.Sprintf("--schema=%s", schema))
	}
	for _, table := range params.ExcludeTables {
		args = append(args, fmt.Sprintf("--exclude-table=%s", table))
	}

	dbName := params.Database
	if dbName == "" {
		dbName = extractDatabaseName(cfg)
	}
	args = append(args, dbName)

	cmd := exec.CommandContext(ctx, "pg_dump", args...)
	cmd.Env = append(os.Environ(), buildPgEnv(cfg)...)

	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create backup file: %w", err)
	}
	defer file.Close()

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	var gzipWriter *gzip.Writer
	if params.Compress {
		gzipWriter = gzip.NewWriter(file)
		cmd.Stdout = gzipWriter
	} else {
		cmd.Stdout = file
	}

	runErr := cmd.Run()
	if gzipWriter != nil {
		if closeErr := gzipWriter.Close(); runErr == nil && closeErr != nil {
			runErr = closeErr
		}
	}

	if runErr != nil {
		_ = os.Remove(outputPath)
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg != "" {
			return fmt.Errorf("pg_dump failed: %w, stderr: %s", runErr, errMsg)
		}
		return fmt.Errorf("pg_dump failed: %w", runErr)
	}

	return nil
}

func buildPgEnv(cfg *config.Config) []string {
	parsed, err := url.Parse(cfg.Database.DSN)
	if err != nil {
		return nil
	}

	env := make([]string, 0, 4)

	if parsed.User != nil {
		if user := parsed.User.Username(); user != "" {
			env = append(env, "PGUSER="+user)
		}
		if pass, ok := parsed.User.Password(); ok {
			env = append(env, "PGPASSWORD="+pass)
		}
	}

	if host := parsed.Hostname(); host != "" {
		env = append(env, "PGHOST="+host)
	}
	port := parsed.Port()
	if port == "" && parsed.Hostname() != "" {
		port = "5432"
	}
	if port != "" {
		env = append(env, "PGPORT="+port)
	}

	return env
}

func extractDatabaseName(cfg *config.Config) string {
	parsed, err := url.Parse(cfg.Database.DSN)
	if err != nil {
		return "admin"
	}

	db := strings.TrimPrefix(parsed.Path, "/")
	if db != "" {
		return db
	}
	if name := parsed.Query().Get("dbname"); name != "" {
		return name
	}
	return "admin"
}
