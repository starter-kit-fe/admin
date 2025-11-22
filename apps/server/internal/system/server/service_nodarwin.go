//go:build !darwin

package server

import (
	"errors"
	"runtime"
	"time"
)

func darwinLoadAverage() (float64, float64, float64, error) {
	return 0, 0, 0, errors.New("darwin load average not supported on this platform")
}

func darwinCPUTicks() (uint64, uint64, error) {
	return 0, 0, errors.New("darwin cpu ticks not supported on this platform")
}

func resolveSystemUptime(startTime time.Time) time.Duration {
	if runtime.GOOS == "linux" {
		if uptime, err := readProcUptime(); err == nil && uptime > 0 {
			return uptime
		}
	}
	// fallback to process lifetime when platform-specific uptime is unavailable
	return time.Since(startTime)
}
