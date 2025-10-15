package router

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/handler"
	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Options struct {
	Logger             *slog.Logger
	HealthHandler      *handler.HealthHandler
	CaptchaHandler     *handler.CaptchaHandler
	DocsHandler        *handler.DocsHandler
	AuthHandler        *handler.AuthHandler
	Middlewares        []gin.HandlerFunc
	AuthSecret         string
	PermissionProvider middleware.PermissionProvider
	PublicMWs          []gin.HandlerFunc
	ProtectedMWs       []gin.HandlerFunc
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
	group.POST("/auth/login", opts.AuthHandler.Login)
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
	protected.Use(middleware.NewJWTAuthMiddleware(opts.AuthSecret, opts.PermissionProvider, opts.Logger))
	for _, mw := range opts.ProtectedMWs {
		if mw != nil {
			protected.Use(mw)
		}
	}

	registerProtectedAuthRoutes(protected, opts)
	registerSystemRoutes(protected)
	registerMonitorRoutes(protected)
	registerToolRoutes(protected)
}

func registerProtectedAuthRoutes(group *gin.RouterGroup, opts Options) {
	if opts.AuthHandler == nil {
		return
	}
	group.GET("/getInfo", opts.AuthHandler.GetInfo)
	group.GET("/auth/me", opts.AuthHandler.GetInfo)
}

