package netutil

import (
	"net"
	"net/http"
	"strings"
)

var headerPriority = []string{
	"Cf-Connecting-Ip",
	"True-Client-Ip",
	"X-Forwarded-For",
	"X-Real-Ip",
	"X-Client-Ip",
	"X-Forwarded",
	"Forwarded",
}

// RealIP extracts the best-effort client IP from common proxy/CDN headers.
func RealIP(r *http.Request) string {
	if r == nil {
		return ""
	}

	for _, header := range headerPriority {
		value := strings.TrimSpace(r.Header.Get(header))
		if value == "" {
			continue
		}
		switch strings.ToLower(header) {
		case "x-forwarded-for", "x-forwarded":
			if ip := firstForwardedIP(value); ip != "" {
				return ip
			}
		case "forwarded":
			if ip := parseForwardedHeader(value); ip != "" {
				return ip
			}
		default:
			if ip := stripPort(value); ip != "" {
				if ip4 := asIPv4(ip); ip4 != "" {
					return ip4
				}
				return ip
			}
		}
	}

	host := stripPort(r.RemoteAddr)
	if host != "" {
		if ip4 := asIPv4(host); ip4 != "" {
			return ip4
		}
		return host
	}
	return ""
}

func firstForwardedIP(value string) string {
	parts := strings.Split(value, ",")
	var fallback string
	for _, part := range parts {
		ip := stripPort(part)
		if ip != "" {
			if ip4 := asIPv4(ip); ip4 != "" {
				return ip4
			}
			if fallback == "" {
				fallback = ip
			}
		}
	}
	return fallback
}

func parseForwardedHeader(value string) string {
	segments := strings.Split(value, ",")
	var fallback string
	for _, segment := range segments {
		directives := strings.Split(segment, ";")
		for _, directive := range directives {
			directive = strings.TrimSpace(directive)
			if !strings.HasPrefix(strings.ToLower(directive), "for=") {
				continue
			}
			ip := strings.TrimPrefix(directive, "for=")
			ip = strings.Trim(ip, "\"[]")
			ip = stripPort(ip)
			if ip != "" {
				if ip4 := asIPv4(ip); ip4 != "" {
					return ip4
				}
				if fallback == "" {
					fallback = ip
				}
			}
		}
	}
	return fallback
}

func stripPort(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if strings.Contains(value, ":") {
		if host, _, err := net.SplitHostPort(value); err == nil {
			return host
		}
	}
	value = strings.Trim(value, "[]\"")
	return value
}

func asIPv4(value string) string {
	ip := net.ParseIP(value)
	if ip == nil {
		return ""
	}
	if v4 := ip.To4(); v4 != nil {
		return v4.String()
	}
	return ""
}
