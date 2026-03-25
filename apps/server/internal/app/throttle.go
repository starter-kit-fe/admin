package app

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/middleware"
)

func buildThrottle(cfg *config.Config, logger *slog.Logger) gin.HandlerFunc {
	var limit rate.Limit
	if cfg.Security.RateLimit.Requests > 0 && cfg.Security.RateLimit.Period > 0 {
		limit = rate.Limit(float64(cfg.Security.RateLimit.Requests) / cfg.Security.RateLimit.Period.Seconds())
	}
	return middleware.NewThrottleMiddleware(limit, cfg.Security.RateLimit.Burst, nil, logger)
}
