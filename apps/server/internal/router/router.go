// Package router wires HTTP routes for the admin service.
//
// @title Admin Service API
// @version 0.1.0
// @description Internal admin platform API documentation.
// @BasePath /
// @schemes http https
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description 输入 Bearer Token，格式：Bearer {token}
package router

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/middleware"
	appi18n "github.com/starter-kit-fe/admin/internal/middleware/i18n"
	"github.com/starter-kit-fe/admin/internal/system/auth"
	"github.com/starter-kit-fe/admin/internal/system/cache"
	"github.com/starter-kit-fe/admin/internal/system/captcha"
	sysconfig "github.com/starter-kit-fe/admin/internal/system/config"
	"github.com/starter-kit-fe/admin/internal/system/dept"
	"github.com/starter-kit-fe/admin/internal/system/dict"
	"github.com/starter-kit-fe/admin/internal/system/docs"
	"github.com/starter-kit-fe/admin/internal/system/health"
	"github.com/starter-kit-fe/admin/internal/system/job"
	"github.com/starter-kit-fe/admin/internal/system/loginlog"
	"github.com/starter-kit-fe/admin/internal/system/menu"
	"github.com/starter-kit-fe/admin/internal/system/notice"
	"github.com/starter-kit-fe/admin/internal/system/online"
	"github.com/starter-kit-fe/admin/internal/system/operlog"
	"github.com/starter-kit-fe/admin/internal/system/post"
	"github.com/starter-kit-fe/admin/internal/system/role"
	"github.com/starter-kit-fe/admin/internal/system/server"
	"github.com/starter-kit-fe/admin/internal/system/user"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Options struct {
	Logger             *slog.Logger
	HealthHandler      *health.Handler
	CaptchaHandler     *captcha.Handler
	DocsHandler        *docs.Handler
	AuthHandler        *auth.Handler
	UserHandler        *user.Handler
	RoleHandler        *role.Handler
	MenuHandler        *menu.Handler
	DeptHandler        *dept.Handler
	PostHandler        *post.Handler
	DictHandler        *dict.Handler
	ConfigHandler      *sysconfig.Handler
	NoticeHandler      *notice.Handler
	OperLogHandler     *operlog.Handler
	LoginLogHandler    *loginlog.Handler
	JobHandler         *job.Handler
	OnlineHandler      *online.Handler
	ServerHandler      *server.Handler
	CacheHandler       *cache.Handler
	Middlewares        []gin.HandlerFunc
	AuthSecret         string
	AuthCookieName     string
	PermissionProvider middleware.PermissionProvider
	TokenBlocklist     middleware.TokenBlocklist
	SessionValidator   middleware.SessionValidator
	PublicMWs          []gin.HandlerFunc
	ProtectedMWs       []gin.HandlerFunc
	LoginMiddlewares   []gin.HandlerFunc
}

func New(opts Options) *gin.Engine {
	if opts.Logger != nil {
		gin.DefaultWriter = slog.NewLogLogger(opts.Logger.Handler(), slog.LevelInfo).Writer()
	}

	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(middleware.RequestLogger(opts.Logger))
	engine.Use(appi18n.Middleware())

	for _, mw := range opts.Middlewares {
		if mw != nil {
			engine.Use(mw)
		}
	}
	engine.GET("/healthz", opts.HealthHandler.Status)
	engine.GET("/", func(ctx *gin.Context) {
		ctx.Redirect(http.StatusFound, "/docs")
	})

	registerAPIRoutes(engine, opts)

	engine.NoRoute(func(ctx *gin.Context) {
		resp.NotFound(ctx, resp.WithMessage("resource not found"))
	})
	engine.NoMethod(func(ctx *gin.Context) {
		resp.MethodNotAllowed(ctx, resp.WithMessage("method not allowed"))
	})

	return engine
}

const apiVersionPrefix = "/v1"

func registerAPIRoutes(engine *gin.Engine, opts Options) {
	registerDocsRoutes(engine, opts)
	api := engine.Group(apiVersionPrefix)
	registerPublicRoutes(api, opts)
	registerProtectedRoutes(api, opts)
}

