package app

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/system/job"
)

type Options struct {
	Config *config.Config
}

type App struct {
	// 配置及服务依赖，生命周期绑定在 App 内
	cfg    *config.Config
	logger *slog.Logger
	server *http.Server
	db     *gorm.DB
	cache  *redis.Client
	jobs   *job.Service
}

func New(ctx context.Context, opts Options) (*App, error) {
	if opts.Config == nil {
		return nil, errors.New("config is required")
	}
	ctx = ensureContext(ctx)

	cfg := opts.Config
	cfg.Normalize()

	appLogger := setupLogger(cfg)

	sqlDB, err := initDatabase(ctx, cfg, appLogger)
	if err != nil {
		return nil, err
	}

	redisCache, err := initCache(ctx, cfg, appLogger)
	if err != nil {
		return nil, err
	}

	modules := buildModuleSet(cfg, sqlDB, redisCache, appLogger)
	throttleMW := buildThrottle(cfg, appLogger)
	engine := buildRouterEngine(cfg, appLogger, modules, throttleMW)
	server := buildHTTPServer(cfg, engine)

	appInstance := &App{
		cfg:    cfg,
		logger: appLogger,
		server: server,
		db:     sqlDB,
		cache:  redisCache,
		jobs:   modules.jobService,
	}

	if appInstance.jobs != nil {
		if err := appInstance.jobs.Start(ctx); err != nil {
			appInstance.closeResources()
			return nil, err
		}
	}

	return appInstance, nil
}

func ensureContext(ctx context.Context) context.Context {
	if ctx == nil {
		return context.Background()
	}
	return ctx
}

func (a *App) Run(ctx context.Context) error {
	if ctx == nil {
		ctx = context.Background()
	}

	// 监听启动错误，避免阻塞
	serverErrCh := make(chan error, 1)
	go func() {
		a.logger.Info("server listening", "addr", a.server.Addr)
		if err := a.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrCh <- err
			return
		}
		serverErrCh <- nil
	}()

	select {
	case <-ctx.Done():
		// 上下文取消时，优雅关闭 HTTP Server
		shutdownCtx, cancel := context.WithTimeout(context.Background(), constant.SHUTDOWN_TIMEOUT)
		defer cancel()

		if err := a.server.Shutdown(shutdownCtx); err != nil && !errors.Is(err, context.Canceled) {
			a.logger.Error("server shutdown failed", "error", err)
			a.closeResources()
			return err
		}

		if err := <-serverErrCh; err != nil {
			a.logger.Error("server stopped", "error", err)
			a.closeResources()
			return err
		}

		a.closeResources()
		a.logger.Info("shutdown complete")
		return nil
	case err := <-serverErrCh:
		a.closeResources()
		if err != nil {
			a.logger.Error("server stopped", "error", err)
			return err
		}
		a.logger.Info("server stopped")
		return nil
	}
}

func (a *App) closeResources() {
	if a.jobs != nil {
		a.jobs.Stop()
	}
	// 关闭数据库连接池
	if a.db != nil {
		if raw, err := a.db.DB(); err == nil {
			if closeErr := raw.Close(); closeErr != nil {
				a.logger.Error("close postgres connection", "error", closeErr)
			}
		} else {
			a.logger.Error("access sql db handle", "error", err)
		}
	}
	// 关闭缓存客户端
	if a.cache != nil {
		if err := a.cache.Close(); err != nil {
			a.logger.Error("close redis connection", "error", err)
		}
	}
}

// Handler exposes the HTTP handler for testing purposes
func (a *App) Handler() http.Handler {
	return a.server.Handler
}

// DB exposes the database connection for testing purposes
func (a *App) DB() *gorm.DB {
	return a.db
}
