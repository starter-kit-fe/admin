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
            ip := stripPort(value)
            if ip != "" {
                return ip
            }
        }
    }

    host := stripPort(r.RemoteAddr)
    if host != "" {
        return host
    }
    return ""
}

func firstForwardedIP(value string) string {
    parts := strings.Split(value, ",")
    for _, part := range parts {
        ip := stripPort(part)
        if ip != "" {
            return ip
        }
    }
    return ""
}

func parseForwardedHeader(value string) string {
    segments := strings.Split(value, ",")
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
                return ip
            }
        }
    }
    return ""
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