func notImplemented(feature string) gin.HandlerFunc {
	message := "not implemented"
	if feature != "" {
		message = feature + " not implemented"
	}

	return func(ctx *gin.Context) {
		resp.NotImplemented(ctx, resp.WithMessage(message))
	}
}

func registerDocsRoutes(engine *gin.Engine, opts Options) {
	if opts.DocsHandler == nil {
		return
	}
	engine.GET("/docs/openapi.json", opts.DocsHandler.SwaggerJSON)
	engine.GET("/docs", opts.DocsHandler.SwaggerUI)
}

func registerPublicRoutes(api *gin.RouterGroup, opts Options) {
	public := api.Group("")
	for _, mw := range opts.PublicMWs {
		if mw != nil {
			public.Use(mw)
		}
	}

	registerAuthRoutes(public, opts)
	registerCaptchaRoutes(public, opts)
}

func registerAuthRoutes(group *gin.RouterGroup, opts Options) {
	if opts.AuthHandler == nil {
		return
	}
	var handlers []gin.HandlerFunc
	for _, mw := range opts.LoginMiddlewares {
		if mw != nil {
			handlers = append(handlers, mw)
		}
	}
	handlers = append(handlers, opts.AuthHandler.Login)
	group.POST("/auth/login", handlers...)
	group.POST("/auth/refresh", opts.AuthHandler.Refresh)
}

func registerCaptchaRoutes(group *gin.RouterGroup, opts Options) {
	if opts.CaptchaHandler == nil {
		return
	}
	group.GET("/auth/captcha", opts.CaptchaHandler.Generate)
	group.POST("/auth/captcha/verify", opts.CaptchaHandler.Verify)
}

func registerProtectedRoutes(api *gin.RouterGroup, opts Options) {
	protected := api.Group("")
	protected.Use(middleware.NewJWTAuthMiddleware(middleware.JWTAuthOptions{
		Secret:     opts.AuthSecret,
		CookieName: opts.AuthCookieName,
		Provider:   opts.PermissionProvider,
		Logger:     opts.Logger,
		Blocklist:  opts.TokenBlocklist,
		Sessions:   opts.SessionValidator,
	}))
	for _, mw := range opts.ProtectedMWs {
		if mw != nil {
			protected.Use(mw)
		}
	}

	registerProtectedAuthRoutes(protected, opts)
	registerSystemRoutes(protected, opts)
	registerMonitorRoutes(protected, opts)
}

func registerProtectedAuthRoutes(group *gin.RouterGroup, opts Options) {
	if opts.AuthHandler == nil {
		return
	}
	group.GET("/auth/me", opts.AuthHandler.GetInfo)
	group.GET("/auth/menus", opts.AuthHandler.GetMenus)
	group.POST("/auth/logout", opts.AuthHandler.Logout)
}

