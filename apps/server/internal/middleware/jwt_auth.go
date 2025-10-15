package middleware

import (
	"context"
	"log/slog"
	"strings"

	"github.com/gin-gonic/gin"

	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type PermissionProvider interface {
	LoadPermissions(ctx context.Context, userID uint) ([]string, error)
}

func NewJWTAuthMiddleware(secret string, provider PermissionProvider, logger *slog.Logger) gin.HandlerFunc {
	secret = strings.TrimSpace(secret)
	jwtMaker := jwtpkg.NewJWTMaker()

	return func(ctx *gin.Context) {
		if secret == "" {
			if logger != nil {
				logger.Error("jwt secret is not configured")
			}
			resp.InternalServerError(ctx, resp.WithMessage("authentication is not configured"))
			ctx.Abort()
			return
		}

		token := extractToken(ctx)
		if token == "" {
			resp.Unauthorized(ctx, resp.WithMessage("missing or invalid authorization header"))
			ctx.Abort()
			return
		}

		claims, err := jwtMaker.VerifyToken(token, secret)
		if err != nil {
			if logger != nil {
				logger.Warn("verify jwt token failed", "error", err)
			}
			resp.Unauthorized(ctx, resp.WithMessage("invalid or expired token"))
			ctx.Abort()
			return
		}

		setClaims(ctx, claims)
		setUserID(ctx, claims.UserID)

		if provider != nil {
			perms, err := provider.LoadPermissions(ctx.Request.Context(), claims.UserID)
			if err != nil {
				if logger != nil {
					logger.Error("load permissions failed", "error", err, "user_id", claims.UserID)
				}
				resp.InternalServerError(ctx, resp.WithMessage("failed to load permissions"))
				ctx.Abort()
				return
			}
			setPermissions(ctx, perms)
		} else {
			setPermissions(ctx, nil)
		}

		ctx.Next()
	}
}

func extractToken(ctx *gin.Context) string {
	header := strings.TrimSpace(ctx.GetHeader("Authorization"))
	if header != "" {
		if token := parseBearerToken(header); token != "" {
			return token
		}
	}

	if token := strings.TrimSpace(ctx.Query("token")); token != "" {
		return token
	}

	return ""
}

func parseBearerToken(header string) string {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
