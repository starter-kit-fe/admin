package router

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/handler"
)

type Options struct {
	Logger        *slog.Logger
	HealthHandler *handler.HealthHandler
}

func New(opts Options) *gin.Engine {
	if opts.Logger != nil {
		gin.DefaultWriter = slog.NewLogLogger(opts.Logger.Handler(), slog.LevelInfo).Writer()
	}

	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(requestLogger(opts.Logger))

	if opts.HealthHandler != nil {
		opts.HealthHandler.Register(engine)
	}

	return engine
}

func requestLogger(logger *slog.Logger) gin.HandlerFunc {
	if logger == nil {
		return gin.Logger()
	}

	return func(ctx *gin.Context) {
		start := time.Now()
		ctx.Next()
		logger.Info("request",
			"method", ctx.Request.Method,
			"path", ctx.Request.URL.Path,
			"status", ctx.Writer.Status(),
			"duration", time.Since(start).String(),
			"ip", ctx.ClientIP(),
		)
	}
}