func registerSystemRoutes(group *gin.RouterGroup, opts Options) {
	system := group.Group("/system")

	registerSystemUserRoutes(system, opts)

	profile := group.Group("/profile")
	profile.GET("", opts.UserHandler.GetProfile)
	profile.PUT("", opts.UserHandler.UpdateProfile)
	profile.PUT("/password", opts.UserHandler.ChangePassword)
	profile.GET("/sessions", opts.UserHandler.ListSelfSessions)
	profile.POST("/sessions/:id/force-logout", opts.UserHandler.ForceLogoutSelfSession)

	roles := system.Group("/roles")
	roles.GET("", middleware.RequirePermissions("system:role:list"), opts.RoleHandler.List)
	roles.POST("", middleware.RequirePermissions("system:role:add"), opts.RoleHandler.Create)
	roles.GET("/:id", middleware.RequirePermissions("system:role:query"), opts.RoleHandler.Get)
	roles.PUT("/:id", middleware.RequirePermissions("system:role:edit"), opts.RoleHandler.Update)
	roles.DELETE("/:id", middleware.RequirePermissions("system:role:remove"), opts.RoleHandler.Delete)

	menus := system.Group("/menus")
	menus.GET("/tree", middleware.RequirePermissions("system:menu:list"), opts.MenuHandler.Tree)
	menus.POST("", middleware.RequirePermissions("system:menu:add"), opts.MenuHandler.Create)
	menus.GET("/:id", middleware.RequirePermissions("system:menu:query"), opts.MenuHandler.Get)
	menus.PUT("/:id", middleware.RequirePermissions("system:menu:edit"), opts.MenuHandler.Update)
	menus.PUT("/reorder", middleware.RequirePermissions("system:menu:edit"), opts.MenuHandler.Reorder)
	menus.DELETE("/:id", middleware.RequirePermissions("system:menu:remove"), opts.MenuHandler.Delete)

	departments := system.Group("/departments")
	departments.GET("/tree", middleware.RequirePermissions("system:dept:list"), opts.DeptHandler.Tree)
	departments.GET("", middleware.RequirePermissions("system:dept:list"), opts.DeptHandler.List)
	departments.POST("", middleware.RequirePermissions("system:dept:add"), opts.DeptHandler.Create)
	departments.GET("/:id", middleware.RequirePermissions("system:dept:query"), opts.DeptHandler.Get)
	departments.PUT("/:id", middleware.RequirePermissions("system:dept:edit"), opts.DeptHandler.Update)
	departments.DELETE("/:id", middleware.RequirePermissions("system:dept:remove"), opts.DeptHandler.Delete)

	posts := system.Group("/posts")
	posts.GET("", middleware.RequirePermissions("system:post:list"), opts.PostHandler.List)
	posts.POST("", middleware.RequirePermissions("system:post:add"), opts.PostHandler.Create)
	posts.GET("/:id", middleware.RequirePermissions("system:post:query"), notImplemented("get post"))
	posts.PUT("/:id", middleware.RequirePermissions("system:post:edit"), opts.PostHandler.Update)
	posts.DELETE("/:id", middleware.RequirePermissions("system:post:remove"), opts.PostHandler.Delete)

	dicts := system.Group("/dicts")
	dicts.GET("", middleware.RequirePermissions("system:dict:list"), opts.DictHandler.List)
	dicts.POST("", middleware.RequirePermissions("system:dict:add"), opts.DictHandler.Create)
	dicts.GET("/:id", middleware.RequirePermissions("system:dict:query"), opts.DictHandler.Get)
	dicts.PUT("/:id", middleware.RequirePermissions("system:dict:edit"), opts.DictHandler.Update)
	dicts.DELETE("/:id", middleware.RequirePermissions("system:dict:remove"), opts.DictHandler.Delete)
	dicts.GET("/:id/data", middleware.RequirePermissions("system:dict:list"), opts.DictHandler.ListData)
	dicts.POST("/:id/data", middleware.RequirePermissions("system:dict:add"), opts.DictHandler.CreateData)
	dicts.PUT("/:id/data/:itemId", middleware.RequirePermissions("system:dict:edit"), opts.DictHandler.UpdateData)
	dicts.DELETE("/:id/data/:itemId", middleware.RequirePermissions("system:dict:remove"), opts.DictHandler.DeleteData)

	configs := system.Group("/configs")
	configs.GET("", middleware.RequirePermissions("system:config:list"), opts.ConfigHandler.List)
	configs.POST("", middleware.RequirePermissions("system:config:add"), opts.ConfigHandler.Create)
	configs.GET("/:id", middleware.RequirePermissions("system:config:query"), opts.ConfigHandler.Get)
	configs.PUT("/:id", middleware.RequirePermissions("system:config:edit"), opts.ConfigHandler.Update)
	configs.DELETE("/:id", middleware.RequirePermissions("system:config:remove"), opts.ConfigHandler.Delete)

	notices := system.Group("/notices")
	notices.GET("", middleware.RequirePermissions("system:notice:list"), opts.NoticeHandler.List)
	notices.POST("", middleware.RequirePermissions("system:notice:add"), opts.NoticeHandler.Create)
	notices.GET("/:id", middleware.RequirePermissions("system:notice:query"), opts.NoticeHandler.Get)
	notices.PUT("/:id", middleware.RequirePermissions("system:notice:edit"), opts.NoticeHandler.Update)

}

