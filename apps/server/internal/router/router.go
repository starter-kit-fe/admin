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
	"github.com/starter-kit-fe/admin/middleware"
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
	}))
	for _, mw := range opts.ProtectedMWs {
		if mw != nil {
			protected.Use(mw)
		}
	}

	registerProtectedAuthRoutes(protected, opts)
	registerSystemRoutes(protected, opts)
	registerMonitorRoutes(protected, opts)
	registerToolRoutes(protected)
}

func registerProtectedAuthRoutes(group *gin.RouterGroup, opts Options) {
	if opts.AuthHandler == nil {
		return
	}
	group.GET("/getInfo", opts.AuthHandler.GetInfo)
	group.GET("/auth/me", opts.AuthHandler.GetInfo)
	group.GET("/auth/menus", opts.AuthHandler.GetMenus)
	group.POST("/auth/logout", opts.AuthHandler.Logout)
}

func registerSystemRoutes(group *gin.RouterGroup, opts Options) {
	system := group.Group("/system")

	registerSystemUserRoutes(system, opts)

	roles := system.Group("/roles")
	if opts.RoleHandler != nil {
		roles.GET("", middleware.RequirePermissions("system:role:list"), opts.RoleHandler.List)
		roles.POST("", middleware.RequirePermissions("system:role:add"), opts.RoleHandler.Create)
		roles.GET("/:id", middleware.RequirePermissions("system:role:query"), opts.RoleHandler.Get)
		roles.PUT("/:id", middleware.RequirePermissions("system:role:edit"), opts.RoleHandler.Update)
		roles.DELETE("/:id", middleware.RequirePermissions("system:role:remove"), opts.RoleHandler.Delete)
	} else {
		roles.GET("", middleware.RequirePermissions("system:role:list"), notImplemented("list roles"))
		roles.POST("", middleware.RequirePermissions("system:role:add"), notImplemented("create role"))
		roles.GET("/:id", middleware.RequirePermissions("system:role:query"), notImplemented("get role"))
		roles.PUT("/:id", middleware.RequirePermissions("system:role:edit"), notImplemented("update role"))
		roles.DELETE("/:id", middleware.RequirePermissions("system:role:remove"), notImplemented("delete role"))
	}
	roles.GET("/export", middleware.RequirePermissions("system:role:export"), notImplemented("export roles"))

	menus := system.Group("/menus")
	if opts.MenuHandler != nil {
		menus.GET("/tree", middleware.RequirePermissions("system:menu:list"), opts.MenuHandler.Tree)
		menus.POST("", middleware.RequirePermissions("system:menu:add"), opts.MenuHandler.Create)
		menus.GET("/:id", middleware.RequirePermissions("system:menu:query"), opts.MenuHandler.Get)
		menus.PUT("/:id", middleware.RequirePermissions("system:menu:edit"), opts.MenuHandler.Update)
		menus.PUT("/reorder", middleware.RequirePermissions("system:menu:edit"), opts.MenuHandler.Reorder)
		menus.DELETE("/:id", middleware.RequirePermissions("system:menu:remove"), opts.MenuHandler.Delete)
	} else {
		menus.GET("", middleware.RequirePermissions("system:menu:list"), notImplemented("list menus"))
		menus.POST("", middleware.RequirePermissions("system:menu:add"), notImplemented("create menu"))
		menus.GET("/:id", middleware.RequirePermissions("system:menu:query"), notImplemented("get menu"))
		menus.PUT("/:id", middleware.RequirePermissions("system:menu:edit"), notImplemented("update menu"))
		menus.PUT("/reorder", middleware.RequirePermissions("system:menu:edit"), notImplemented("reorder menus"))
		menus.DELETE("/:id", middleware.RequirePermissions("system:menu:remove"), notImplemented("delete menu"))
		menus.GET("/tree", middleware.RequirePermissions("system:menu:list"), notImplemented("list menu tree"))
	}

	departments := system.Group("/departments")
	if opts.DeptHandler != nil {
		departments.GET("/tree", middleware.RequirePermissions("system:dept:list"), opts.DeptHandler.Tree)
		departments.GET("", middleware.RequirePermissions("system:dept:list"), opts.DeptHandler.List)
		departments.POST("", middleware.RequirePermissions("system:dept:add"), opts.DeptHandler.Create)
		departments.GET("/:id", middleware.RequirePermissions("system:dept:query"), opts.DeptHandler.Get)
		departments.PUT("/:id", middleware.RequirePermissions("system:dept:edit"), opts.DeptHandler.Update)
		departments.DELETE("/:id", middleware.RequirePermissions("system:dept:remove"), opts.DeptHandler.Delete)
	} else {
		departments.GET("", middleware.RequirePermissions("system:dept:list"), notImplemented("list departments"))
		departments.POST("", middleware.RequirePermissions("system:dept:add"), notImplemented("create department"))
		departments.GET("/:id", middleware.RequirePermissions("system:dept:query"), notImplemented("get department"))
		departments.PUT("/:id", middleware.RequirePermissions("system:dept:edit"), notImplemented("update department"))
		departments.DELETE("/:id", middleware.RequirePermissions("system:dept:remove"), notImplemented("delete department"))
		departments.GET("/tree", middleware.RequirePermissions("system:dept:list"), notImplemented("list department tree"))
	}

	posts := system.Group("/posts")
	if opts.PostHandler != nil {
		posts.GET("", middleware.RequirePermissions("system:post:list"), opts.PostHandler.List)
		posts.GET("/export", middleware.RequirePermissions("system:post:export"), notImplemented("export posts"))
		posts.POST("", middleware.RequirePermissions("system:post:add"), opts.PostHandler.Create)
		posts.GET("/:id", middleware.RequirePermissions("system:post:query"), notImplemented("get post"))
		posts.PUT("/:id", middleware.RequirePermissions("system:post:edit"), opts.PostHandler.Update)
		posts.DELETE("/:id", middleware.RequirePermissions("system:post:remove"), opts.PostHandler.Delete)
	} else {
		posts.GET("", middleware.RequirePermissions("system:post:list"), notImplemented("list posts"))
		posts.GET("/export", middleware.RequirePermissions("system:post:export"), notImplemented("export posts"))
		posts.POST("", middleware.RequirePermissions("system:post:add"), notImplemented("create post"))
		posts.GET("/:id", middleware.RequirePermissions("system:post:query"), notImplemented("get post"))
		posts.PUT("/:id", middleware.RequirePermissions("system:post:edit"), notImplemented("update post"))
		posts.DELETE("/:id", middleware.RequirePermissions("system:post:remove"), notImplemented("delete post"))
	}

	dicts := system.Group("/dicts")
	if opts.DictHandler != nil {
		dicts.GET("", middleware.RequirePermissions("system:dict:list"), opts.DictHandler.List)
		dicts.GET("/export", middleware.RequirePermissions("system:dict:export"), notImplemented("export dictionaries"))
		dicts.POST("", middleware.RequirePermissions("system:dict:add"), opts.DictHandler.Create)
		dicts.GET("/:id", middleware.RequirePermissions("system:dict:query"), opts.DictHandler.Get)
		dicts.PUT("/:id", middleware.RequirePermissions("system:dict:edit"), opts.DictHandler.Update)
		dicts.DELETE("/:id", middleware.RequirePermissions("system:dict:remove"), opts.DictHandler.Delete)
		dicts.GET("/:id/data", middleware.RequirePermissions("system:dict:list"), opts.DictHandler.ListData)
		dicts.POST("/:id/data", middleware.RequirePermissions("system:dict:add"), opts.DictHandler.CreateData)
		dicts.PUT("/:id/data/:itemId", middleware.RequirePermissions("system:dict:edit"), opts.DictHandler.UpdateData)
		dicts.DELETE("/:id/data/:itemId", middleware.RequirePermissions("system:dict:remove"), opts.DictHandler.DeleteData)
	} else {
		dicts.GET("", middleware.RequirePermissions("system:dict:list"), notImplemented("list dictionaries"))
		dicts.GET("/export", middleware.RequirePermissions("system:dict:export"), notImplemented("export dictionaries"))
		dicts.POST("", middleware.RequirePermissions("system:dict:add"), notImplemented("create dictionary"))
		dicts.GET("/:id", middleware.RequirePermissions("system:dict:query"), notImplemented("get dictionary"))
		dicts.PUT("/:id", middleware.RequirePermissions("system:dict:edit"), notImplemented("update dictionary"))
		dicts.DELETE("/:id", middleware.RequirePermissions("system:dict:remove"), notImplemented("delete dictionary"))
		dicts.GET("/:id/data", middleware.RequirePermissions("system:dict:list"), notImplemented("list dictionary data"))
		dicts.POST("/:id/data", middleware.RequirePermissions("system:dict:add"), notImplemented("create dictionary data"))
		dicts.PUT("/:id/data/:itemId", middleware.RequirePermissions("system:dict:edit"), notImplemented("update dictionary data"))
		dicts.DELETE("/:id/data/:itemId", middleware.RequirePermissions("system:dict:remove"), notImplemented("delete dictionary data"))
	}

	configs := system.Group("/configs")
	if opts.ConfigHandler != nil {
		configs.GET("", middleware.RequirePermissions("system:config:list"), opts.ConfigHandler.List)
		configs.GET("/export", middleware.RequirePermissions("system:config:export"), notImplemented("export configs"))
		configs.POST("", middleware.RequirePermissions("system:config:add"), opts.ConfigHandler.Create)
		configs.GET("/:id", middleware.RequirePermissions("system:config:query"), opts.ConfigHandler.Get)
		configs.PUT("/:id", middleware.RequirePermissions("system:config:edit"), opts.ConfigHandler.Update)
		configs.DELETE("/:id", middleware.RequirePermissions("system:config:remove"), opts.ConfigHandler.Delete)
	} else {
		configs.GET("", middleware.RequirePermissions("system:config:list"), notImplemented("list configs"))
		configs.GET("/export", middleware.RequirePermissions("system:config:export"), notImplemented("export configs"))
		configs.POST("", middleware.RequirePermissions("system:config:add"), notImplemented("create config"))
		configs.GET("/:id", middleware.RequirePermissions("system:config:query"), notImplemented("get config"))
		configs.PUT("/:id", middleware.RequirePermissions("system:config:edit"), notImplemented("update config"))
		configs.DELETE("/:id", middleware.RequirePermissions("system:config:remove"), notImplemented("delete config"))
	}

	notices := system.Group("/notices")
	if opts.NoticeHandler != nil {
		notices.GET("", middleware.RequirePermissions("system:notice:list"), opts.NoticeHandler.List)
		notices.POST("", middleware.RequirePermissions("system:notice:add"), opts.NoticeHandler.Create)
		notices.GET("/:id", middleware.RequirePermissions("system:notice:query"), opts.NoticeHandler.Get)
		notices.PUT("/:id", middleware.RequirePermissions("system:notice:edit"), opts.NoticeHandler.Update)
		notices.DELETE("/:id", middleware.RequirePermissions("system:notice:remove"), opts.NoticeHandler.Delete)
	} else {
		notices.GET("", middleware.RequirePermissions("system:notice:list"), notImplemented("list notices"))
		notices.POST("", middleware.RequirePermissions("system:notice:add"), notImplemented("create notice"))
		notices.GET("/:id", middleware.RequirePermissions("system:notice:query"), notImplemented("get notice"))
		notices.PUT("/:id", middleware.RequirePermissions("system:notice:edit"), notImplemented("update notice"))
		notices.DELETE("/:id", middleware.RequirePermissions("system:notice:remove"), notImplemented("delete notice"))
	}
}

