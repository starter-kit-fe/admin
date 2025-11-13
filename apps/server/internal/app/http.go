package app

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/audit"
	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/router"
)

func buildRouterEngine(cfg *config.Config, logger *slog.Logger, modules moduleSet, throttle gin.HandlerFunc) *gin.Engine {
	publicMWs := []gin.HandlerFunc{}
	protectedMWs := []gin.HandlerFunc{}
	if throttle != nil {
		publicMWs = append(publicMWs, throttle)
		protectedMWs = append(protectedMWs, throttle)
	}

	var loginMiddlewares []gin.HandlerFunc

	var userResolver audit.UserResolver
	if modules.userRepo != nil {
		userResolver = userResolverAdapter{repo: modules.userRepo}
	}

	if modules.operLogService != nil {
		opLogger := operationLoggerAdapter{svc: modules.operLogService}
		if recorder := audit.NewOperationMiddleware(opLogger, userResolver, audit.OperationOptions{
			Logger:         logger,
			MaxBodyBytes:   16 * 1024,
			MaxResultBytes: 8 * 1024,
		}); recorder != nil {
			protectedMWs = append(protectedMWs, recorder)
		}
	}

	if modules.loginLogService != nil {
		loginLogger := loginLoggerAdapter{svc: modules.loginLogService}
		if recorder := audit.NewLoginMiddleware(loginLogger, audit.LoginOptions{
			Logger:       logger,
			MaxBodyBytes: 4096,
		}); recorder != nil {
			loginMiddlewares = append(loginMiddlewares, recorder)
		}
	}

	return router.New(router.Options{
		Logger:             logger,
		HealthHandler:      modules.healthHandler,
		CaptchaHandler:     modules.captchaHandler,
		DocsHandler:        modules.docsHandler,
		AuthHandler:        modules.authHandler,
		UserHandler:        modules.userHandler,
		RoleHandler:        modules.roleHandler,
		MenuHandler:        modules.menuHandler,
		DeptHandler:        modules.deptHandler,
		PostHandler:        modules.postHandler,
		DictHandler:        modules.dictHandler,
		ConfigHandler:      modules.configHandler,
		NoticeHandler:      modules.noticeHandler,
		OperLogHandler:     modules.operLogHandler,
		LoginLogHandler:    modules.loginLogHandler,
		JobHandler:         modules.jobHandler,
		OnlineHandler:      modules.onlineHandler,
		ServerHandler:      modules.serverHandler,
		CacheHandler:       modules.cacheHandler,
		AuthSecret:         cfg.Auth.Secret,
		AuthCookieName:     cfg.Auth.CookieName,
		PermissionProvider: modules.permissionProvider,
		TokenBlocklist:     modules.onlineService,
		SessionValidator:   modules.sessionValidator,
		PublicMWs:          publicMWs,
		ProtectedMWs:       protectedMWs,
		LoginMiddlewares:   loginMiddlewares,
	})
}

func buildHTTPServer(cfg *config.Config, engine *gin.Engine) *http.Server {
	return &http.Server{
		Addr:              cfg.HTTP.Addr,
		Handler:           engine,
		ReadTimeout:       constant.HTTP_TIMEOUT,
		WriteTimeout:      constant.HTTP_TIMEOUT,
		IdleTimeout:       constant.HTTP_TIMEOUT,
		ReadHeaderTimeout: 5 * time.Second,
	}
}