func registerSystemUserRoutes(system *gin.RouterGroup, opts Options) {
	users := system.Group("/users")

	users.GET("", middleware.RequirePermissions("system:user:list"), opts.UserHandler.List)
	users.POST("", middleware.RequirePermissions("system:user:add"), opts.UserHandler.Create)
	users.GET("/:id", middleware.RequirePermissions("system:user:query"), opts.UserHandler.Get)
	users.PUT("/:id", middleware.RequirePermissions("system:user:edit"), opts.UserHandler.Update)
	users.DELETE("/:id", middleware.RequirePermissions("system:user:remove"), opts.UserHandler.Delete)
	users.GET("/options/departments", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListDepartmentOptions)
	users.GET("/options/roles", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListRoleOptions)
	users.GET("/options/posts", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListPostOptions)
	users.POST("/:id/reset-password", middleware.RequirePermissions("system:user:resetPwd"), opts.UserHandler.ResetPassword)

}

func registerMonitorRoutes(group *gin.RouterGroup, opts Options) {
	monitor := group.Group("/monitor")

	online := monitor.Group("/online/users")
	online.GET("", middleware.RequirePermissions("monitor:online:list"), opts.OnlineHandler.List)
	online.POST("/batch-logout", middleware.RequirePermissions("monitor:online:batchLogout"), opts.OnlineHandler.BatchForceLogout)
	online.GET("/:id", middleware.RequirePermissions("monitor:online:query"), opts.OnlineHandler.Get)
	online.POST("/:id/force-logout", middleware.RequirePermissions("monitor:online:forceLogout"), opts.OnlineHandler.ForceLogout)

	jobs := monitor.Group("/jobs")
	jobs.GET("", middleware.RequirePermissions("monitor:job:list"), opts.JobHandler.List)
	jobs.POST("", middleware.RequirePermissions("monitor:job:add"), opts.JobHandler.Create)
	jobs.GET("/:id", middleware.RequirePermissions("monitor:job:query"), opts.JobHandler.Get)
	jobs.PUT("/:id", middleware.RequirePermissions("monitor:job:edit"), opts.JobHandler.Update)
	jobs.DELETE("/:id", middleware.RequirePermissions("monitor:job:remove"), opts.JobHandler.Delete)
	jobs.PATCH("/:id/status", middleware.RequirePermissions("monitor:job:changeStatus"), opts.JobHandler.ChangeStatus)
	jobs.POST("/:id/run", middleware.RequirePermissions("monitor:job:run"), opts.JobHandler.Trigger)

	monitor.GET("/server", middleware.RequirePermissions("monitor:server:list"), opts.ServerHandler.Status)

	cacheGroup := monitor.Group("/cache")
	cacheGroup.GET("", middleware.RequirePermissions("monitor:cache:list"), opts.CacheHandler.Overview)
	cacheGroup.GET("/list", middleware.RequirePermissions("monitor:cache:list"), opts.CacheHandler.List)

	operLog := monitor.Group("/logs/operations")
	operLog.GET("", middleware.RequirePermissions("monitor:operlog:list"), opts.OperLogHandler.List)
	operLog.GET("/:id", middleware.RequirePermissions("monitor:operlog:query"), opts.OperLogHandler.Get)
	operLog.DELETE("/:id", middleware.RequirePermissions("monitor:operlog:remove"), opts.OperLogHandler.Delete)

	loginLog := monitor.Group("/logs/login")
	loginLog.GET("", middleware.RequirePermissions("monitor:logininfor:list"), opts.LoginLogHandler.List)
	loginLog.GET("/:id", middleware.RequirePermissions("monitor:logininfor:query"), opts.LoginLogHandler.Get)
	loginLog.DELETE("/:id", middleware.RequirePermissions("monitor:logininfor:remove"), opts.LoginLogHandler.Delete)

}
