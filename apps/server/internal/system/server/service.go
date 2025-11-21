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
	startTime   time.Time
	pid         int
	mu          sync.Mutex
	lastProcCPU cpuSample
	lastSysCPU  cpuSample
	cacheMu     sync.RWMutex
	lastStatus  *Status
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
	BootTime      string `json:"bootTime,omitempty"`
	Uptime        string `json:"uptime"`
	UptimeSeconds int64  `json:"uptimeSeconds"`
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
	Limit        uint64  `json:"limit"`
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
	return s.collectStatus(ctx)
}

// SnapAndDiff 返回最新状态，同时基于上一次缓存生成差异补丁并更新缓存。
func (s *Service) SnapAndDiff(ctx context.Context) (*Status, *StatusPatch, error) {
	current, err := s.collectStatus(ctx)
	if err != nil {
		return nil, nil, err
	}

	s.cacheMu.Lock()
	prev := s.lastStatus
	s.lastStatus = current
	s.cacheMu.Unlock()

	if prev == nil {
		return current, nil, nil
	}

	patch := diffStatus(prev, current)
	return current, patch, nil
}

func (s *Service) collectStatus(ctx context.Context) (*Status, error) {
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
	bootTime := now.Add(-uptime)

	return HostInfo{
		Hostname:      hostname,
		OS:            runtime.GOOS,
		Arch:          runtime.GOARCH,
		UptimeSeconds: int64(uptime.Seconds()),
		Uptime:        formatDuration(uptime),
		Clock:         now.Format("2006-01-02 15:04:05"),
		BootTime:      bootTime.Format("2006-01-02 15:04:05"),
	}
}

type StatusPatch struct {
	Host    *HostInfo    `json:"host,omitempty"`
	CPU     *CPUInfo     `json:"cpu,omitempty"`
	Memory  *MemoryInfo  `json:"memory,omitempty"`
	Disks   *[]DiskInfo  `json:"disks,omitempty"`
	Process *ProcessInfo `json:"process,omitempty"`
}

func diffStatus(previous *Status, current *Status) *StatusPatch {
	if current == nil {
		return nil
	}
	if previous == nil {
		return &StatusPatch{
			Host:    &current.Host,
			CPU:     &current.CPU,
			Memory:  &current.Memory,
			Disks:   &current.Disks,
			Process: &current.Process,
		}
	}

	patch := &StatusPatch{}

	if hostChanged(previous.Host, current.Host) {
		patch.Host = &current.Host
	}
	if cpuChanged(previous.CPU, current.CPU) {
		patch.CPU = &current.CPU
	}
	if memoryChanged(previous.Memory, current.Memory) {
		patch.Memory = &current.Memory
	}
	if disksChanged(previous.Disks, current.Disks) {
		patch.Disks = &current.Disks
	}
	if processChanged(previous.Process, current.Process) {
		patch.Process = &current.Process
	}

	if patch.Host == nil && patch.CPU == nil && patch.Memory == nil && patch.Disks == nil && patch.Process == nil {
		return nil
	}
	return patch
}

func hostChanged(prev HostInfo, curr HostInfo) bool {
	return prev.Hostname != curr.Hostname ||
		prev.OS != curr.OS ||
		prev.Arch != curr.Arch ||
		prev.BootTime != curr.BootTime
}

func cpuChanged(prev CPUInfo, curr CPUInfo) bool {
	return prev.Cores != curr.Cores ||
		changedFloat(prev.Load1, curr.Load1) ||
		changedFloat(prev.Load5, curr.Load5) ||
		changedFloat(prev.Load15, curr.Load15) ||
		changedFloat(prev.UsagePercent, curr.UsagePercent)
}

func memoryChanged(prev MemoryInfo, curr MemoryInfo) bool {
	return prev.Total != curr.Total ||
		prev.Limit != curr.Limit ||
		prev.Free != curr.Free ||
		prev.Used != curr.Used ||
		changedFloat(prev.UsedPercent, curr.UsedPercent) ||
		prev.ProcessAlloc != curr.ProcessAlloc
}

func disksChanged(prev []DiskInfo, curr []DiskInfo) bool {
	if len(prev) != len(curr) {
		return true
	}
	for i := range prev {
		if prev[i].Mountpoint != curr[i].Mountpoint ||
			prev[i].Filesystem != curr[i].Filesystem ||
			prev[i].Total != curr[i].Total ||
			prev[i].Free != curr[i].Free ||
			prev[i].Used != curr[i].Used ||
			changedFloat(prev[i].UsedPercent, curr[i].UsedPercent) {
			return true
		}
	}
	return false
}

func processChanged(prev ProcessInfo, curr ProcessInfo) bool {
	return prev.PID != curr.PID ||
		prev.StartTime != curr.StartTime ||
		prev.NumGoroutine != curr.NumGoroutine ||
		prev.Alloc != curr.Alloc ||
		prev.Sys != curr.Sys ||
		prev.TotalAlloc != curr.TotalAlloc ||
		prev.NumGC != curr.NumGC ||
		prev.LastGC != curr.LastGC ||
		prev.NextGC != curr.NextGC ||
		changedFloat(prev.CPUUsage, curr.CPUUsage) ||
		prev.NumCgoCall != curr.NumCgoCall ||
		prev.Version != curr.Version ||
		prev.Commit != curr.Commit
}

func changedFloat(a, b float64) bool {
	return math.Abs(a-b) > 0.01
}

