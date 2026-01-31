//go:build darwin

package server

import (
	"time"

	"golang.org/x/sys/unix"
)

// resolveDarwinUptime fetches system boot time via sysctl.
func resolveDarwinUptime(now time.Time) (time.Duration, bool) {
	tv, err := unix.SysctlTimeval("kern.boottime")
	if err != nil {
		return 0, false
	}
	boot := time.Unix(int64(tv.Sec), int64(tv.Usec)*1000)
	if boot.After(now) {
		return 0, false
	}
	return now.Sub(boot), true
}
