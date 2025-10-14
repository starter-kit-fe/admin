package infra

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
)

func NewLogger(env string, level string) *slog.Logger {
	var h slog.Handler
	lvl := new(slog.LevelVar)

	switch level {
	case "debug":
		lvl.Set(slog.LevelDebug)
	case "warn":
		lvl.Set(slog.LevelWarn)
	case "error":
		lvl.Set(slog.LevelError)
	default:
		lvl.Set(slog.LevelInfo)
	}

	if env == gin.ReleaseMode {
		// 生产：JSON 输出，适合 ELK / Loki / Cloud Logging
		h = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
	} else {
		// 开发：彩色文本输出
		h = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
	}

	return slog.New(h)
}
