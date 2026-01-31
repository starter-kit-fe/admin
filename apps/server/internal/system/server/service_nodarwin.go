//go:build !darwin

package server

import (
	"errors"
)

func darwinLoadAverage() (float64, float64, float64, error) {
	return 0, 0, 0, errors.New("darwin load average not supported on this platform")
}

func darwinCPUTicks() (uint64, uint64, error) {
	return 0, 0, errors.New("darwin cpu ticks not supported on this platform")
}
