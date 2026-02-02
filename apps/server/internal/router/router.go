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
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

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
	SessionValidator   middleware.SessionValidator
	PublicMWs          []gin.HandlerFunc
	ProtectedMWs       []gin.HandlerFunc
	LoginMiddlewares   []gin.HandlerFunc
	FrontendDir        string
}

func New(opts Options) *gin.Engine {
	if opts.Logger != nil {
		gin.DefaultWriter = slog.NewLogLogger(opts.Logger.Handler(), slog.LevelInfo).Writer()
	}

	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(middleware.RequestLogger(opts.Logger))

	frontend := newFrontendHandler(opts.FrontendDir)
	for _, mw := range opts.Middlewares {
		if mw != nil {
			engine.Use(mw)
		}
	}
	engine.GET("/healthz", opts.HealthHandler.Status)
	engine.GET("/", func(ctx *gin.Context) {
		if frontend != nil {
			frontend.ServeIndex(ctx)
			return
		}
		ctx.Redirect(http.StatusFound, "/docs")
	})

	registerAPIRoutes(engine, opts)

	if frontend != nil {
		engine.NoRoute(func(ctx *gin.Context) {
			if isAPIRoute(ctx.Request.URL.Path) {
				resp.NotFound(ctx, resp.WithMessage("resource not found"))
				return
			}
			if frontend.Serve(ctx) {
				return
			}
			resp.NotFound(ctx, resp.WithMessage("resource not found"))
		})
	} else {
		engine.NoRoute(func(ctx *gin.Context) {
			resp.NotFound(ctx, resp.WithMessage("resource not found"))
		})
	}
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

func registerRouteWithPermissions(
	group *gin.RouterGroup,
	method string,
	relativePath string,
	permissions []string,
	handler gin.HandlerFunc,
	description string,
) {
	if group == nil {
		return
	}
	if handler == nil {
		handler = notImplemented(description)
	}

	var handlers []gin.HandlerFunc
	if len(permissions) > 0 {
		handlers = append(handlers, middleware.RequirePermissions(permissions...))
	}
	handlers = append(handlers, handler)
	group.Handle(method, relativePath, handlers...)
}

func requireHandler(name string, handler interface{}) {
	if handler == nil {
		panic(fmt.Sprintf("%s is not configured", name))
	}
}

func registerDocsRoutes(engine *gin.Engine, opts Options) {
	if opts.DocsHandler == nil {
		return
	}
	engine.GET("/docs/openapi.json", opts.DocsHandler.SwaggerJSON)
	engine.GET("/docs", opts.DocsHandler.SwaggerUI)
}

func isAPIRoute(pathname string) bool {
	if pathname == apiVersionPrefix || strings.HasPrefix(pathname, apiVersionPrefix+"/") {
		return true
	}
	if pathname == "/docs" || strings.HasPrefix(pathname, "/docs/") {
		return true
	}
	return false
}

type frontendHandler struct {
	baseDir      string
	indexPath    string
	notFoundPath string
	hasIndex     bool
	hasNotFound  bool
}

func newFrontendHandler(baseDir string) *frontendHandler {
	baseDir = strings.TrimSpace(baseDir)
	if baseDir == "" {
		return nil
	}
	info, err := os.Stat(baseDir)
	if err != nil || !info.IsDir() {
		return nil
	}
	handler := &frontendHandler{
		baseDir:      baseDir,
		indexPath:    filepath.Join(baseDir, "index.html"),
		notFoundPath: filepath.Join(baseDir, "404.html"),
	}
	if fileExists(handler.indexPath) {
		handler.hasIndex = true
	} else {
		return nil
	}
	if fileExists(handler.notFoundPath) {
		handler.hasNotFound = true
	}
	return handler
}

func (h *frontendHandler) ServeIndex(ctx *gin.Context) {
	if h == nil || !h.hasIndex {
		resp.NotFound(ctx, resp.WithMessage("resource not found"))
		return
	}
	ctx.File(h.indexPath)
}

func (h *frontendHandler) Serve(ctx *gin.Context) bool {
	if h == nil {
		return false
	}
	if ctx.Request.Method != http.MethodGet && ctx.Request.Method != http.MethodHead {
		return false
	}
	if target := h.resolvePath(ctx.Request.URL.Path); target != "" {
		ctx.File(target)
		return true
	}
	if h.hasNotFound {
		ctx.Status(http.StatusNotFound)
		ctx.File(h.notFoundPath)
		return true
	}
	return false
}

func (h *frontendHandler) resolvePath(requestPath string) string {
	cleanPath := path.Clean("/" + requestPath)
	cleanPath = strings.TrimPrefix(cleanPath, "/")
	if cleanPath == "" {
		if h.hasIndex {
			return h.indexPath
		}
		return ""
	}
	fullPath := filepath.Join(h.baseDir, filepath.FromSlash(cleanPath))
	info, err := os.Stat(fullPath)
	if err != nil {
		return ""
	}
	if info.IsDir() {
		indexPath := filepath.Join(fullPath, "index.html")
		if fileExists(indexPath) {
			return indexPath
		}
		return ""
	}
	return fullPath
}

func fileExists(pathname string) bool {
	info, err := os.Stat(pathname)
	if err != nil {
		return false
	}
	return !info.IsDir()
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
	requireHandler("UserHandler", opts.UserHandler)
	requireHandler("RoleHandler", opts.RoleHandler)
	requireHandler("MenuHandler", opts.MenuHandler)
	requireHandler("DeptHandler", opts.DeptHandler)
	requireHandler("PostHandler", opts.PostHandler)
	requireHandler("DictHandler", opts.DictHandler)
	requireHandler("ConfigHandler", opts.ConfigHandler)
	requireHandler("NoticeHandler", opts.NoticeHandler)

	system := group.Group("/system")

	registerSystemUserRoutes(system, opts)

	profile := group.Group("/profile")
	registerRouteWithPermissions(profile, http.MethodGet, "", nil, opts.UserHandler.GetProfile, "get profile")
	registerRouteWithPermissions(profile, http.MethodPut, "", nil, opts.UserHandler.UpdateProfile, "update profile")
	registerRouteWithPermissions(profile, http.MethodPut, "/password", nil, opts.UserHandler.ChangePassword, "change password")
	registerRouteWithPermissions(profile, http.MethodGet, "/sessions", nil, opts.UserHandler.ListSelfSessions, "list own sessions")
	registerRouteWithPermissions(profile, http.MethodPost, "/sessions/:id/force-logout", nil, opts.UserHandler.ForceLogoutSelfSession, "force logout own session")

	roles := system.Group("/roles")
	registerRouteWithPermissions(roles, http.MethodGet, "", []string{"system:role:list"}, opts.RoleHandler.List, "list roles")
	registerRouteWithPermissions(roles, http.MethodPost, "", []string{"system:role:add"}, opts.RoleHandler.Create, "create role")
	registerRouteWithPermissions(roles, http.MethodGet, "/:id", []string{"system:role:query"}, opts.RoleHandler.Get, "get role")
	registerRouteWithPermissions(roles, http.MethodPut, "/:id", []string{"system:role:edit"}, opts.RoleHandler.Update, "update role")
	registerRouteWithPermissions(roles, http.MethodDelete, "/:id", []string{"system:role:remove"}, opts.RoleHandler.Delete, "delete role")

	menus := system.Group("/menus")
	registerRouteWithPermissions(menus, http.MethodGet, "/tree", []string{"system:menu:list"}, opts.MenuHandler.Tree, "list menu tree")
	registerRouteWithPermissions(menus, http.MethodPost, "", []string{"system:menu:add"}, opts.MenuHandler.Create, "create menu")
	registerRouteWithPermissions(menus, http.MethodGet, "/:id", []string{"system:menu:query"}, opts.MenuHandler.Get, "get menu")
	registerRouteWithPermissions(menus, http.MethodPut, "/:id", []string{"system:menu:edit"}, opts.MenuHandler.Update, "update menu")
	registerRouteWithPermissions(menus, http.MethodPut, "/reorder", []string{"system:menu:edit"}, opts.MenuHandler.Reorder, "reorder menus")
	registerRouteWithPermissions(menus, http.MethodDelete, "/:id", []string{"system:menu:remove"}, opts.MenuHandler.Delete, "delete menu")

	departments := system.Group("/departments")
	registerRouteWithPermissions(departments, http.MethodGet, "/tree", []string{"system:dept:list"}, opts.DeptHandler.Tree, "list department tree")
	registerRouteWithPermissions(departments, http.MethodGet, "", []string{"system:dept:list"}, opts.DeptHandler.List, "list departments")
	registerRouteWithPermissions(departments, http.MethodPost, "", []string{"system:dept:add"}, opts.DeptHandler.Create, "create department")
	registerRouteWithPermissions(departments, http.MethodGet, "/:id", []string{"system:dept:query"}, opts.DeptHandler.Get, "get department")
	registerRouteWithPermissions(departments, http.MethodPut, "/:id", []string{"system:dept:edit"}, opts.DeptHandler.Update, "update department")
	registerRouteWithPermissions(departments, http.MethodDelete, "/:id", []string{"system:dept:remove"}, opts.DeptHandler.Delete, "delete department")

	posts := system.Group("/posts")
	registerRouteWithPermissions(posts, http.MethodGet, "", []string{"system:post:list"}, opts.PostHandler.List, "list posts")
	registerRouteWithPermissions(posts, http.MethodPost, "", []string{"system:post:add"}, opts.PostHandler.Create, "create post")
	registerRouteWithPermissions(posts, http.MethodGet, "/:id", []string{"system:post:query"}, notImplemented("get post"), "get post")
	registerRouteWithPermissions(posts, http.MethodPut, "/:id", []string{"system:post:edit"}, opts.PostHandler.Update, "update post")
	registerRouteWithPermissions(posts, http.MethodDelete, "/:id", []string{"system:post:remove"}, opts.PostHandler.Delete, "delete post")

	dicts := system.Group("/dicts")
	registerRouteWithPermissions(dicts, http.MethodGet, "", []string{"system:dict:list"}, opts.DictHandler.List, "list dictionaries")
	registerRouteWithPermissions(dicts, http.MethodPost, "", []string{"system:dict:add"}, opts.DictHandler.Create, "create dictionary")
	registerRouteWithPermissions(dicts, http.MethodGet, "/:id", []string{"system:dict:query"}, opts.DictHandler.Get, "get dictionary")
	registerRouteWithPermissions(dicts, http.MethodPut, "/:id", []string{"system:dict:edit"}, opts.DictHandler.Update, "update dictionary")
	registerRouteWithPermissions(dicts, http.MethodDelete, "/:id", []string{"system:dict:remove"}, opts.DictHandler.Delete, "delete dictionary")
	registerRouteWithPermissions(dicts, http.MethodGet, "/:id/data", []string{"system:dict:list"}, opts.DictHandler.ListData, "list dictionary data")
	registerRouteWithPermissions(dicts, http.MethodPost, "/:id/data", []string{"system:dict:add"}, opts.DictHandler.CreateData, "create dictionary data")
	registerRouteWithPermissions(dicts, http.MethodPut, "/:id/data/:itemId", []string{"system:dict:edit"}, opts.DictHandler.UpdateData, "update dictionary data")
	registerRouteWithPermissions(dicts, http.MethodDelete, "/:id/data/:itemId", []string{"system:dict:remove"}, opts.DictHandler.DeleteData, "delete dictionary data")

	configs := system.Group("/configs")
	registerRouteWithPermissions(configs, http.MethodGet, "", []string{"system:config:list"}, opts.ConfigHandler.List, "list configs")
	registerRouteWithPermissions(configs, http.MethodPost, "", []string{"system:config:add"}, opts.ConfigHandler.Create, "create config")
	registerRouteWithPermissions(configs, http.MethodGet, "/:id", []string{"system:config:query"}, opts.ConfigHandler.Get, "get config")
	registerRouteWithPermissions(configs, http.MethodPut, "/:id", []string{"system:config:edit"}, opts.ConfigHandler.Update, "update config")
	registerRouteWithPermissions(configs, http.MethodDelete, "/:id", []string{"system:config:remove"}, opts.ConfigHandler.Delete, "delete config")

	notices := system.Group("/notices")
	registerRouteWithPermissions(notices, http.MethodGet, "", []string{"system:notice:list"}, opts.NoticeHandler.List, "list notices")
	registerRouteWithPermissions(notices, http.MethodPost, "", []string{"system:notice:add"}, opts.NoticeHandler.Create, "create notice")
	registerRouteWithPermissions(notices, http.MethodGet, "/:id", []string{"system:notice:query"}, opts.NoticeHandler.Get, "get notice")
	registerRouteWithPermissions(notices, http.MethodPut, "/:id", []string{"system:notice:edit"}, opts.NoticeHandler.Update, "update notice")
	registerRouteWithPermissions(notices, http.MethodDelete, "/:id", []string{"system:notice:remove"}, opts.NoticeHandler.Delete, "delete notice")
}

func registerSystemUserRoutes(system *gin.RouterGroup, opts Options) {
	requireHandler("UserHandler", opts.UserHandler)

	users := system.Group("/users")
	registerRouteWithPermissions(users, http.MethodGet, "", []string{"system:user:list"}, opts.UserHandler.List, "list users")
	registerRouteWithPermissions(users, http.MethodPost, "", []string{"system:user:add"}, opts.UserHandler.Create, "create user")
	registerRouteWithPermissions(users, http.MethodGet, "/:id", []string{"system:user:query"}, opts.UserHandler.Get, "get user")
	registerRouteWithPermissions(users, http.MethodPut, "/:id", []string{"system:user:edit"}, opts.UserHandler.Update, "update user")
	registerRouteWithPermissions(users, http.MethodDelete, "/:id", []string{"system:user:remove"}, opts.UserHandler.Delete, "delete user")
	registerRouteWithPermissions(users, http.MethodGet, "/options/departments", []string{"system:user:list"}, opts.UserHandler.ListDepartmentOptions, "list department options")
	registerRouteWithPermissions(users, http.MethodGet, "/options/roles", []string{"system:user:list"}, opts.UserHandler.ListRoleOptions, "list role options")
	registerRouteWithPermissions(users, http.MethodGet, "/options/posts", []string{"system:user:list"}, opts.UserHandler.ListPostOptions, "list post options")
	registerRouteWithPermissions(users, http.MethodPost, "/:id/reset-password", []string{"system:user:resetPwd"}, opts.UserHandler.ResetPassword, "reset user password")
}

func registerMonitorRoutes(group *gin.RouterGroup, opts Options) {
	requireHandler("OnlineHandler", opts.OnlineHandler)
	requireHandler("JobHandler", opts.JobHandler)
	requireHandler("ServerHandler", opts.ServerHandler)
	requireHandler("CacheHandler", opts.CacheHandler)
	requireHandler("OperLogHandler", opts.OperLogHandler)
	requireHandler("LoginLogHandler", opts.LoginLogHandler)

	monitor := group.Group("/monitor")

	online := monitor.Group("/online/users")
	registerRouteWithPermissions(online, http.MethodGet, "", []string{"monitor:online:list"}, opts.OnlineHandler.List, "list online users")
	registerRouteWithPermissions(online, http.MethodPost, "/batch-logout", []string{"monitor:online:batchLogout"}, opts.OnlineHandler.BatchForceLogout, "batch logout online users")
	registerRouteWithPermissions(online, http.MethodGet, "/:id", []string{"monitor:online:query"}, opts.OnlineHandler.Get, "get online user")
	registerRouteWithPermissions(online, http.MethodPost, "/:id/force-logout", []string{"monitor:online:forceLogout"}, opts.OnlineHandler.ForceLogout, "force logout online user")

	jobs := monitor.Group("/jobs")
	registerRouteWithPermissions(jobs, http.MethodGet, "", []string{"monitor:job:list"}, opts.JobHandler.List, "list jobs")
	registerRouteWithPermissions(jobs, http.MethodPost, "", []string{"monitor:job:add"}, opts.JobHandler.Create, "create job")
	registerRouteWithPermissions(jobs, http.MethodGet, "/:id", []string{"monitor:job:query"}, opts.JobHandler.Get, "get job")
	registerRouteWithPermissions(jobs, http.MethodGet, "/:id/detail", []string{"monitor:job:query"}, opts.JobHandler.Detail, "get job detail")
	registerRouteWithPermissions(jobs, http.MethodPut, "/:id", []string{"monitor:job:edit"}, opts.JobHandler.Update, "update job")
	registerRouteWithPermissions(jobs, http.MethodDelete, "/:id", []string{"monitor:job:remove"}, opts.JobHandler.Delete, "delete job")
	registerRouteWithPermissions(jobs, http.MethodDelete, "/:id/logs", []string{"monitor:job:remove"}, opts.JobHandler.ClearLogs, "clear job logs")
	registerRouteWithPermissions(jobs, http.MethodPatch, "/:id/status", []string{"monitor:job:changeStatus"}, opts.JobHandler.ChangeStatus, "change job status")
	registerRouteWithPermissions(jobs, http.MethodPost, "/:id/run", []string{"monitor:job:run"}, opts.JobHandler.Trigger, "run job")
	registerRouteWithPermissions(jobs, http.MethodGet, "/logs/:id/steps", []string{"monitor:job:query"}, opts.JobHandler.GetLogSteps, "get job log steps")
	registerRouteWithPermissions(jobs, http.MethodGet, "/logs/:id/stream", []string{"monitor:job:query"}, opts.JobHandler.StreamLog, "stream job log")

	registerRouteWithPermissions(monitor, http.MethodGet, "/server", []string{"monitor:server:list"}, opts.ServerHandler.Status, "view server monitor")
	registerRouteWithPermissions(monitor, http.MethodGet, "/server/stream", []string{"monitor:server:list"}, opts.ServerHandler.Stream, "stream server monitor")

	cacheGroup := monitor.Group("/cache")
	registerRouteWithPermissions(cacheGroup, http.MethodGet, "", []string{"monitor:cache:list"}, opts.CacheHandler.Overview, "view cache overview")
	registerRouteWithPermissions(cacheGroup, http.MethodGet, "/stream", []string{"monitor:cache:list"}, opts.CacheHandler.Stream, "stream cache overview")
	registerRouteWithPermissions(cacheGroup, http.MethodGet, "/list", []string{"monitor:cache:list"}, opts.CacheHandler.List, "list cache keys")

	operLog := monitor.Group("/logs/operations")
	registerRouteWithPermissions(operLog, http.MethodGet, "", []string{"monitor:operlog:list"}, opts.OperLogHandler.List, "list operation logs")
	registerRouteWithPermissions(operLog, http.MethodGet, "/:id", []string{"monitor:operlog:query"}, opts.OperLogHandler.Get, "get operation log")
	registerRouteWithPermissions(operLog, http.MethodDelete, "/:id", []string{"monitor:operlog:remove"}, opts.OperLogHandler.Delete, "delete operation log")

	loginLog := monitor.Group("/logs/login")
	registerRouteWithPermissions(loginLog, http.MethodGet, "", []string{"monitor:logininfor:list"}, opts.LoginLogHandler.List, "list login logs")
	registerRouteWithPermissions(loginLog, http.MethodGet, "/:id", []string{"monitor:logininfor:query"}, opts.LoginLogHandler.Get, "get login log")
	registerRouteWithPermissions(loginLog, http.MethodDelete, "/:id", []string{"monitor:logininfor:remove"}, opts.LoginLogHandler.Delete, "delete login log")
}
