package app

import (
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/internal/system/auth"
	"github.com/starter-kit-fe/admin/internal/system/captcha"
	sysconfig "github.com/starter-kit-fe/admin/internal/system/config"
	"github.com/starter-kit-fe/admin/internal/system/dept"
	"github.com/starter-kit-fe/admin/internal/system/dict"
	"github.com/starter-kit-fe/admin/internal/system/docs"
	"github.com/starter-kit-fe/admin/internal/system/health"
	"github.com/starter-kit-fe/admin/internal/system/loginlog"
	"github.com/starter-kit-fe/admin/internal/system/menu"
	"github.com/starter-kit-fe/admin/internal/system/notice"
	"github.com/starter-kit-fe/admin/internal/system/operlog"
	"github.com/starter-kit-fe/admin/internal/system/post"
	"github.com/starter-kit-fe/admin/internal/system/role"
	"github.com/starter-kit-fe/admin/internal/system/user"
)

type moduleSet struct {
	healthHandler   *health.Handler
	docsHandler     *docs.Handler
	captchaHandler  *captcha.Handler
	authHandler     *auth.Handler
	userHandler     *user.Handler
	roleHandler     *role.Handler
	menuHandler     *menu.Handler
	deptHandler     *dept.Handler
	postHandler     *post.Handler
	dictHandler     *dict.Handler
	configHandler   *sysconfig.Handler
	noticeHandler   *notice.Handler
	operLogHandler  *operlog.Handler
	loginLogHandler *loginlog.Handler

	permissionProvider middleware.PermissionProvider
}

func buildModuleSet(cfg *config.Config, sqlDB *gorm.DB, redisCache *redis.Client) moduleSet {
	healthSvc := health.New(sqlDB, redisCache)
	healthHandler := health.NewHandler(healthSvc)

	docsHandler := docs.NewHandler()

	captchaSvc := captcha.New(captcha.Options{})
	captchaHandler := captcha.NewHandler(captchaSvc)

	authRepo := auth.NewRepository(sqlDB)
	authHandler := auth.NewHandler(authRepo, captchaSvc, auth.AuthOptions{
		Secret:         cfg.Auth.Secret,
		TokenDuration:  cfg.Auth.TokenDuration,
		CookieName:     cfg.Auth.CookieName,
		CookieDomain:   cfg.Auth.CookieDomain,
		CookiePath:     cfg.Auth.CookiePath,
		CookieSecure:   cfg.Auth.CookieSecure,
		CookieHTTPOnly: cfg.Auth.CookieHTTPOnly,
		CookieSameSite: cfg.Auth.CookieSameSite,
	})

	userRepo := user.NewRepository(sqlDB)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)

	menuRepo := menu.NewRepository(sqlDB)
	menuSvc := menu.NewService(menuRepo)
	menuHandler := menu.NewHandler(menuSvc)

	deptRepo := dept.NewRepository(sqlDB)
	deptSvc := dept.NewService(deptRepo)
	deptHandler := dept.NewHandler(deptSvc)

	postRepo := post.NewRepository(sqlDB)
	postSvc := post.NewService(postRepo)
	postHandler := post.NewHandler(postSvc)

	dictRepo := dict.NewRepository(sqlDB)
	dictSvc := dict.NewService(dictRepo)
	dictHandler := dict.NewHandler(dictSvc)

	configRepo := sysconfig.NewRepository(sqlDB)
	configSvc := sysconfig.NewService(configRepo)
	configHandler := sysconfig.NewHandler(configSvc)

	noticeRepo := notice.NewRepository(sqlDB)
	noticeSvc := notice.NewService(noticeRepo)
	noticeHandler := notice.NewHandler(noticeSvc)

	operLogRepo := operlog.NewRepository(sqlDB)
	operLogSvc := operlog.NewService(operLogRepo)
	operLogHandler := operlog.NewHandler(operLogSvc)

	loginLogRepo := loginlog.NewRepository(sqlDB)
	loginLogSvc := loginlog.NewService(loginLogRepo)
	loginLogHandler := loginlog.NewHandler(loginLogSvc)

	roleRepo := role.NewRepository(sqlDB)
	roleSvc := role.NewService(roleRepo, menuRepo)
	roleHandler := role.NewHandler(roleSvc)

	return moduleSet{
		healthHandler:      healthHandler,
		docsHandler:        docsHandler,
		captchaHandler:     captchaHandler,
		authHandler:        authHandler,
		userHandler:        userHandler,
		roleHandler:        roleHandler,
		menuHandler:        menuHandler,
		deptHandler:        deptHandler,
		postHandler:        postHandler,
		dictHandler:        dictHandler,
		configHandler:      configHandler,
		noticeHandler:      noticeHandler,
		operLogHandler:     operLogHandler,
		loginLogHandler:    loginLogHandler,
		permissionProvider: authRepo,
	}
}
