package main

import (
	"context"
	"fmt"
	"log/slog"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/spf13/cobra"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/db"
	"github.com/starter-kit-fe/admin/internal/handler"
	"github.com/starter-kit-fe/admin/internal/logger"
	"github.com/starter-kit-fe/admin/internal/router"
	healthservice "github.com/starter-kit-fe/admin/internal/service/health"
)

var (
	addrFlag     string
	logLevelFlag string
)

var cmdStart = &cobra.Command{
	Use:   "start",
	Short: "Start the server",
	RunE:  start,
}

func init() {
	cmdStart.Flags().StringVar(&addrFlag, "addr", constant.PORT, "HTTP listen address, e.g. :8000")
	cmdStart.Flags().StringVar(&logLevelFlag, "log-level", "info", "Log level: debug, info, warn, error")
	rootCmd.AddCommand(cmdStart)
}

func start(cmd *cobra.Command, args []string) error {
	config.MustLoad()

	if addrFlag == "" {
		addrFlag = constant.PORT
	}

	gin.SetMode(constant.MODE)
	appLogger := logger.NewLogger(gin.Mode(), logLevelFlag)
	slog.SetDefault(appLogger)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var (
		sqlDB   *gorm.DB
		redisDB *redis.Client
		err     error
	)

	if constant.DBURL != "" {
		sqlDB, err = db.LoadPostgres(constant.DBURL)
		if err != nil {
			appLogger.Error("failed to connect postgres", "error", err)
			return err
		}
		appLogger.Info("connected to postgres")
	}

	if constant.REDISURL != "" {
		redisDB, err = db.LoadRedis(ctx, constant.REDISURL)
		if err != nil {
			appLogger.Error("failed to connect redis", "error", err)
			return err
		}
		appLogger.Info("connected to redis")
	}

	healthSvc := healthservice.New(sqlDB, redisDB)
	healthHandler := handler.NewHealthHandler(healthSvc)

	engine := router.New(router.Options{
		Logger:        appLogger,
		HealthHandler: healthHandler,
	})

	addr := addrFlag
	if addr[0] != ':' {
		addr = fmt.Sprintf(":%s", addr)
	}

	appLogger.Info("server listening", "addr", addr)
	if err := engine.Run(addr); err != nil && err != context.Canceled {
		appLogger.Error("server stopped", "error", err)
		return err
	}

	if sqlDB != nil {
		if raw, err := sqlDB.DB(); err == nil {
			raw.Close()
		}
	}
	if redisDB != nil {
		_ = redisDB.Close()
	}

	appLogger.Info("shutdown complete")
	return nil
}
