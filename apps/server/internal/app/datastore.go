package app

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/db"
)

func initDatabase(ctx context.Context, cfg *config.Config, logger *slog.Logger) (*gorm.DB, error) {
	if cfg.Database.DSN == "" {
		logger.Info("postgres connection disabled")
		return nil, nil
	}

	sqlDB, err := db.LoadPostgres(cfg.Database.DSN)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	if err := db.AutoMigrate(sqlDB); err != nil {
		return nil, fmt.Errorf("auto migrate postgres: %w", err)
	}
	if err := db.SeedDefaults(ctx, sqlDB, logger); err != nil {
		return nil, fmt.Errorf("seed defaults: %w", err)
	}
	logger.Info("connected to postgres")

	return sqlDB, nil
}

func initCache(ctx context.Context, cfg *config.Config, logger *slog.Logger) (*redis.Client, error) {
	if cfg.Redis.URL == "" {
		logger.Info("redis connection disabled")
		return nil, nil
	}

	redisCache, err := db.LoadRedis(ctx, cfg.Redis.URL)
	if err != nil {
		return nil, fmt.Errorf("connect redis: %w", err)
	}
	logger.Info("connected to redis")

	return redisCache, nil
}
