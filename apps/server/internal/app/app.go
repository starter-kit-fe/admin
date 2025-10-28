package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/db"
	"github.com/starter-kit-fe/admin/internal/handler"
	"github.com/starter-kit-fe/admin/internal/logger"
	"github.com/starter-kit-fe/admin/internal/middleware"
	authrepo "github.com/starter-kit-fe/admin/internal/repo/auth"
	deptrepo "github.com/starter-kit-fe/admin/internal/repo/dept"
	dictrepo "github.com/starter-kit-fe/admin/internal/repo/dict"
	menurepo "github.com/starter-kit-fe/admin/internal/repo/menu"
	postrepo "github.com/starter-kit-fe/admin/internal/repo/post"
	rolerepo "github.com/starter-kit-fe/admin/internal/repo/role"
	userrepo "github.com/starter-kit-fe/admin/internal/repo/user"
	"github.com/starter-kit-fe/admin/internal/router"
	captchaservice "github.com/starter-kit-fe/admin/internal/service/captcha"
	deptservice "github.com/starter-kit-fe/admin/internal/service/dept"
	dictservice "github.com/starter-kit-fe/admin/internal/service/dict"
	healthservice "github.com/starter-kit-fe/admin/internal/service/health"
	menuservice "github.com/starter-kit-fe/admin/internal/service/menu"
	postservice "github.com/starter-kit-fe/admin/internal/service/post"
	roleservice "github.com/starter-kit-fe/admin/internal/service/role"
	userservice "github.com/starter-kit-fe/admin/internal/service/user"
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
}

func New(ctx context.Context, opts Options) (*App, error) {
	if opts.Config == nil {
		return nil, errors.New("config is required")
	}
	if ctx == nil {
		ctx = context.Background()
	}

	cfg := opts.Config
	cfg.Normalize()

	// 根据配置调整 Gin 运行模式
	gin.SetMode(cfg.App.Mode)

	// 初始化结构化日志
	appLogger := logger.NewLogger(gin.Mode(), cfg.Log.Level)
	slog.SetDefault(appLogger)

	var (
		sqlDB      *gorm.DB
		redisCache *redis.Client
		err        error
	)

	// 根据配置决定是否连接数据库/缓存
	if cfg.Database.DSN != "" {
		sqlDB, err = db.LoadPostgres(cfg.Database.DSN)
		if err != nil {
			return nil, fmt.Errorf("connect postgres: %w", err)
		}
		if err := db.AutoMigrate(sqlDB); err != nil {
			return nil, fmt.Errorf("auto migrate postgres: %w", err)
		}
		if err := db.SeedDefaults(ctx, sqlDB, appLogger); err != nil {
			return nil, fmt.Errorf("seed defaults: %w", err)
		}
		appLogger.Info("connected to postgres")
	} else {
		appLogger.Info("postgres connection disabled")
	}

	if cfg.Redis.URL != "" {
		redisCache, err = db.LoadRedis(ctx, cfg.Redis.URL)
		if err != nil {
			return nil, fmt.Errorf("connect redis: %w", err)
		}
		appLogger.Info("connected to redis")
	} else {
		appLogger.Info("redis connection disabled")
	}

	healthSvc := healthservice.New(sqlDB, redisCache)
	healthHandler := handler.NewHealthHandler(healthSvc)
	authRepo := authrepo.New(sqlDB)
	docsHandler := handler.NewDocsHandler()
	captchaSvc := captchaservice.New(captchaservice.Options{})
	captchaHandler := handler.NewCaptchaHandler(captchaSvc)
	authHandler := handler.NewAuthHandler(authRepo, captchaSvc, handler.AuthOptions{
		Secret:         cfg.Auth.Secret,
		TokenDuration:  cfg.Auth.TokenDuration,
		CookieName:     cfg.Auth.CookieName,
		CookieDomain:   cfg.Auth.CookieDomain,
		CookiePath:     cfg.Auth.CookiePath,
		CookieSecure:   cfg.Auth.CookieSecure,
		CookieHTTPOnly: cfg.Auth.CookieHTTPOnly,
		CookieSameSite: cfg.Auth.CookieSameSite,
	})
	userRepo := userrepo.New(sqlDB)
	userSvc := userservice.New(userRepo)
	userHandler := handler.NewUserHandler(userSvc)
	menuRepo := menurepo.New(sqlDB)
	menuSvc := menuservice.New(menuRepo)
	menuHandler := handler.NewMenuHandler(menuSvc)
	deptRepo := deptrepo.New(sqlDB)
	deptSvc := deptservice.New(deptRepo)
	deptHandler := handler.NewDeptHandler(deptSvc)
	postRepo := postrepo.New(sqlDB)
	postSvc := postservice.New(postRepo)
	postHandler := handler.NewPostHandler(postSvc)
	dictRepo := dictrepo.New(sqlDB)
	dictSvc := dictservice.New(dictRepo)
	dictHandler := handler.NewDictHandler(dictSvc)
	roleRepo := rolerepo.New(sqlDB)
	roleSvc := roleservice.New(roleRepo, menuRepo)
	roleHandler := handler.NewRoleHandler(roleSvc)

	var limit rate.Limit
	if cfg.Security.RateLimit.Requests > 0 && cfg.Security.RateLimit.Period > 0 {
		limit = rate.Limit(float64(cfg.Security.RateLimit.Requests) / cfg.Security.RateLimit.Period.Seconds())
	}
	throttleMW := middleware.NewThrottleMiddleware(limit, cfg.Security.RateLimit.Burst, nil, appLogger)

	// 构建 HTTP 引擎与路由
	engine := router.New(router.Options{
		Logger:             appLogger,
		HealthHandler:      healthHandler,
		DocsHandler:        docsHandler,
		CaptchaHandler:     captchaHandler,
		AuthHandler:        authHandler,
		UserHandler:        userHandler,
		RoleHandler:        roleHandler,
		MenuHandler:        menuHandler,
		DeptHandler:        deptHandler,
		PostHandler:        postHandler,
		DictHandler:        dictHandler,
		AuthSecret:         cfg.Auth.Secret,
		PermissionProvider: authRepo,
		AuthCookieName:     cfg.Auth.CookieName,
		PublicMWs:          []gin.HandlerFunc{throttleMW},
		ProtectedMWs:       []gin.HandlerFunc{throttleMW},
	})

	// 配置 HTTP Server，统一设置超时时间
	server := &http.Server{
		Addr:              cfg.HTTP.Addr,
		Handler:           engine,
		ReadTimeout:       constant.HTTP_TIMEOUT,
		WriteTimeout:      constant.HTTP_TIMEOUT,
		IdleTimeout:       constant.HTTP_TIMEOUT,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return &App{
		cfg:    cfg,
		logger: appLogger,
		server: server,
		db:     sqlDB,
		cache:  redisCache,
	}, nil
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
