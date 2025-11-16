package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequirePermissions_AllowsWhenPermissionMatched(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(ctx *gin.Context) {
		setPermissions(ctx, []string{"system:user:list"})
	})
	router.GET("/", RequirePermissions("system:user:list"), func(ctx *gin.Context) {
		ctx.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.Code)
	}
}

func TestRequirePermissions_RejectsMissingPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(ctx *gin.Context) {
		setPermissions(ctx, []string{"system:user:list"})
	})
	router.GET("/", RequirePermissions("system:user:remove"), func(ctx *gin.Context) {
		ctx.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, resp.Code)
	}
}

func TestRequirePermissions_AllowsWildcardPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(ctx *gin.Context) {
		setPermissions(ctx, []string{"*:*:*"})
	})
	router.GET("/", RequirePermissions("system:user:remove"), func(ctx *gin.Context) {
		ctx.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.Code)
	}
}
