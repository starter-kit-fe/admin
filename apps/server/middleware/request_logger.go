package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger logs basic request/response metadata with the provided slog logger.
func RequestLogger(logger *slog.Logger) gin.HandlerFunc {
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
