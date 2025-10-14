package health

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Service struct {
	db    *gorm.DB
	cache *redis.Client
}

func New(db *gorm.DB, cache *redis.Client) *Service {
	return &Service{db: db, cache: cache}
}

func (s *Service) Status(ctx context.Context) map[string]string {
	status := map[string]string{
		"database": "disabled",
		"cache":    "disabled",
		"uptime":   time.Now().UTC().Format(time.RFC3339),
	}

	if s.db != nil {
		sqlDB, err := s.db.DB()
		if err == nil {
			if err = sqlDB.PingContext(ctx); err == nil {
				status["database"] = "ok"
			} else {
				status["database"] = err.Error()
			}
		} else {
			status["database"] = err.Error()
		}
	}

	if s.cache != nil {
		if err := s.cache.Ping(ctx).Err(); err == nil {
			status["cache"] = "ok"
		} else {
			status["cache"] = err.Error()
		}
	}

	return status
}
