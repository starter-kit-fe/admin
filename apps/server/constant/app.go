package constant

import (
	"time"

	"github.com/gin-gonic/gin"
)

var (
	NAME      = "admin"
	MODE      = gin.ReleaseMode
	SITE      = "h06i.com"
	DB_PREFIX = NAME + "_"

	PORT = "27507"

	TIME_FORMAT      = "1995-07-12 00:00:00"
	HTTP_TIMEOUT     = time.Minute * 5 // 5分钟超时，适合大文件上传
	VERSION          = "N/A"
	COMMIT           = "N/A"
	JWT_EXP          = time.Hour * 24 * 30 // 历史兼容
	JWT_ACCESS_TTL   = 15 * time.Minute
	JWT_REFRESH_TTL  = 240 * time.Hour
	JWT_SESSION_TICK = time.Minute
	SHUTDOWN_TIMEOUT = time.Second * 10

	JWT_COOKIE_NAME         = "access_token"
	JWT_REFRESH_COOKIE_NAME = "refresh_token"
	JWT_COOKIE_DOMAIN       = ""
	JWT_COOKIE_PATH         = "/"
	JWT_COOKIE_SECURE       = false
	JWT_COOKIE_HTTP_ONLY    = true
	JWT_COOKIE_SAME_SITE    = "lax"
)
