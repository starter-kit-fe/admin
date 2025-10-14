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

	PORT = "8000"

	TIME_FORMAT  = "1995-07-12 00:00:00"
	HTTP_TIMEOUT = 5 * time.Minute // 5分钟超时，适合大文件上传
	VERSION      = "N/A"
	JWT_EXP      = time.Hour * 24 * 30 // 30天
)
