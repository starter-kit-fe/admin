package app

import (
	"os"
	"path/filepath"
	"strings"
)

const frontendOutDirEnv = "FRONTEND_OUT_DIR"

func resolveFrontendDir() string {
	envDir := strings.TrimSpace(os.Getenv(frontendOutDirEnv))
	if envDir != "" {
		if dirExists(envDir) {
			return envDir
		}
	}

	candidates := []string{
		filepath.Join(".", "web", "out"),
		filepath.Join(".", "apps", "web", "out"),
		filepath.Join("..", "web", "out"),
	}

	for _, candidate := range candidates {
		if dirExists(candidate) {
			return candidate
		}
	}

	return ""
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
