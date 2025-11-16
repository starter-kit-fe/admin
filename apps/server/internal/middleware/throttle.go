package middleware

import (
	"log/slog"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"github.com/starter-kit-fe/admin/pkg/netutil"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type KeyFunc func(*gin.Context) string

type clientLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

func NewThrottleMiddleware(limit rate.Limit, burst int, keyFn KeyFunc, logger *slog.Logger) gin.HandlerFunc {
	if limit <= 0 {
		return func(ctx *gin.Context) {
			ctx.Next()
		}
	}

	if burst <= 0 {
		burst = 1
	}

	var (
		mu       sync.Mutex
		limiters = make(map[string]*clientLimiter)
	)

	cleanup := func() {
		const ttl = 15 * time.Minute
		now := time.Now()
		for key, entry := range limiters {
			if now.Sub(entry.lastSeen) > ttl {
				delete(limiters, key)
			}
		}
	}

	return func(ctx *gin.Context) {
		key := "global"
		if keyFn != nil {
			if v := keyFn(ctx); v != "" {
				key = v
			}
		} else if ip := netutil.RealIPFromContext(ctx); ip != "" {
			key = ip
		}

		mu.Lock()
		entry, exists := limiters[key]
		if !exists {
			entry = &clientLimiter{
				limiter:  rate.NewLimiter(limit, burst),
				lastSeen: time.Now(),
			}
			limiters[key] = entry
		}
		entry.lastSeen = time.Now()
		if len(limiters) > 1024 {
			cleanup()
		}
		mu.Unlock()

		if !entry.limiter.Allow() {
			if logger != nil {
				logger.Warn("request throttled", "key", key)
			}
			resp.TooManyRequests(ctx, resp.WithMessage("too many requests"))
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
