package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"

	"github.com/starter-kit-fe/admin/constant"
)

type Config struct {
	App      AppConfig
	HTTP     HTTPConfig
	Log      LogConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Auth     AuthConfig
	Security SecurityConfig
}

type AppConfig struct {
	Name string
	Mode string
}

type HTTPConfig struct {
	Addr string
}

type LogConfig struct {
	Level string
}

type DatabaseConfig struct {
	DSN string
}

type RedisConfig struct {
	URL string
}

type AuthConfig struct {
	Secret         string
	TokenDuration  time.Duration
	CookieName     string
	CookieDomain   string
	CookiePath     string
	CookieSecure   bool
	CookieHTTPOnly bool
	CookieSameSite string
}

type SecurityConfig struct {
	RateLimit RateLimitConfig
}

type RateLimitConfig struct {
	Requests int
	Burst    int
	Period   time.Duration
}

func Load(envFiles ...string) (*Config, error) {
	if len(envFiles) == 1 && strings.TrimSpace(envFiles[0]) == "" {
		envFiles = nil
	}

	// 优先读取 dotenv 文件，确保环境变量就绪
	if err := loadEnvFiles(envFiles); err != nil {
		return nil, err
	}

	// 借助 Viper 统一处理默认值、环境变量及键名映射
	v := newViper()

	cfg := &Config{
		App: AppConfig{
			Name: strings.TrimSpace(v.GetString("app.name")),
			Mode: strings.TrimSpace(v.GetString("app.mode")),
		},
		HTTP: HTTPConfig{
			Addr: strings.TrimSpace(v.GetString("http.addr")),
		},
		Log: LogConfig{
			Level: strings.TrimSpace(v.GetString("log.level")),
		},
		Database: DatabaseConfig{
			DSN: strings.TrimSpace(v.GetString("database.dsn")),
		},
		Redis: RedisConfig{
			URL: strings.TrimSpace(v.GetString("redis.url")),
		},
		Auth: AuthConfig{
			Secret:         strings.TrimSpace(v.GetString("auth.secret")),
			TokenDuration:  parseDurationOrDefault(strings.TrimSpace(v.GetString("auth.token_duration")), constant.JWT_EXP),
			CookieName:     strings.TrimSpace(v.GetString("auth.cookie.name")),
			CookieDomain:   strings.TrimSpace(v.GetString("auth.cookie.domain")),
			CookiePath:     strings.TrimSpace(v.GetString("auth.cookie.path")),
			CookieSecure:   v.GetBool("auth.cookie.secure"),
			CookieHTTPOnly: v.GetBool("auth.cookie.http_only"),
			CookieSameSite: strings.TrimSpace(v.GetString("auth.cookie.same_site")),
		},
		Security: SecurityConfig{
			RateLimit: RateLimitConfig{
				Requests: v.GetInt("security.rate_limit.requests"),
				Burst:    v.GetInt("security.rate_limit.burst"),
			},
		},
	}

	if cfg.HTTP.Addr == "" {
		cfg.HTTP.Addr = strings.TrimSpace(v.GetString("http.port"))
	}

	periodStr := strings.TrimSpace(v.GetString("security.rate_limit.period"))
	if periodStr == "" {
		periodStr = v.GetString("security.rate_limit.window")
	}
	if periodStr == "" {
		periodStr = "1m"
	}
	period, err := time.ParseDuration(periodStr)
	if err != nil {
		return nil, fmt.Errorf("parse security.rate_limit.period: %w", err)
	}
	cfg.Security.RateLimit.Period = period

	cfg.Normalize()

	return cfg, nil
}

func MustLoad(envFiles ...string) *Config {
	// 启动流程直接使用 MustLoad，若出错则 panic，简化上层处理
	cfg, err := Load(envFiles...)
	if err != nil {
		panic(err)
	}
	return cfg
}

func (c *Config) Normalize() {
	// 规范化运行模式，回退到 ReleaseMode 保持安全
	c.App.Mode = strings.TrimSpace(c.App.Mode)
	switch c.App.Mode {
	case gin.DebugMode, gin.ReleaseMode, gin.TestMode:
	default:
		c.App.Mode = gin.ReleaseMode
	}

	// HTTP 监听地址兼容端口或完整地址
	c.HTTP.Addr = normalizeAddr(c.HTTP.Addr)
	if c.HTTP.Addr == "" {
		c.HTTP.Addr = ":" + constant.PORT
	}

	// 日志级别统一为小写并校验值
	c.Log.Level = strings.ToLower(strings.TrimSpace(c.Log.Level))
	switch c.Log.Level {
	case "debug", "info", "warn", "error":
	default:
		c.Log.Level = "info"
	}

	c.Auth.Secret = strings.TrimSpace(c.Auth.Secret)
	if c.Auth.Secret == "" {
		c.Auth.Secret = constant.NAME + "-dev-secret"
	}

	if c.Security.RateLimit.Requests <= 0 {
		c.Security.RateLimit.Requests = 60
	}
	if c.Security.RateLimit.Burst <= 0 {
		c.Security.RateLimit.Burst = c.Security.RateLimit.Requests
	}
	if c.Security.RateLimit.Period <= 0 {
		c.Security.RateLimit.Period = time.Minute
	}

	if c.Auth.TokenDuration <= 0 {
		c.Auth.TokenDuration = constant.JWT_EXP
	}
	c.Auth.CookieName = strings.TrimSpace(c.Auth.CookieName)
	if c.Auth.CookieName == "" {
		c.Auth.CookieName = constant.JWT_COOKIE_NAME
	}
	c.Auth.CookiePath = strings.TrimSpace(c.Auth.CookiePath)
	if c.Auth.CookiePath == "" {
		c.Auth.CookiePath = constant.JWT_COOKIE_PATH
	}
	c.Auth.CookieDomain = strings.TrimSpace(c.Auth.CookieDomain)
	c.Auth.CookieSameSite = strings.ToLower(strings.TrimSpace(c.Auth.CookieSameSite))
	if c.Auth.CookieSameSite == "" {
		c.Auth.CookieSameSite = constant.JWT_COOKIE_SAME_SITE
	}
}

