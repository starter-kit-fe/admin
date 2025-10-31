package app

import (
	"log/slog"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/logger"
)

func setupLogger(cfg *config.Config) *slog.Logger {
	gin.SetMode(cfg.App.Mode)
	appLogger := logger.NewLogger(gin.Mode(), cfg.Log.Level)
	slog.SetDefault(appLogger)
	return appLogger
}