func registerSystemRoutes(group *gin.RouterGroup) {
	system := group.Group("/system")

	users := system.Group("/users")
	{
		users.GET("", middleware.RequirePermissions("system:user:list"), handler.NotImplemented("list users"))
		users.GET("/export", middleware.RequirePermissions("system:user:export"), handler.NotImplemented("export users"))
		users.POST("/import", middleware.RequirePermissions("system:user:import"), handler.NotImplemented("import users"))
		users.POST("", middleware.RequirePermissions("system:user:add"), handler.NotImplemented("create user"))
		users.GET("/:id", middleware.RequirePermissions("system:user:query"), handler.NotImplemented("get user"))
		users.PUT("/:id", middleware.RequirePermissions("system:user:edit"), handler.NotImplemented("update user"))
		users.DELETE("/:id", middleware.RequirePermissions("system:user:remove"), handler.NotImplemented("delete user"))
		users.POST("/:id/reset-password", middleware.RequirePermissions("system:user:resetPwd"), handler.NotImplemented("reset user password"))
	}

	roles := system.Group("/roles")
	{
		roles.GET("", middleware.RequirePermissions("system:role:list"), handler.NotImplemented("list roles"))
		roles.GET("/export", middleware.RequirePermissions("system:role:export"), handler.NotImplemented("export roles"))
		roles.POST("", middleware.RequirePermissions("system:role:add"), handler.NotImplemented("create role"))
		roles.GET("/:id", middleware.RequirePermissions("system:role:query"), handler.NotImplemented("get role"))
		roles.PUT("/:id", middleware.RequirePermissions("system:role:edit"), handler.NotImplemented("update role"))
		roles.DELETE("/:id", middleware.RequirePermissions("system:role:remove"), handler.NotImplemented("delete role"))
	}

	menus := system.Group("/menus")
	{
		menus.GET("", middleware.RequirePermissions("system:menu:list"), handler.NotImplemented("list menus"))
		menus.POST("", middleware.RequirePermissions("system:menu:add"), handler.NotImplemented("create menu"))
		menus.GET("/:id", middleware.RequirePermissions("system:menu:query"), handler.NotImplemented("get menu"))
		menus.PUT("/:id", middleware.RequirePermissions("system:menu:edit"), handler.NotImplemented("update menu"))
		menus.DELETE("/:id", middleware.RequirePermissions("system:menu:remove"), handler.NotImplemented("delete menu"))
	}

	departments := system.Group("/departments")
	{
		departments.GET("", middleware.RequirePermissions("system:dept:list"), handler.NotImplemented("list departments"))
		departments.POST("", middleware.RequirePermissions("system:dept:add"), handler.NotImplemented("create department"))
		departments.GET("/:id", middleware.RequirePermissions("system:dept:query"), handler.NotImplemented("get department"))
		departments.PUT("/:id", middleware.RequirePermissions("system:dept:edit"), handler.NotImplemented("update department"))
		departments.DELETE("/:id", middleware.RequirePermissions("system:dept:remove"), handler.NotImplemented("delete department"))
	}

	posts := system.Group("/posts")
	{
		posts.GET("", middleware.RequirePermissions("system:post:list"), handler.NotImplemented("list posts"))
		posts.GET("/export", middleware.RequirePermissions("system:post:export"), handler.NotImplemented("export posts"))
		posts.POST("", middleware.RequirePermissions("system:post:add"), handler.NotImplemented("create post"))
		posts.GET("/:id", middleware.RequirePermissions("system:post:query"), handler.NotImplemented("get post"))
		posts.PUT("/:id", middleware.RequirePermissions("system:post:edit"), handler.NotImplemented("update post"))
		posts.DELETE("/:id", middleware.RequirePermissions("system:post:remove"), handler.NotImplemented("delete post"))
	}

	dicts := system.Group("/dicts")
	{
		dicts.GET("", middleware.RequirePermissions("system:dict:list"), handler.NotImplemented("list dictionaries"))
		dicts.GET("/export", middleware.RequirePermissions("system:dict:export"), handler.NotImplemented("export dictionaries"))
		dicts.POST("", middleware.RequirePermissions("system:dict:add"), handler.NotImplemented("create dictionary"))
		dicts.GET("/:id", middleware.RequirePermissions("system:dict:query"), handler.NotImplemented("get dictionary"))
		dicts.PUT("/:id", middleware.RequirePermissions("system:dict:edit"), handler.NotImplemented("update dictionary"))
		dicts.DELETE("/:id", middleware.RequirePermissions("system:dict:remove"), handler.NotImplemented("delete dictionary"))
	}

	configs := system.Group("/configs")
	{
		configs.GET("", middleware.RequirePermissions("system:config:list"), handler.NotImplemented("list configs"))
		configs.GET("/export", middleware.RequirePermissions("system:config:export"), handler.NotImplemented("export configs"))
		configs.POST("", middleware.RequirePermissions("system:config:add"), handler.NotImplemented("create config"))
		configs.GET("/:id", middleware.RequirePermissions("system:config:query"), handler.NotImplemented("get config"))
		configs.PUT("/:id", middleware.RequirePermissions("system:config:edit"), handler.NotImplemented("update config"))
		configs.DELETE("/:id", middleware.RequirePermissions("system:config:remove"), handler.NotImplemented("delete config"))
	}

	notices := system.Group("/notices")
	{
		notices.GET("", middleware.RequirePermissions("system:notice:list"), handler.NotImplemented("list notices"))
		notices.POST("", middleware.RequirePermissions("system:notice:add"), handler.NotImplemented("create notice"))
		notices.GET("/:id", middleware.RequirePermissions("system:notice:query"), handler.NotImplemented("get notice"))
		notices.PUT("/:id", middleware.RequirePermissions("system:notice:edit"), handler.NotImplemented("update notice"))
		notices.DELETE("/:id", middleware.RequirePermissions("system:notice:remove"), handler.NotImplemented("delete notice"))
	}
}

