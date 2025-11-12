package netutil

import "github.com/gin-gonic/gin"

// RealIPFromContext returns the best-effort client IP for the given Gin context.
func RealIPFromContext(ctx *gin.Context) string {
    if ctx == nil {
        return ""
    }
    return RealIP(ctx.Request)
}
