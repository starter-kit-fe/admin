package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

func RequirePermissions(permissions ...string) gin.HandlerFunc {
	required := normalizePermissions(permissions)
	if len(required) == 0 {
		return func(ctx *gin.Context) {
			ctx.Next()
		}
	}

	return func(ctx *gin.Context) {
		set, ok := getPermissionSet(ctx)
		if !ok || set == nil {
			resp.Forbidden(ctx, resp.WithMessage("permission context missing"))
			ctx.Abort()
			return
		}

		for perm := range required {
			if set.has(perm) {
				ctx.Next()
				return
			}
		}

		resp.Forbidden(ctx, resp.WithMessage("insufficient permissions"))
		ctx.Abort()
	}
}

func normalizePermissions(perms []string) map[string]struct{} {
	normalized := make(map[string]struct{}, len(perms))
	for _, perm := range perms {
		perm = strings.TrimSpace(perm)
		if perm == "" {
			continue
		}
		normalized[perm] = struct{}{}
	}
	return normalized
}