func normalizeAddr(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" {
		return ""
	}
	if strings.HasPrefix(addr, ":") {
		return addr
	}
	if !strings.Contains(addr, ":") {
		return ":" + addr
	}
	return addr
}

func parseDurationOrDefault(value string, fallback time.Duration) time.Duration {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		return fallback
	}
	return duration
}

func loadEnvFiles(files []string) error {
	if len(files) == 0 {
		files = []string{".env.local", ".env"}
	}

	// 依次加载 dotenv 文件，忽略不存在的文件
	for _, file := range files {
		file = strings.TrimSpace(file)
		if file == "" {
			continue
		}
		if err := godotenv.Overload(file); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return fmt.Errorf("load env file %s: %w", file, err)
		}
	}

	return nil
}

func newViper() *viper.Viper {
	v := viper.New()
	// 环境变量以点号分割时，自动替换为下划线（如 APP_NAME）
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// 设置默认值，确保缺省环境下服务可启动
	v.SetDefault("app.name", constant.NAME)
	v.SetDefault("app.mode", constant.MODE)
	v.SetDefault("http.addr", ":"+constant.PORT)
	v.SetDefault("http.port", constant.PORT)
	v.SetDefault("log.level", "info")
	v.SetDefault("database.dsn", "")
	v.SetDefault("redis.url", "")
	v.SetDefault("auth.secret", "")
	v.SetDefault("auth.token_duration", constant.JWT_EXP.String())
	v.SetDefault("auth.cookie.name", constant.JWT_COOKIE_NAME)
	v.SetDefault("auth.cookie.domain", constant.JWT_COOKIE_DOMAIN)
	v.SetDefault("auth.cookie.path", constant.JWT_COOKIE_PATH)
	v.SetDefault("auth.cookie.secure", constant.JWT_COOKIE_SECURE)
	v.SetDefault("auth.cookie.http_only", constant.JWT_COOKIE_HTTP_ONLY)
	v.SetDefault("auth.cookie.same_site", constant.JWT_COOKIE_SAME_SITE)
	v.SetDefault("security.rate_limit.requests", 60)
	v.SetDefault("security.rate_limit.burst", 60)
	v.SetDefault("security.rate_limit.period", "1m")

	_ = v.BindEnv("app.name", "APP_NAME")
	_ = v.BindEnv("app.mode", "APP_MODE", "GIN_MODE")
	_ = v.BindEnv("http.addr", "HTTP_ADDR", "ADDR")
	_ = v.BindEnv("http.port", "HTTP_PORT", "PORT")
	_ = v.BindEnv("log.level", "LOG_LEVEL")
	_ = v.BindEnv("database.dsn", "DB_URL", "DATABASE_URL")
	_ = v.BindEnv("redis.url", "REDIS_URL")
	_ = v.BindEnv("auth.secret", "AUTH_SECRET")
	_ = v.BindEnv("auth.token_duration", "AUTH_TOKEN_DURATION")
	_ = v.BindEnv("auth.cookie.name", "AUTH_COOKIE_NAME")
	_ = v.BindEnv("auth.cookie.domain", "AUTH_COOKIE_DOMAIN")
	_ = v.BindEnv("auth.cookie.path", "AUTH_COOKIE_PATH")
	_ = v.BindEnv("auth.cookie.secure", "AUTH_COOKIE_SECURE")
	_ = v.BindEnv("auth.cookie.http_only", "AUTH_COOKIE_HTTP_ONLY")
	_ = v.BindEnv("auth.cookie.same_site", "AUTH_COOKIE_SAME_SITE")
	_ = v.BindEnv("security.rate_limit.requests", "SECURITY_RATE_LIMIT_REQUESTS")
	_ = v.BindEnv("security.rate_limit.burst", "SECURITY_RATE_LIMIT_BURST")
	_ = v.BindEnv("security.rate_limit.period", "SECURITY_RATE_LIMIT_PERIOD")

	return v
}