func registerMonitorRoutes(group *gin.RouterGroup) {
	monitor := group.Group("/monitor")

	online := monitor.Group("/online/users")
	{
		online.GET("", middleware.RequirePermissions("monitor:online:list"), handler.NotImplemented("list online users"))
		online.POST("/batch-logout", middleware.RequirePermissions("monitor:online:batchLogout"), handler.NotImplemented("batch logout online users"))
		online.GET("/:id", middleware.RequirePermissions("monitor:online:query"), handler.NotImplemented("get online user"))
		online.POST("/:id/force-logout", middleware.RequirePermissions("monitor:online:forceLogout"), handler.NotImplemented("force logout online user"))
	}

	jobs := monitor.Group("/jobs")
	{
		jobs.GET("", middleware.RequirePermissions("monitor:job:list"), handler.NotImplemented("list jobs"))
		jobs.GET("/export", middleware.RequirePermissions("monitor:job:export"), handler.NotImplemented("export jobs"))
		jobs.POST("", middleware.RequirePermissions("monitor:job:add"), handler.NotImplemented("create job"))
		jobs.GET("/:id", middleware.RequirePermissions("monitor:job:query"), handler.NotImplemented("get job"))
		jobs.PUT("/:id", middleware.RequirePermissions("monitor:job:edit"), handler.NotImplemented("update job"))
		jobs.DELETE("/:id", middleware.RequirePermissions("monitor:job:remove"), handler.NotImplemented("delete job"))
		jobs.PATCH("/:id/status", middleware.RequirePermissions("monitor:job:changeStatus"), handler.NotImplemented("change job status"))
	}

	monitor.GET("/druid", middleware.RequirePermissions("monitor:druid:list"), handler.NotImplemented("view druid"))
	monitor.GET("/server", middleware.RequirePermissions("monitor:server:list"), handler.NotImplemented("view server monitor"))

	cache := monitor.Group("/cache")
	{
		cache.GET("", middleware.RequirePermissions("monitor:cache:list"), handler.NotImplemented("view cache overview"))
		cache.GET("/list", middleware.RequirePermissions("monitor:cache:list"), handler.NotImplemented("list cache keys"))
	}

	operLog := monitor.Group("/logs/operations")
	{
		operLog.GET("", middleware.RequirePermissions("monitor:operlog:list"), handler.NotImplemented("list operation logs"))
		operLog.GET("/export", middleware.RequirePermissions("monitor:operlog:export"), handler.NotImplemented("export operation logs"))
		operLog.GET("/:id", middleware.RequirePermissions("monitor:operlog:query"), handler.NotImplemented("get operation log"))
		operLog.DELETE("/:id", middleware.RequirePermissions("monitor:operlog:remove"), handler.NotImplemented("delete operation log"))
	}

	loginLog := monitor.Group("/logs/login")
	{
		loginLog.GET("", middleware.RequirePermissions("monitor:logininfor:list"), handler.NotImplemented("list login logs"))
		loginLog.GET("/export", middleware.RequirePermissions("monitor:logininfor:export"), handler.NotImplemented("export login logs"))
		loginLog.GET("/:id", middleware.RequirePermissions("monitor:logininfor:query"), handler.NotImplemented("get login log"))
		loginLog.DELETE("/:id", middleware.RequirePermissions("monitor:logininfor:remove"), handler.NotImplemented("delete login log"))
		loginLog.POST("/:id/unlock", middleware.RequirePermissions("monitor:logininfor:unlock"), handler.NotImplemented("unlock account from login log"))
	}
}

func registerToolRoutes(group *gin.RouterGroup) {
	tool := group.Group("/tool")

	tool.GET("/build", middleware.RequirePermissions("tool:build:list"), handler.NotImplemented("use form builder"))
	tool.GET("/swagger", middleware.RequirePermissions("tool:swagger:list"), handler.NotImplemented("view swagger docs"))

	gen := tool.Group("/gen")
	{
		gen.GET("", middleware.RequirePermissions("tool:gen:list"), handler.NotImplemented("list generated tables"))
		gen.POST("/import", middleware.RequirePermissions("tool:gen:import"), handler.NotImplemented("import table for generation"))
		gen.GET("/:id", middleware.RequirePermissions("tool:gen:query"), handler.NotImplemented("get generator table"))
		gen.PUT("/:id", middleware.RequirePermissions("tool:gen:edit"), handler.NotImplemented("update generator table"))
		gen.DELETE("/:id", middleware.RequirePermissions("tool:gen:remove"), handler.NotImplemented("delete generator table"))
		gen.GET("/:id/preview", middleware.RequirePermissions("tool:gen:preview"), handler.NotImplemented("preview generated code"))
		gen.POST("/:id/code", middleware.RequirePermissions("tool:gen:code"), handler.NotImplemented("generate code bundle"))
	}
}
