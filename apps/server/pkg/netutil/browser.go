package netutil

import (
	"net/http"
	"strings"
)

var browserTokens = []string{"mozilla", "chrome", "safari", "firefox", "edge", "trident"}

// IsBrowserRequest best-effort detects whether the incoming request originates from a browser
// by checking common User-Agent markers and Accept headers.
func IsBrowserRequest(req *http.Request) bool {
	if req == nil {
		return false
	}
	ua := strings.ToLower(strings.TrimSpace(req.UserAgent()))
	if ua != "" {
		for _, token := range browserTokens {
			if strings.Contains(ua, token) {
				return true
			}
		}
	}
	accept := strings.ToLower(strings.TrimSpace(req.Header.Get("Accept")))
	if accept == "" {
		return false
	}
	return strings.Contains(accept, "text/html") || strings.Contains(accept, "application/xhtml+xml")
}
