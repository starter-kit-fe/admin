package test

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/starter-kit-fe/admin/internal/app"
	"github.com/starter-kit-fe/admin/internal/config"
)

// SetupApp initializes the application for testing with in-memory SQLite and Miniredis
func SetupApp(t *testing.T) (*app.App, *miniredis.Miniredis) {
	gin.SetMode(gin.TestMode)

	// Start miniredis
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("failed to start miniredis: %v", err)
	}
	// Ensure miniredis is closed when test ends
	t.Cleanup(func() {
		mr.Close()
	})

	// Construct test config
	cfg := &config.Config{
		App: config.AppConfig{
			Mode: "test",
			Name: "test-app",
		},
		HTTP: config.HTTPConfig{
			Addr: ":8080",
		},
		Log: config.LogConfig{
			Level: "error", // Reduce noise during tests
		},
		Database: config.DatabaseConfig{
			Driver: "sqlite",
			DSN:    ":memory:",
		},
		Redis: config.RedisConfig{
			URL: "redis://" + mr.Addr(),
		},
		Auth: config.AuthConfig{
			Secret:          "test-secret-key-must-be-long-enough",
			TokenDuration:   time.Hour,
			RefreshDuration: 24 * time.Hour,
			SessionUpdate:   time.Minute,
			CookieName:      "auth_token",
			RefreshCookie:   "refresh_token",
		},
		Security: config.SecurityConfig{
			RateLimit: config.RateLimitConfig{
				Requests: 100,
				Burst:    100,
				Period:   time.Minute,
			},
		},
	}
	cfg.Normalize()

	// Create app instance
	application, err := app.New(context.Background(), app.Options{Config: cfg})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	return application, mr
}