func registerSystemUserRoutes(system *gin.RouterGroup, opts Options) {
	users := system.Group("/users")

	users.GET("/export", middleware.RequirePermissions("system:user:export"), notImplemented("export users"))
	users.POST("/import", middleware.RequirePermissions("system:user:import"), notImplemented("import users"))
	if opts.UserHandler == nil {
		users.GET("", middleware.RequirePermissions("system:user:list"), notImplemented("list users"))
		users.POST("", middleware.RequirePermissions("system:user:add"), notImplemented("create user"))
		users.GET("/:id", middleware.RequirePermissions("system:user:query"), notImplemented("get user"))
		users.PUT("/:id", middleware.RequirePermissions("system:user:edit"), notImplemented("update user"))
		users.DELETE("/:id", middleware.RequirePermissions("system:user:remove"), notImplemented("delete user"))
		users.GET("/options/departments", middleware.RequirePermissions("system:user:list"), notImplemented("list department options"))
		users.GET("/options/roles", middleware.RequirePermissions("system:user:list"), notImplemented("list role options"))
		users.GET("/options/posts", middleware.RequirePermissions("system:user:list"), notImplemented("list post options"))
	} else {
		users.GET("", middleware.RequirePermissions("system:user:list"), opts.UserHandler.List)
		users.POST("", middleware.RequirePermissions("system:user:add"), opts.UserHandler.Create)
		users.GET("/:id", middleware.RequirePermissions("system:user:query"), opts.UserHandler.Get)
		users.PUT("/:id", middleware.RequirePermissions("system:user:edit"), opts.UserHandler.Update)
		users.DELETE("/:id", middleware.RequirePermissions("system:user:remove"), opts.UserHandler.Delete)
		users.GET("/options/departments", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListDepartmentOptions)
		users.GET("/options/roles", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListRoleOptions)
		users.GET("/options/posts", middleware.RequirePermissions("system:user:list"), opts.UserHandler.ListPostOptions)
	}

	if opts.UserHandler == nil {
		users.POST("/:id/reset-password", middleware.RequirePermissions("system:user:resetPwd"), notImplemented("reset user password"))
	} else {
		users.POST("/:id/reset-password", middleware.RequirePermissions("system:user:resetPwd"), opts.UserHandler.ResetPassword)
	}
}

