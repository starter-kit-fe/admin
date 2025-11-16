package middleware

import (
	"context"
	"errors"
	"log/slog"
	"strings"

	"github.com/gin-gonic/gin"
	jwtv5 "github.com/golang-jwt/jwt/v5"

	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/resp"
	"github.com/starter-kit-fe/admin/pkg/security"
)

type PermissionProvider interface {
	LoadPermissions(ctx context.Context, userID uint) ([]string, error)
}

type TokenBlocklist interface {
	IsTokenBlocked(ctx context.Context, tokenHash string) (bool, error)
}

type SessionValidator interface {
	GetSession(ctx context.Context, sessionID string) (SessionMetadata, error)
	UpdateLastSeen(ctx context.Context, sessionID string) error
}

type SessionMetadata struct {
	UserID  uint
	Revoked bool
}

type JWTAuthOptions struct {
	Secret     string
	CookieName string
	Provider   PermissionProvider
	Logger     *slog.Logger
	Blocklist  TokenBlocklist
	Sessions   SessionValidator
}

func NewJWTAuthMiddleware(options JWTAuthOptions) gin.HandlerFunc {
	secret := strings.TrimSpace(options.Secret)
	cookieName := strings.TrimSpace(options.CookieName)
	logger := options.Logger
	provider := options.Provider
	blocklist := options.Blocklist
	sessions := options.Sessions

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

		token := extractToken(ctx, cookieName)
		if token == "" {
			resp.Unauthorized(ctx, resp.WithMessage("missing authentication token"))
			ctx.Abort()
			return
		}

		claims, err := jwtMaker.VerifyToken(token, secret)
		if err != nil {
			expired := errors.Is(err, jwtv5.ErrTokenExpired)
			if logger != nil {
				logger.Warn("verify jwt token failed", "error", err, "expired", expired)
			}
			if expired {
				resp.Unauthorized(ctx, resp.WithMessage("access token expired"))
			} else {
				resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
			}
			ctx.Abort()
			return
		}

		if blocklist != nil {
			tokenHash := security.SHA256Hex(token)
			if tokenHash != "" {
				blocked, err := blocklist.IsTokenBlocked(ctx.Request.Context(), tokenHash)
				if err != nil {
					if logger != nil {
						logger.Error("check token blocklist failed", "error", err)
					}
					resp.InternalServerError(ctx, resp.WithMessage("token validation failed"))
					ctx.Abort()
					return
				}
				if blocked {
					resp.Unauthorized(ctx, resp.WithMessage("token revoked"))
					ctx.Abort()
					return
				}
			}
		}

		sessionID := strings.TrimSpace(claims.SessionID)
		if sessionID == "" {
			resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
			ctx.Abort()
			return
		}
		if sessions != nil {
			record, err := sessions.GetSession(ctx.Request.Context(), sessionID)
			if err != nil {
				if logger != nil {
					logger.Warn("session lookup failed", "error", err, "session_id", sessionID)
				}
				resp.Unauthorized(ctx, resp.WithMessage("session invalid"))
				ctx.Abort()
				return
			}
			if record.Revoked || record.UserID != claims.ID {
				resp.Unauthorized(ctx, resp.WithMessage("session revoked"))
				ctx.Abort()
				return
			}
			if err := sessions.UpdateLastSeen(ctx.Request.Context(), sessionID); err != nil && logger != nil {
				logger.Warn("update session last_seen failed", "error", err, "session_id", sessionID)
			}
		}

		setClaims(ctx, claims)
		setUserID(ctx, claims.ID)
		setSessionID(ctx, sessionID)

		if provider != nil {
			perms, err := provider.LoadPermissions(ctx.Request.Context(), claims.ID)
			if err != nil {
				if logger != nil {
					logger.Error("load permissions failed", "error", err, "user_id", claims.ID)
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

func extractToken(ctx *gin.Context, cookieName string) string {
	header := strings.TrimSpace(ctx.GetHeader("Authorization"))
	if header != "" {
		if token := parseBearerToken(header); token != "" {
			return token
		}
	}

	if token := strings.TrimSpace(ctx.Query("token")); token != "" {
		return token
	}

	if cookieName != "" {
		if token, err := ctx.Cookie(cookieName); err == nil {
			if trimmed := strings.TrimSpace(token); trimmed != "" {
				return trimmed
			}
		}
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
