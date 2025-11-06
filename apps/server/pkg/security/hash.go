package security

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// SHA256Hex returns the lowercase hexadecimal SHA-256 digest of the provided string.
// It trims surrounding whitespace before hashing to ensure consistent values.
func SHA256Hex(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(trimmed))
	return hex.EncodeToString(sum[:])
}