func registerMonitorRoutes(group *gin.RouterGroup, opts Options) {
	monitor := group.Group("/monitor")

	online := monitor.Group("/online/users")
	if opts.OnlineHandler != nil {
		online.GET("", middleware.RequirePermissions("monitor:online:list"), opts.OnlineHandler.List)
		online.POST("/batch-logout", middleware.RequirePermissions("monitor:online:batchLogout"), opts.OnlineHandler.BatchForceLogout)
		online.GET("/:id", middleware.RequirePermissions("monitor:online:query"), opts.OnlineHandler.Get)
		online.POST("/:id/force-logout", middleware.RequirePermissions("monitor:online:forceLogout"), opts.OnlineHandler.ForceLogout)
	} else {
		online.GET("", middleware.RequirePermissions("monitor:online:list"), notImplemented("list online users"))
		online.POST("/batch-logout", middleware.RequirePermissions("monitor:online:batchLogout"), notImplemented("batch logout online users"))
		online.GET("/:id", middleware.RequirePermissions("monitor:online:query"), notImplemented("get online user"))
		online.POST("/:id/force-logout", middleware.RequirePermissions("monitor:online:forceLogout"), notImplemented("force logout online user"))
	}

	jobs := monitor.Group("/jobs")
	if opts.JobHandler != nil {
		jobs.GET("", middleware.RequirePermissions("monitor:job:list"), opts.JobHandler.List)
		jobs.GET("/export", middleware.RequirePermissions("monitor:job:export"), notImplemented("export jobs"))
		jobs.POST("", middleware.RequirePermissions("monitor:job:add"), opts.JobHandler.Create)
		jobs.GET("/:id", middleware.RequirePermissions("monitor:job:query"), opts.JobHandler.Get)
		jobs.PUT("/:id", middleware.RequirePermissions("monitor:job:edit"), opts.JobHandler.Update)
		jobs.DELETE("/:id", middleware.RequirePermissions("monitor:job:remove"), opts.JobHandler.Delete)
		jobs.PATCH("/:id/status", middleware.RequirePermissions("monitor:job:changeStatus"), opts.JobHandler.ChangeStatus)
		jobs.POST("/:id/run", middleware.RequirePermissions("monitor:job:run"), opts.JobHandler.Trigger)
	} else {
		jobs.GET("", middleware.RequirePermissions("monitor:job:list"), notImplemented("list jobs"))
		jobs.GET("/export", middleware.RequirePermissions("monitor:job:export"), notImplemented("export jobs"))
		jobs.POST("", middleware.RequirePermissions("monitor:job:add"), notImplemented("create job"))
		jobs.GET("/:id", middleware.RequirePermissions("monitor:job:query"), notImplemented("get job"))
		jobs.PUT("/:id", middleware.RequirePermissions("monitor:job:edit"), notImplemented("update job"))
		jobs.DELETE("/:id", middleware.RequirePermissions("monitor:job:remove"), notImplemented("delete job"))
		jobs.PATCH("/:id/status", middleware.RequirePermissions("monitor:job:changeStatus"), notImplemented("change job status"))
		jobs.POST("/:id/run", middleware.RequirePermissions("monitor:job:run"), notImplemented("run job"))
	}

	monitor.GET("/druid", middleware.RequirePermissions("monitor:druid:list"), notImplemented("view druid"))
	if opts.ServerHandler != nil {
		monitor.GET("/server", middleware.RequirePermissions("monitor:server:list"), opts.ServerHandler.Status)
	} else {
		monitor.GET("/server", middleware.RequirePermissions("monitor:server:list"), notImplemented("view server monitor"))
	}

	cacheGroup := monitor.Group("/cache")
	if opts.CacheHandler != nil {
		cacheGroup.GET("", middleware.RequirePermissions("monitor:cache:list"), opts.CacheHandler.Overview)
		cacheGroup.GET("/list", middleware.RequirePermissions("monitor:cache:list"), opts.CacheHandler.List)
	} else {
		cacheGroup.GET("", middleware.RequirePermissions("monitor:cache:list"), notImplemented("view cache overview"))
		cacheGroup.GET("/list", middleware.RequirePermissions("monitor:cache:list"), notImplemented("list cache keys"))
	}

	operLog := monitor.Group("/logs/operations")
	if opts.OperLogHandler != nil {
		operLog.GET("", middleware.RequirePermissions("monitor:operlog:list"), opts.OperLogHandler.List)
		operLog.GET("/export", middleware.RequirePermissions("monitor:operlog:export"), notImplemented("export operation logs"))
		operLog.GET("/:id", middleware.RequirePermissions("monitor:operlog:query"), opts.OperLogHandler.Get)
		operLog.DELETE("/:id", middleware.RequirePermissions("monitor:operlog:remove"), opts.OperLogHandler.Delete)
	} else {
		operLog.GET("", middleware.RequirePermissions("monitor:operlog:list"), notImplemented("list operation logs"))
		operLog.GET("/export", middleware.RequirePermissions("monitor:operlog:export"), notImplemented("export operation logs"))
		operLog.GET("/:id", middleware.RequirePermissions("monitor:operlog:query"), notImplemented("get operation log"))
		operLog.DELETE("/:id", middleware.RequirePermissions("monitor:operlog:remove"), notImplemented("delete operation log"))
	}

	loginLog := monitor.Group("/logs/login")
	if opts.LoginLogHandler != nil {
		loginLog.GET("", middleware.RequirePermissions("monitor:logininfor:list"), opts.LoginLogHandler.List)
		loginLog.GET("/export", middleware.RequirePermissions("monitor:logininfor:export"), notImplemented("export login logs"))
		loginLog.GET("/:id", middleware.RequirePermissions("monitor:logininfor:query"), opts.LoginLogHandler.Get)
		loginLog.DELETE("/:id", middleware.RequirePermissions("monitor:logininfor:remove"), opts.LoginLogHandler.Delete)
		loginLog.POST("/:id/unlock", middleware.RequirePermissions("monitor:logininfor:unlock"), opts.LoginLogHandler.Unlock)
	} else {
		loginLog.GET("", middleware.RequirePermissions("monitor:logininfor:list"), notImplemented("list login logs"))
		loginLog.GET("/export", middleware.RequirePermissions("monitor:logininfor:export"), notImplemented("export login logs"))
		loginLog.GET("/:id", middleware.RequirePermissions("monitor:logininfor:query"), notImplemented("get login log"))
		loginLog.DELETE("/:id", middleware.RequirePermissions("monitor:logininfor:remove"), notImplemented("delete login log"))
		loginLog.POST("/:id/unlock", middleware.RequirePermissions("monitor:logininfor:unlock"), notImplemented("unlock account from login log"))
	}
}

func registerToolRoutes(group *gin.RouterGroup) {
	tool := group.Group("/tool")

	tool.GET("/build", middleware.RequirePermissions("tool:build:list"), notImplemented("use form builder"))
	tool.GET("/swagger", middleware.RequirePermissions("tool:swagger:list"), notImplemented("view swagger docs"))

	gen := tool.Group("/gen")
	{
		gen.GET("", middleware.RequirePermissions("tool:gen:list"), notImplemented("list generated tables"))
		gen.POST("/import", middleware.RequirePermissions("tool:gen:import"), notImplemented("import table for generation"))
		gen.GET("/:id", middleware.RequirePermissions("tool:gen:query"), notImplemented("get generator table"))
		gen.PUT("/:id", middleware.RequirePermissions("tool:gen:edit"), notImplemented("update generator table"))
		gen.DELETE("/:id", middleware.RequirePermissions("tool:gen:remove"), notImplemented("delete generator table"))
		gen.GET("/:id/preview", middleware.RequirePermissions("tool:gen:preview"), notImplemented("preview generated code"))
		gen.POST("/:id/code", middleware.RequirePermissions("tool:gen:code"), notImplemented("generate code bundle"))
	}
}
