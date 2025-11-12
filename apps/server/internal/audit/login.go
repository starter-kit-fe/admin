package audit

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// NewLoginMiddleware builds middleware that records login attempts via provided logger.
func NewLoginMiddleware(logger LoginLogger, opts LoginOptions) gin.HandlerFunc {
	if logger == nil {
		return nil
	}

	bodyLimit := opts.MaxBodyBytes
	if bodyLimit <= 0 {
		bodyLimit = 4 * 1024
	}
	slogger := opts.Logger

	return func(ctx *gin.Context) {
		if ctx.Request == nil {
			ctx.Next()
			return
		}

		bodyBuf := attachBodyRecorder(ctx.Request, bodyLimit)
		ua := ctx.GetHeader("User-Agent")

		ctx.Next()

		username := extractUsername(bodyBuf)
		status := "0"
		if ctx.Writer.Status() >= http.StatusBadRequest {
			status = "1"
		}
		browser, os := parseUserAgent(ua)
		msg := deriveErrorMessage(ctx)
		if msg == "" {
			msg = http.StatusText(ctx.Writer.Status())
		}

		entry := LoginEntry{
			UserName:   username,
			IP:         ctx.ClientIP(),
			Location:   "",
			Browser:    browser,
			OS:         os,
			Status:     status,
			Message:    msg,
			OccurredAt: unixMillis(time.Now()),
		}

		go func(payload LoginEntry) {
			if err := logger.RecordLogin(context.Background(), payload); err != nil && slogger != nil {
				slogger.Error("record login log failed", "error", err)
			}
		}(entry)
	}
}
