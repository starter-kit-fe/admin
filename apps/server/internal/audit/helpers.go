package audit

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func shortHandlerName(name string) string {
	if name == "" {
		return ""
	}
	if idx := strings.LastIndex(name, "."); idx >= 0 && idx < len(name)-1 {
		return name[idx+1:]
	}
	return name
}

func deriveErrorMessage(ctx *gin.Context) string {
	if ctx == nil {
		return ""
	}
	if errs := ctx.Errors.ByType(gin.ErrorTypePrivate); len(errs) > 0 {
		return errs.String()
	}
	if status := ctx.Writer.Status(); status >= http.StatusBadRequest {
		if msg := http.StatusText(status); msg != "" {
			return msg
		}
	}
	return ""
}

func isMutationMethod(method string) bool {
	switch strings.ToUpper(method) {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func mapMethodToBusinessType(method string) int {
	switch strings.ToUpper(method) {
	case http.MethodPost:
		return 1
	case http.MethodPut, http.MethodPatch:
		return 2
	case http.MethodDelete:
		return 3
	default:
		return 0
	}
}

func parseUserAgent(ua string) (browser, os string) {
	normalized := strings.ToLower(strings.TrimSpace(ua))

	switch {
	case strings.Contains(normalized, "chrome") && !strings.Contains(normalized, "edg"):
		browser = "Chrome"
	case strings.Contains(normalized, "safari") && !strings.Contains(normalized, "chrome"):
		browser = "Safari"
	case strings.Contains(normalized, "firefox"):
		browser = "Firefox"
	case strings.Contains(normalized, "edg"):
		browser = "Edge"
	case strings.Contains(normalized, "msie") || strings.Contains(normalized, "trident"):
		browser = "IE"
	default:
		browser = "Unknown"
	}

	switch {
	case strings.Contains(normalized, "windows"):
		os = "Windows"
	case strings.Contains(normalized, "mac os") || strings.Contains(normalized, "macintosh"):
		os = "macOS"
	case strings.Contains(normalized, "android"):
		os = "Android"
	case strings.Contains(normalized, "iphone") || strings.Contains(normalized, "ipad"):
		os = "iOS"
	case strings.Contains(normalized, "linux"):
		os = "Linux"
	default:
		os = "Unknown"
	}
	return
}

func unixMillis(t time.Time) int64 {
	if t.IsZero() {
		return 0
	}
	return t.UnixMilli()
}

func deriveOperationTitle(template, path string) string {
	source := template
	if strings.TrimSpace(source) == "" {
		source = path
	}
	source = strings.Trim(source, "/")
	if source == "" {
		return "unknown"
	}
	parts := strings.Split(source, "/")
	if len(parts) >= 2 {
		return strings.Join(parts[:2], "/")
	}
	return parts[0]
}

func mapOperatorType(authenticated bool) int {
	if authenticated {
		return 1
	}
	return 0
}

func bufferString(buf *bytes.Buffer) string {
	if buf == nil {
		return ""
	}
	return buf.String()
}

func extractUsername(buf *bytes.Buffer) string {
	if buf == nil || buf.Len() == 0 {
		return ""
	}
	var payload struct {
		Username string `json:"username"`
		UserName string `json:"userName"`
	}
	if err := json.Unmarshal(buf.Bytes(), &payload); err != nil {
		return ""
	}
	if val := strings.TrimSpace(payload.Username); val != "" {
		return val
	}
	return strings.TrimSpace(payload.UserName)
}