func resolveSystemUptime(startTime time.Time) time.Duration {
	if runtime.GOOS == "linux" {
		if uptime, err := readProcUptime(); err == nil && uptime > 0 {
			return uptime
		}
	}
	if runtime.GOOS == "darwin" {
		if tv, err := unix.SysctlTimeval("kern.boottime"); err == nil {
			boot := time.Unix(int64(tv.Sec), int64(tv.Usec)*1000)
			if boot.Before(time.Now()) {
				return time.Since(boot)
			}
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
	usage := s.calculateSystemCPUUsage()

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
	procDur time.Duration
}

func (s *Service) calculateProcessCPUUsage() float64 {
	if runtime.GOOS != "linux" {
		if runtime.GOOS == "darwin" {
			var ru unix.Rusage
			if err := unix.Getrusage(unix.RUSAGE_SELF, &ru); err != nil {
				return 0
			}
			now := time.Now()
			procDur := time.Duration(ru.Utime.Sec)*time.Second +
				time.Duration(ru.Utime.Usec)*time.Microsecond +
				time.Duration(ru.Stime.Sec)*time.Second +
				time.Duration(ru.Stime.Usec)*time.Microsecond

			s.mu.Lock()
			prev := s.lastProcCPU
			s.lastProcCPU = cpuSample{
				time:    now,
				procDur: procDur,
			}
			s.mu.Unlock()

			if prev.time.IsZero() {
				return 0
			}
			elapsed := now.Sub(prev.time)
			if elapsed <= 0 {
				return 0
			}
			deltaProc := procDur - prev.procDur
			if deltaProc <= 0 {
				return 0
			}
			usage := float64(deltaProc) / float64(elapsed) * 100
			return round(usage, 2)
		}
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

	if s.lastProcCPU.time.IsZero() {
		s.lastProcCPU = current
		return 0
	}

	deltaTotal := current.total - s.lastProcCPU.total
	if deltaTotal == 0 {
		return 0
	}
	deltaProcess := current.process - s.lastProcCPU.process

	s.lastProcCPU = current

	usage := float64(deltaProcess) / float64(deltaTotal) * 100.0 * float64(runtime.NumCPU())
	return round(usage, 2)
}

func (s *Service) calculateSystemCPUUsage() float64 {
	if runtime.GOOS == "linux" {
		now := time.Now()
		total, idle, err := readTotalAndIdleCPU()
		if err != nil {
			return 0
		}

		s.mu.Lock()
		prev := s.lastSysCPU
		s.lastSysCPU = cpuSample{
			time: now, total: total, idle: idle,
		}
		s.mu.Unlock()

		if prev.time.IsZero() {
			return 0
		}

		deltaTotal := total - prev.total
		deltaIdle := idle - prev.idle
		if deltaTotal == 0 || deltaIdle > deltaTotal {
			return 0
		}
		usage := float64(deltaTotal-deltaIdle) / float64(deltaTotal) * 100.0
		return round(usage, 2)
	}

	if runtime.GOOS == "darwin" {
		now := time.Now()
		total, idle, err := darwinCPUTicks()
		if err != nil {
			return 0
		}
		s.mu.Lock()
		prev := s.lastSysCPU
		s.lastSysCPU = cpuSample{
			time: now, total: total, idle: idle,
		}
		s.mu.Unlock()

		if prev.time.IsZero() {
			return 0
		}
		deltaTotal := total - prev.total
		deltaIdle := idle - prev.idle
		if deltaTotal == 0 || deltaIdle > deltaTotal {
			return 0
		}
		usage := float64(deltaTotal-deltaIdle) / float64(deltaTotal) * 100.0
		return round(usage, 2)
	}

	return 0
}

func collectMemoryInfo() MemoryInfo {
	total, free := readSystemMemory()
	limit := resolveMemoryLimit(total)

	// 尝试读取 cgroup 当前占用，更接近实际容器限制
	cgroupUsage := readCgroupMemoryUsage()
	used := cgroupUsage
	if used == 0 && total > free {
		used = total - free
	}

	if limit > 0 && used > limit {
		used = limit
	}
	if limit == 0 {
		limit = total
	}

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	percent := 0.0
	if limit > 0 {
		percent = float64(used) / float64(limit) * 100
	}

	return MemoryInfo{
		Total:        total,
		Limit:        limit,
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

func resolveMemoryLimit(systemTotal uint64) uint64 {
	limit := readCgroupMemoryLimit()
	if limit == 0 {
		return systemTotal
	}
	if systemTotal == 0 {
		return limit
	}
	if limit > 0 && limit < systemTotal {
		return limit
	}
	return systemTotal
}

func readCgroupMemoryLimit() uint64 {
	// cgroup v2
	if data, err := os.ReadFile("/sys/fs/cgroup/memory.max"); err == nil {
		value := strings.TrimSpace(string(data))
		if value != "" && value != "max" {
			if parsed, err := strconv.ParseUint(value, 10, 64); err == nil {
				return parsed
			}
		}
	}
	// cgroup v1
	if data, err := os.ReadFile("/sys/fs/cgroup/memory/memory.limit_in_bytes"); err == nil {
		if parsed, err := strconv.ParseUint(strings.TrimSpace(string(data)), 10, 64); err == nil {
			return parsed
		}
	}
	return 0
}

func readCgroupMemoryUsage() uint64 {
	// cgroup v2
	if data, err := os.ReadFile("/sys/fs/cgroup/memory.current"); err == nil {
		if parsed, err := strconv.ParseUint(strings.TrimSpace(string(data)), 10, 64); err == nil {
			return parsed
		}
	}
	// cgroup v1
	if data, err := os.ReadFile("/sys/fs/cgroup/memory/memory.usage_in_bytes"); err == nil {
		if parsed, err := strconv.ParseUint(strings.TrimSpace(string(data)), 10, 64); err == nil {
			return parsed
		}
	}
	return 0
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

	if runtime.GOOS == "darwin" {
		if load1, load5, load15, err := darwinLoadAverage(); err == nil {
			return round(load1, 2), round(load5, 2), round(load15, 2)
		}
	}

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
