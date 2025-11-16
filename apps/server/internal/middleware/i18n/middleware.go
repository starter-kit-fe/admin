package i18n

import (
	"embed"
	"encoding/json"
	"strings"
	"sync"

	gini18n "github.com/gin-contrib/i18n"
	"github.com/gin-gonic/gin"
	"golang.org/x/text/language"
)

const localeRoot = "locales"

var (
	//go:embed locales/*.json
	localeFS embed.FS

	supportedLanguages = []language.Tag{
		language.English,
		language.SimplifiedChinese,
	}
	langMatcher = language.NewMatcher(supportedLanguages)

	middlewareOnce sync.Once
	middleware     gin.HandlerFunc
)

type embeddedLoader struct{}

func (embeddedLoader) LoadMessage(path string) ([]byte, error) {
	return localeFS.ReadFile(path)
}

// Middleware attaches the gin-contrib i18n localizer to every request.
func Middleware() gin.HandlerFunc {
	middlewareOnce.Do(func() {
		cfg := &gini18n.BundleCfg{
			DefaultLanguage:  language.English,
			FormatBundleFile: "json",
			AcceptLanguage:   supportedLanguages,
			RootPath:         localeRoot,
			UnmarshalFunc:    json.Unmarshal,
			Loader:           embeddedLoader{},
		}
		middleware = gini18n.Localize(
			gini18n.WithBundle(cfg),
			gini18n.WithGetLngHandle(resolveLanguage),
		)
	})
	return middleware
}

func resolveLanguage(ctx *gin.Context, fallback string) string {
	if ctx == nil {
		return fallback
	}

	if lang := matchAcceptLanguage(ctx.GetHeader("Accept-Language")); lang != "" {
		return lang
	}

	if cookie, err := ctx.Cookie("lang"); err == nil {
		if lang := canonicalize(cookie); lang != "" {
			return lang
		}
	}

	return fallback
}

func canonicalize(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	tag, err := language.Parse(raw)
	if err != nil {
		return ""
	}
	_, idx, _ := langMatcher.Match(tag)
	return supportedLanguages[idx].String()
}

func matchAcceptLanguage(header string) string {
	header = strings.TrimSpace(header)
	if header == "" {
		return ""
	}

	tags, _, err := language.ParseAcceptLanguage(header)
	if err != nil || len(tags) == 0 {
		return ""
	}

	_, idx, _ := langMatcher.Match(tags...)
	return supportedLanguages[idx].String()
}
