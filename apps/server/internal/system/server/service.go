package server

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"math"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/starter-kit-fe/admin/constant"
	"golang.org/x/sys/unix"
)

type Service struct {
	startTime time.Time
	pid       int
	mu        sync.Mutex
	lastCPU   cpuSample
}

func NewService() *Service {
	return &Service{
		startTime: time.Now(),
		pid:       os.Getpid(),
	}
}

type Status struct {
	Host    HostInfo    `json:"host"`
	CPU     CPUInfo     `json:"cpu"`
	Memory  MemoryInfo  `json:"memory"`
	Disks   []DiskInfo  `json:"disks"`
	Process ProcessInfo `json:"process"`
}

type HostInfo struct {
	Hostname      string `json:"hostname"`
	OS            string `json:"os"`
	Arch          string `json:"arch"`
	Uptime        string `json:"uptime"`
	UptimeSeconds int64  `json:"uptimeSeconds"`
	GoVersion     string `json:"goVersion"`
	KernelVersion string `json:"kernelVersion,omitempty"`
	Clock         string `json:"currentTime"`
}

type CPUInfo struct {
	Cores        int     `json:"cores"`
	Load1        float64 `json:"load1"`
	Load5        float64 `json:"load5"`
	Load15       float64 `json:"load15"`
	UsagePercent float64 `json:"usagePercent"`
}

type MemoryInfo struct {
	Total        uint64  `json:"total"`
	Free         uint64  `json:"free"`
	Used         uint64  `json:"used"`
	UsedPercent  float64 `json:"usedPercent"`
	ProcessAlloc uint64  `json:"processAlloc"`
}

