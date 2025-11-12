package audit

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/middleware"
)

// NewOperationMiddleware builds a Gin middleware that persists operation logs through the provided logger.
func NewOperationMiddleware(logger OperationLogger, resolver UserResolver, opts OperationOptions) gin.HandlerFunc {
	if logger == nil {
		return nil
	}

	bodyLimit := opts.MaxBodyBytes
	if bodyLimit <= 0 {
		bodyLimit = 8 * 1024
	}
	resultLimit := opts.MaxResultBytes
	if resultLimit <= 0 {
		resultLimit = 8 * 1024
	}

	slogger := opts.Logger

	return func(ctx *gin.Context) {
		if ctx.Request == nil || !isMutationMethod(ctx.Request.Method) {
			ctx.Next()
			return
		}

		var identity *UserIdentity
		userID, authenticated := middleware.GetUserID(ctx)
		if authenticated && resolver != nil {
			if resolved, err := resolver.Resolve(ctx.Request.Context(), userID); err == nil {
				identity = resolved
			} else if slogger != nil {
				slogger.Debug("resolve operator failed", "error", err, "user_id", userID)
			}
		}

		bodyBuf := attachBodyRecorder(ctx.Request, bodyLimit)
		recorder := newResponseRecorder(ctx.Writer, resultLimit)
		ctx.Writer = recorder

		start := time.Now()
		handlerName := shortHandlerName(ctx.HandlerName())
		templatePath := ctx.FullPath()
		rawPath := ctx.Request.URL.Path
		clientIP := ctx.ClientIP()

		ctx.Next()

		duration := time.Since(start)
		status := 0
		if ctx.Writer.Status() >= http.StatusBadRequest {
			status = 1
		}

		entry := OperationEntry{
			Title:         deriveOperationTitle(templatePath, rawPath),
			BusinessType:  mapMethodToBusinessType(ctx.Request.Method),
			Method:        handlerName,
			RequestMethod: ctx.Request.Method,
			OperatorType:  mapOperatorType(authenticated),
			URL:           rawPath,
			IP:            clientIP,
			Status:        status,
			ErrorMessage:  deriveErrorMessage(ctx),
			RequestBody:   bufferString(bodyBuf),
			ResponseBody:  recorder.String(),
			CostMillis:    duration.Milliseconds(),
			OccurredAt:    unixMillis(time.Now()),
		}
		if identity != nil {
			entry.OperatorName = identity.UserName
			entry.DeptName = identity.DeptName
		}

		go func(payload OperationEntry) {
			if err := logger.RecordOperation(context.Background(), payload); err != nil && slogger != nil {
				slogger.Error("record operation log failed", "error", err, "path", payload.URL)
			}
		}(entry)
	}
}
