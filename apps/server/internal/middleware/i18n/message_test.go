package i18n

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestMessageFallbackWithoutMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)

	got := Message(ctx, "unknown message")
	if got != "unknown message" {
		t.Fatalf("expected fallback to original message, got %q", got)
	}
}

func TestMessageWithLocalization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest("GET", "/", nil)
	ctx.Request.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")

	if lang := resolveLanguage(ctx, "en"); lang != "zh-Hans" {
		t.Fatalf("expected language matcher to pick zh-Hans, got %q", lang)
	}

	mw := Middleware()
	mw(ctx)

	got := Message(ctx, "OK")
	if got != "成功" {
		t.Fatalf("expected Chinese translation, got %q", got)
	}
}
