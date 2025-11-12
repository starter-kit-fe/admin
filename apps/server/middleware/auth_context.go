package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	ContextKeyUserID  = "auth.user_id"
	contextKeyClaims  = "auth.claims"
	contextKeyPermSet = "auth.permissions"
)

type permissionSet struct {
	allowAll bool
	values   map[string]struct{}
}

func setClaims(ctx *gin.Context, claims interface{}) {
	ctx.Set(contextKeyClaims, claims)
}

func setUserID(ctx *gin.Context, userID uint) {
	ctx.Set(ContextKeyUserID, userID)
}

func setPermissions(ctx *gin.Context, permissions []string) {
	set := &permissionSet{
		values: make(map[string]struct{}, len(permissions)),
	}

	for _, perm := range permissions {
		perm = strings.TrimSpace(perm)
		if perm == "" {
			continue
		}
		if perm == "*:*:*" {
			set.allowAll = true
		}
		set.values[perm] = struct{}{}
	}

	ctx.Set(contextKeyPermSet, set)
}

func getPermissionSet(ctx *gin.Context) (*permissionSet, bool) {
	value, ok := ctx.Get(contextKeyPermSet)
	if !ok {
		return nil, false
	}
	perms, ok := value.(*permissionSet)
	return perms, ok
}

func (p *permissionSet) has(permission string) bool {
	if p == nil {
		return false
	}
	if p.allowAll {
		return true
	}
	_, ok := p.values[permission]
	return ok
}

func GetUserID(ctx *gin.Context) (uint, bool) {
	value, ok := ctx.Get(ContextKeyUserID)
	if !ok {
		return 0, false
	}

	switch v := value.(type) {
	case uint:
		return v, true
	case uint64:
		return uint(v), true
	case int:
		if v < 0 {
			return 0, false
		}
		return uint(v), true
	case int64:
		if v < 0 {
			return 0, false
		}
		return uint(v), true
	default:
		return 0, false
	}
}

func GetClaims(ctx *gin.Context) (interface{}, bool) {
	return ctx.Get(contextKeyClaims)
}
