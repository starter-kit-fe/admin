//go:build !darwin

package server

import "time"

func resolveDarwinUptime(time.Time) (time.Duration, bool) {
	return 0, false
}
