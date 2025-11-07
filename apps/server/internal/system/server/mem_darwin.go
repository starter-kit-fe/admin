//go:build darwin

package server

import (
	"bufio"
	"bytes"
	"os/exec"
	"strconv"
	"strings"

	"golang.org/x/sys/unix"
)

func readMeminfoDarwin() (total uint64, free uint64) {
	total, _ = unix.SysctlUint64("hw.memsize")

	pageSize := uint64(4096)
	if size, err := unix.SysctlUint64("hw.pagesize"); err == nil && size > 0 {
		pageSize = size
	}

	output, err := exec.Command("vm_stat").Output()
	if err != nil {
		if freePages, sysErr := unix.SysctlUint64("vm.page_free_count"); sysErr == nil {
			free = freePages * pageSize
		}
		return total, free
	}

	var (
		freePages        uint64
		inactivePages    uint64
		speculativePages uint64
		purgeablePages   uint64
	)

	parseValue := func(line string) uint64 {
		parts := strings.Split(line, ":")
		if len(parts) < 2 {
			return 0
		}
		valueStr := strings.TrimSpace(parts[1])
		valueStr = strings.TrimSuffix(valueStr, ".")
		valueStr = strings.ReplaceAll(valueStr, ".", "")
		valueStr = strings.ReplaceAll(valueStr, ",", "")
		val, err := strconv.ParseUint(valueStr, 10, 64)
		if err != nil {
			return 0
		}
		return val
	}

	scanner := bufio.NewScanner(bytes.NewReader(output))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "page size of") {
			start := strings.Index(line, "page size of")
			if start != -1 {
				valuePart := line[start+len("page size of"):]
				valuePart = strings.TrimSpace(strings.TrimSuffix(valuePart, ")"))
				valuePart = strings.TrimSuffix(valuePart, "bytes")
				valuePart = strings.TrimSpace(valuePart)
				if parsed, parseErr := strconv.ParseUint(valuePart, 10, 64); parseErr == nil && parsed > 0 {
					pageSize = parsed
				}
			}
			continue
		}
		switch {
		case strings.HasPrefix(line, "Pages free"):
			freePages = parseValue(line)
		case strings.HasPrefix(line, "Pages inactive"):
			inactivePages = parseValue(line)
		case strings.HasPrefix(line, "Pages speculative"):
			speculativePages = parseValue(line)
		case strings.HasPrefix(line, "Pages purgeable"):
			purgeablePages = parseValue(line)
		}
	}

	totalFreePages := freePages + inactivePages + speculativePages + purgeablePages
	if totalFreePages == 0 {
		if err := scanner.Err(); err != nil {
			if fallBackPages, sysErr := unix.SysctlUint64("vm.page_free_count"); sysErr == nil {
				free = fallBackPages * pageSize
			}
		}
		return total, free
	}

	free = totalFreePages * pageSize
	if free > total {
		free = total
	}
	return total, free
}

func darwinKernelVersion() string {
	release, err := unix.Sysctl("kern.osrelease")
	if err != nil {
		return ""
	}
	return release
}
