package app

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/router"
)

func buildRouterEngine(cfg *config.Config, logger *slog.Logger, modules moduleSet, throttle gin.HandlerFunc) *gin.Engine {
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
		AuthSecret:         cfg.Auth.Secret,
		AuthCookieName:     cfg.Auth.CookieName,
		PermissionProvider: modules.permissionProvider,
		PublicMWs:          []gin.HandlerFunc{throttle},
		ProtectedMWs:       []gin.HandlerFunc{throttle},
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
