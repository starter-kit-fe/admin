package resp

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	appi18n "github.com/starter-kit-fe/admin/pkg/i18n"
)

func TestOKUsesLocalizedMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest("GET", "/", nil)
	ctx.Request.Header.Set("Accept-Language", "zh-CN")

	mw := appi18n.Middleware()
	mw(ctx)

	OK(ctx)

	var payload Response
	if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if payload.Message != "成功" {
		t.Fatalf("expected Chinese translation, got %q", payload.Message)
	}
}