type DiskInfo struct {
	Mountpoint  string  `json:"mountpoint"`
	Filesystem  string  `json:"filesystem"`
	Total       uint64  `json:"total"`
	Free        uint64  `json:"free"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

type ProcessInfo struct {
	PID           int     `json:"pid"`
	StartTime     string  `json:"startTime"`
	Uptime        string  `json:"uptime"`
	UptimeSeconds int64   `json:"uptimeSeconds"`
	GoVersion     string  `json:"goVersion"`
	NumGoroutine  int     `json:"numGoroutine"`
	Alloc         uint64  `json:"alloc"`
	TotalAlloc    uint64  `json:"totalAlloc"`
	Sys           uint64  `json:"sys"`
	NumGC         uint32  `json:"numGC"`
	LastGC        string  `json:"lastGC"`
	NextGC        uint64  `json:"nextGC"`
	CPUUsage      float64 `json:"cpuUsage"`
	NumCgoCall    int64   `json:"numCgoCall"`
	Version       string  `json:"version"`
	Commit        string  `json:"commit"`
}

func (s *Service) GetStatus(ctx context.Context) (*Status, error) {
	if s == nil {
		return nil, errors.New("service not initialized")
	}

	host := collectHostInfo(s.startTime)
	cpuInfo := s.collectCPUInfo()
	memInfo := collectMemoryInfo()
	diskInfo := collectDiskInfo()
	processInfo := s.collectProcessInfo()

	return &Status{
		Host:    host,
		CPU:     cpuInfo,
		Memory:  memInfo,
		Disks:   diskInfo,
		Process: processInfo,
	}, nil
}

func collectHostInfo(startTime time.Time) HostInfo {
	hostname, _ := os.Hostname()
	now := time.Now()
	uptime := resolveSystemUptime(startTime)

	kernelVersion := readKernelVersion()

	return HostInfo{
		Hostname:      hostname,
		OS:            runtime.GOOS,
		Arch:          runtime.GOARCH,
		GoVersion:     runtime.Version(),
		KernelVersion: kernelVersion,
		UptimeSeconds: int64(uptime.Seconds()),
		Uptime:        formatDuration(uptime),
		Clock:         now.Format("2006-01-02 15:04:05"),
	}
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

func readProcUptime() (time.Duration, error) {
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0, err
	}
	fields := strings.Fields(string(data))
	if len(fields) == 0 {
		return 0, errors.New("malformed /proc/uptime")
	}
	seconds, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0, err
	}
	return time.Duration(seconds * float64(time.Second)), nil
}

func (s *Service) collectCPUInfo() CPUInfo {
	cores := runtime.NumCPU()

	load1, load5, load15 := getLoadAverage()
	usage := s.calculateProcessCPUUsage()

	return CPUInfo{
		Cores:        cores,
		Load1:        round(load1, 2),
		Load5:        round(load5, 2),
		Load15:       round(load15, 2),
		UsagePercent: round(usage, 2),
	}
}

type cpuSample struct {
	time    time.Time
	total   uint64
	idle    uint64
	process uint64
}

func (s *Service) calculateProcessCPUUsage() float64 {
	if runtime.GOOS != "linux" {
		return 0
	}

	now := time.Now()
	total, idle, err := readTotalAndIdleCPU()
	if err != nil {
		return 0
	}

	processTime, err := readProcessCPUTime(s.pid)
	if err != nil {
		return 0
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	current := cpuSample{
		time:    now,
		total:   total,
		idle:    idle,
		process: processTime,
	}

	if s.lastCPU.time.IsZero() {
		s.lastCPU = current
		return 0
	}

	deltaTotal := current.total - s.lastCPU.total
	if deltaTotal == 0 {
		return 0
	}
	deltaProcess := current.process - s.lastCPU.process

	s.lastCPU = current

	usage := float64(deltaProcess) / float64(deltaTotal) * 100.0 * float64(runtime.NumCPU())
	if usage < 0 {
		usage = 0
	}
	return usage
}

func collectMemoryInfo() MemoryInfo {
	total, free := readSystemMemory()
	used := uint64(0)
	if total > free {
		used = total - free
	}

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	percent := 0.0
	if total > 0 {
		percent = float64(used) / float64(total) * 100
	}

	return MemoryInfo{
		Total:        total,
		Free:         free,
		Used:         used,
		UsedPercent:  round(percent, 2),
		ProcessAlloc: memStats.Alloc,
	}
}

func collectDiskInfo() []DiskInfo {
	var stats []DiskInfo

	paths := []string{"/"}
	if runtime.GOOS == "windows" {
		paths = []string{"C:\\"}
	}

	for _, path := range paths {
		var fs unix.Statfs_t
		if err := unix.Statfs(path, &fs); err != nil {
			continue
		}

		total := fs.Blocks * uint64(fs.Bsize)
		free := fs.Bavail * uint64(fs.Bsize)
		used := total - free
		percent := 0.0
		if total > 0 {
			percent = float64(used) / float64(total) * 100
		}

		stats = append(stats, DiskInfo{
			Mountpoint:  path,
			Filesystem:  detectFilesystem(path),
			Total:       total,
			Free:        free,
			Used:        used,
			UsedPercent: round(percent, 2),
		})
	}

	return stats
}

func detectFilesystem(path string) string {
	file, err := os.Open("/proc/mounts")
	if err != nil {
		return ""
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) >= 3 && fields[1] == path {
			return fields[2]
		}
	}
	return ""
}

func (s *Service) collectProcessInfo() ProcessInfo {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	now := time.Now()
	uptime := now.Sub(s.startTime)
	lastGC := ""
	if memStats.LastGC > 0 {
		lastGC = time.Unix(0, int64(memStats.LastGC)).Format("2006-01-02 15:04:05")
	}

	cpuUsage := s.calculateProcessCPUUsage()

	return ProcessInfo{
		PID:           s.pid,
		StartTime:     s.startTime.Format("2006-01-02 15:04:05"),
		UptimeSeconds: int64(uptime.Seconds()),
		Uptime:        formatDuration(uptime),
		GoVersion:     runtime.Version(),
		NumGoroutine:  runtime.NumGoroutine(),
		Alloc:         memStats.Alloc,
		TotalAlloc:    memStats.TotalAlloc,
		Sys:           memStats.Sys,
		NumGC:         memStats.NumGC,
		LastGC:        lastGC,
		NextGC:        memStats.NextGC,
		CPUUsage:      round(cpuUsage, 2),
		NumCgoCall:    runtime.NumCgoCall(),
		Version:       constant.VERSION,
		Commit:        constant.COMMIT,
	}
}

func readSystemMemory() (total uint64, free uint64) {
	switch runtime.GOOS {
	case "linux":
		return readMeminfoLinux()
	case "darwin":
		return readMeminfoDarwin()
	default:
		return 0, 0
	}
}

func readMeminfoLinux() (total uint64, free uint64) {
	file, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0, 0
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "MemTotal:") {
			total = parseMeminfoValue(line)
		} else if strings.HasPrefix(line, "MemAvailable:") {
			free = parseMeminfoValue(line)
		}
		if total > 0 && free > 0 {
			break
		}
	}

	return total, free
}

func parseMeminfoValue(line string) uint64 {
	parts := strings.Fields(line)
	if len(parts) < 2 {
		return 0
	}
	value, err := strconv.ParseUint(parts[1], 10, 64)
	if err != nil {
		return 0
	}
	// values in kB
	return value * 1024
}

func getLoadAverage() (float64, float64, float64) {
	if runtime.GOOS == "linux" {
		data, err := os.ReadFile("/proc/loadavg")
		if err != nil {
			return 0, 0, 0
		}
		fields := strings.Fields(string(data))
		if len(fields) < 3 {
			return 0, 0, 0
		}
		load1, err1 := strconv.ParseFloat(fields[0], 64)
		load5, err5 := strconv.ParseFloat(fields[1], 64)
		load15, err15 := strconv.ParseFloat(fields[2], 64)
		if err1 != nil || err5 != nil || err15 != nil {
			return 0, 0, 0
		}
		return load1, load5, load15
	}

	// For unsupported platforms return zeros.
	return 0, 0, 0
}

func formatDuration(d time.Duration) string {
	if d < time.Second {
		return "0s"
	}

	d = d.Round(time.Second)
	hours := d / time.Hour
	d -= hours * time.Hour
	minutes := d / time.Minute
	d -= minutes * time.Minute
	seconds := d / time.Second

	parts := make([]string, 0, 3)
	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%dh", hours))
	}
	if minutes > 0 {
		parts = append(parts, fmt.Sprintf("%dm", minutes))
	}
	if seconds > 0 || len(parts) == 0 {
		parts = append(parts, fmt.Sprintf("%ds", seconds))
	}
	return strings.Join(parts, " ")
}

func round(value float64, precision int) float64 {
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return 0
	}
	factor := math.Pow(10, float64(precision))
	return math.Round(value*factor) / factor
}

func readKernelVersion() string {
	switch runtime.GOOS {
	case "linux":
		if data, err := os.ReadFile("/proc/sys/kernel/osrelease"); err == nil {
			return strings.TrimSpace(string(data))
		}
	case "darwin":
		return darwinKernelVersion()
	}
	return ""
}

func readTotalAndIdleCPU() (total uint64, idle uint64, err error) {
	file, err := os.Open("/proc/stat")
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 5 {
			continue
		}
		if fields[0] != "cpu" {
			continue
		}

		var values []uint64
		for _, field := range fields[1:] {
			v, parseErr := strconv.ParseUint(field, 10, 64)
			if parseErr != nil {
				return 0, 0, parseErr
			}
			values = append(values, v)
		}

		for _, v := range values {
			total += v
		}
		if len(values) > 3 {
			idle = values[3]
		}
		return total, idle, nil
	}
	return 0, 0, errors.New("cpu line not found")
}

func readProcessCPUTime(pid int) (uint64, error) {
	statPath := fmt.Sprintf("/proc/%d/stat", pid)
	data, err := os.ReadFile(statPath)
	if err != nil {
		return 0, err
	}

	fields := strings.Fields(string(data))
	if len(fields) < 17 {
		return 0, errors.New("unexpected stat format")
	}

	utime, err := strconv.ParseUint(fields[13], 10, 64)
	if err != nil {
		return 0, err
	}
	stime, err := strconv.ParseUint(fields[14], 10, 64)
	if err != nil {
		return 0, err
	}

	return utime + stime, nil
}
