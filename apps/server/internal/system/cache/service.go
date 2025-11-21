package cache

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"math"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	ErrServiceUnavailable = errors.New("cache service unavailable")
)

const (
	defaultMaxScanKeys = 5000
	defaultPageSize    = 20
	maxPageSize        = 200
	minPageSize        = 1
)

type Service struct {
	client       *redis.Client
	maxScanKeys  int
	cacheMu      sync.Mutex
	lastOverview *Overview
}

type Option func(*Service)

func WithMaxScanKeys(limit int) Option {
	return func(s *Service) {
		if limit > 0 {
			s.maxScanKeys = limit
		}
	}
}

func NewService(client *redis.Client, opts ...Option) *Service {
	if client == nil {
		return nil
	}
	svc := &Service{
		client:      client,
		maxScanKeys: defaultMaxScanKeys,
	}
	for _, opt := range opts {
		if opt != nil {
			opt(svc)
		}
	}
	return svc
}

type Overview struct {
	ServerInfo  ServerInfo      `json:"server"`
	Clients     ClientsInfo     `json:"clients"`
	Memory      MemoryInfo      `json:"memory"`
	Stats       StatsInfo       `json:"stats"`
	Persistence PersistenceInfo `json:"persistence"`
	Keyspace    []KeyspaceInfo  `json:"keyspace"`
}

type ServerInfo struct {
	Version         string `json:"version"`
	Mode            string `json:"mode"`
	Role            string `json:"role"`
	OS              string `json:"os"`
	ProcessID       int64  `json:"processId"`
	UptimeSeconds   int64  `json:"uptimeSeconds"`
	Uptime          string `json:"uptime"`
	ConnectedSlaves int64  `json:"connectedSlaves"`
}

type ClientsInfo struct {
	Connected int64 `json:"connected"`
	Blocked   int64 `json:"blocked"`
}

type MemoryInfo struct {
	UsedMemory          uint64  `json:"usedMemory"`
	UsedMemoryHuman     string  `json:"usedMemoryHuman"`
	UsedMemoryPeak      uint64  `json:"usedMemoryPeak"`
	UsedMemoryPeakHuman string  `json:"usedMemoryPeakHuman"`
	MaxMemory           uint64  `json:"maxMemory"`
	MaxMemoryHuman      string  `json:"maxMemoryHuman"`
	FragmentationRatio  float64 `json:"fragmentationRatio"`
}

type StatsInfo struct {
	TotalConnections       int64   `json:"totalConnections"`
	TotalCommandsProcessed int64   `json:"totalCommandsProcessed"`
	InstantaneousOps       int64   `json:"instantaneousOps"`
	KeyspaceHits           int64   `json:"keyspaceHits"`
	KeyspaceMisses         int64   `json:"keyspaceMisses"`
	HitRate                float64 `json:"hitRate"`
	RejectedConnections    int64   `json:"rejectedConnections"`
	ExpiredKeys            int64   `json:"expiredKeys"`
	EvictedKeys            int64   `json:"evictedKeys"`
}

type PersistenceInfo struct {
	RDBLastSaveTime         string `json:"rdbLastSaveTime"`
	RDBLastStatus           string `json:"rdbLastStatus"`
	RDBChangesSinceLastSave int64  `json:"rdbChangesSinceLastSave"`
	AOFEnabled              bool   `json:"aofEnabled"`
}

type KeyspaceInfo struct {
	DB      string `json:"db"`
	Keys    int64  `json:"keys"`
	Expires int64  `json:"expires"`
	AvgTTL  int64  `json:"avgTtl"`
}

type ListOptions struct {
	PageNum  int
	PageSize int
	Pattern  string
	DB       int
}

type KeyItem struct {
	Key         string `json:"key"`
	Type        string `json:"type"`
	TTLSeconds  int64  `json:"ttlSeconds"`
	TTL         string `json:"ttl"`
	SizeBytes   int64  `json:"sizeBytes"`
	Encoding    string `json:"encoding"`
	IdleSeconds int64  `json:"idleSeconds"`
}

type ListResult struct {
	Items     []KeyItem `json:"items"`
	TotalKeys int64     `json:"total"`
	PageNum   int       `json:"pageNum"`
	PageSize  int       `json:"pageSize"`
	Pattern   string    `json:"pattern"`
	HasMore   bool      `json:"hasMore"`
	Scanned   int       `json:"scanned"`
	Limited   bool      `json:"limited"`
}

func (s *Service) Overview(ctx context.Context) (*Overview, error) {
	if s == nil || s.client == nil {
		return nil, ErrServiceUnavailable
	}

	infoStr, err := s.client.Info(ctx).Result()
	if err != nil {
		return nil, err
	}

	sections := parseInfo(infoStr)
	serverInfo := extractServerInfo(sections["server"], sections["replication"])
	clientsInfo := extractClientsInfo(sections["clients"])
	memoryInfo := extractMemoryInfo(sections["memory"])
	statsInfo := extractStatsInfo(sections["stats"])
	persistInfo := extractPersistenceInfo(sections["persistence"])
	keyspaceInfo := extractKeyspaceInfo(sections["keyspace"])

	return &Overview{
		ServerInfo:  serverInfo,
		Clients:     clientsInfo,
		Memory:      memoryInfo,
		Stats:       statsInfo,
		Persistence: persistInfo,
		Keyspace:    keyspaceInfo,
	}, nil
}

// SnapAndDiff returns the latest overview and a patch that only includes updated sections.
func (s *Service) SnapAndDiff(ctx context.Context) (*Overview, *OverviewPatch, error) {
	current, err := s.Overview(ctx)
	if err != nil {
		return nil, nil, err
	}

	s.cacheMu.Lock()
	prev := s.lastOverview
	s.lastOverview = current
	s.cacheMu.Unlock()

	if prev == nil {
		return current, nil, nil
	}

	patch := diffOverview(prev, current)
	return current, patch, nil
}

type OverviewPatch struct {
	ServerInfo  *ServerInfo      `json:"server,omitempty"`
	Clients     *ClientsInfo     `json:"clients,omitempty"`
	Memory      *MemoryInfo      `json:"memory,omitempty"`
	Stats       *StatsInfo       `json:"stats,omitempty"`
	Persistence *PersistenceInfo `json:"persistence,omitempty"`
	Keyspace    []KeyspaceInfo   `json:"keyspace,omitempty"`
}

func diffOverview(prev, next *Overview) *OverviewPatch {
	if prev == nil || next == nil {
		return nil
	}

	patch := &OverviewPatch{}

	if !reflect.DeepEqual(prev.ServerInfo, next.ServerInfo) {
		value := next.ServerInfo
		patch.ServerInfo = &value
	}
	if !reflect.DeepEqual(prev.Clients, next.Clients) {
		value := next.Clients
		patch.Clients = &value
	}
	if !reflect.DeepEqual(prev.Memory, next.Memory) {
		value := next.Memory
		patch.Memory = &value
	}
	if !reflect.DeepEqual(prev.Stats, next.Stats) {
		value := next.Stats
		patch.Stats = &value
	}
	if !reflect.DeepEqual(prev.Persistence, next.Persistence) {
		value := next.Persistence
		patch.Persistence = &value
	}
	if !reflect.DeepEqual(prev.Keyspace, next.Keyspace) {
		patch.Keyspace = next.Keyspace
	}

	if patch.ServerInfo == nil && patch.Clients == nil && patch.Memory == nil &&
		patch.Stats == nil && patch.Persistence == nil && patch.Keyspace == nil {
		return nil
	}

	return patch
}

func (s *Service) ListKeys(ctx context.Context, opts ListOptions) (*ListResult, error) {
	if s == nil || s.client == nil {
		return nil, ErrServiceUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize < minPageSize {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	pattern := strings.TrimSpace(opts.Pattern)
	if pattern == "" {
		pattern = "*"
	}

	totalKeys := s.fetchTotalKeys(ctx, opts.DB)

	maxCollect := s.maxScanKeys
	if maxCollect <= 0 {
		maxCollect = defaultMaxScanKeys
	}

	var (
		cursor  uint64
		matches []string
		limit   = maxCollect
	)

	for {
		keys, next, err := s.client.Scan(ctx, cursor, pattern, 500).Result()
		if err != nil {
			return nil, err
		}
		matches = append(matches, keys...)
		if len(matches) >= limit {
			matches = matches[:limit]
			cursor = next
			break
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}

	hasMore := cursor != 0

	start := (pageNum - 1) * pageSize
	if start >= len(matches) {
		return &ListResult{
			Items:     []KeyItem{},
			TotalKeys: minInt64(totalKeys, int64(len(matches))),
			PageNum:   pageNum,
			PageSize:  pageSize,
			Pattern:   pattern,
			HasMore:   hasMore,
			Scanned:   len(matches),
			Limited:   hasMore,
		}, nil
	}

	end := start + pageSize
	if end > len(matches) {
		end = len(matches)
	}

	keys := matches[start:end]
	items := s.collectKeyDetails(ctx, keys)

	total := int64(len(matches))
	if totalKeys > 0 && pattern == "*" && totalKeys < total {
		total = totalKeys
	}
	if total == 0 && totalKeys > 0 && pattern == "*" {
		total = totalKeys
	}

	return &ListResult{
		Items:     items,
		TotalKeys: total,
		PageNum:   pageNum,
		PageSize:  pageSize,
		Pattern:   pattern,
		HasMore:   hasMore,
		Scanned:   len(matches),
		Limited:   hasMore || (pattern == "*" && totalKeys > total),
	}, nil
}

func (s *Service) fetchTotalKeys(ctx context.Context, db int) int64 {
	info, err := s.client.Info(ctx, "keyspace").Result()
	if err != nil {
		return 0
	}
	sections := parseInfo(info)
	stats := extractKeyspaceInfo(sections["keyspace"])
	target := fmt.Sprintf("db%d", db)
	for _, ks := range stats {
		if ks.DB == target {
			return ks.Keys
		}
	}
	if target == "db0" {
		var sum int64
		for _, ks := range stats {
			sum += ks.Keys
		}
		return sum
	}
	return 0
}

func (s *Service) collectKeyDetails(ctx context.Context, keys []string) []KeyItem {
	if len(keys) == 0 {
		return []KeyItem{}
	}

	items := make([]KeyItem, 0, len(keys))

	for _, key := range keys {
		key := key
		item := KeyItem{
			Key: key,
		}

		// Pipeline per key to reduce latency while handling failures gracefully.
		pipe := s.client.Pipeline()
		typeCmd := pipe.Type(ctx, key)
		ttlCmd := pipe.TTL(ctx, key)
		memCmd := pipe.MemoryUsage(ctx, key)
		idleCmd := pipe.Do(ctx, "OBJECT", "IDLETIME", key)
		encodeCmd := pipe.Do(ctx, "OBJECT", "ENCODING", key)

		_, err := pipe.Exec(ctx)
		if err != nil && !errors.Is(err, redis.Nil) {
			// Continue even if some commands fail; partial data is acceptable.
		}

		if redisType, err := typeCmd.Result(); err == nil {
			item.Type = redisType
		}

		if ttl, err := ttlCmd.Result(); err == nil {
			item.TTLSeconds = int64(ttl / time.Second)
			item.TTL = formatTTL(ttl)
		} else {
			item.TTLSeconds = -1
			item.TTL = "永久"
		}

		if bytes, err := memCmd.Result(); err == nil {
			item.SizeBytes = bytes
		}

		if idle, err := idleCmd.Int64(); err == nil {
			item.IdleSeconds = idle
		}

		if enc, err := encodeCmd.Text(); err == nil {
			item.Encoding = enc
		}

		items = append(items, item)
	}

	return items
}

func parseInfo(raw string) map[string]map[string]string {
	sections := make(map[string]map[string]string)
	var current string

	scanner := bufio.NewScanner(strings.NewReader(raw))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "#") {
			current = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "#")))
			continue
		}
		if current == "" {
			current = "default"
		}
		if _, ok := sections[current]; !ok {
			sections[current] = make(map[string]string)
		}

		if current == "keyspace" && strings.HasPrefix(line, "db") {
			sections[current][strings.TrimSpace(line[:strings.Index(line, ":")])] = strings.TrimSpace(line[strings.Index(line, ":")+1:])
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		sections[current][key] = value
	}

	return sections
}

func extractServerInfo(values map[string]string, replication map[string]string) ServerInfo {
	if values == nil {
		values = map[string]string{}
	}
	if replication == nil {
		replication = map[string]string{}
	}
	info := ServerInfo{
		Version:         values["redis_version"],
		Mode:            values["redis_mode"],
		Role:            values["role"],
		OS:              values["os"],
		ConnectedSlaves: parseInt64(replication["connected_slaves"]),
	}

	if pid := parseInt64(values["process_id"]); pid > 0 {
		info.ProcessID = pid
	}

	uptime := parseInt64(values["uptime_in_seconds"])
	info.UptimeSeconds = uptime
	if uptime > 0 {
		info.Uptime = formatDuration(time.Duration(uptime) * time.Second)
	}

	return info
}

func extractClientsInfo(values map[string]string) ClientsInfo {
	if values == nil {
		values = map[string]string{}
	}
	return ClientsInfo{
		Connected: parseInt64(values["connected_clients"]),
		Blocked:   parseInt64(values["blocked_clients"]),
	}
}

func extractMemoryInfo(values map[string]string) MemoryInfo {
	if values == nil {
		values = map[string]string{}
	}
	return MemoryInfo{
		UsedMemory:          parseUint64(values["used_memory"]),
		UsedMemoryHuman:     values["used_memory_human"],
		UsedMemoryPeak:      parseUint64(values["used_memory_peak"]),
		UsedMemoryPeakHuman: values["used_memory_peak_human"],
		MaxMemory:           parseUint64(values["maxmemory"]),
		MaxMemoryHuman:      values["maxmemory_human"],
		FragmentationRatio:  parseFloat(values["mem_fragmentation_ratio"]),
	}
}

func extractStatsInfo(values map[string]string) StatsInfo {
	if values == nil {
		values = map[string]string{}
	}
	hits := parseInt64(values["keyspace_hits"])
	misses := parseInt64(values["keyspace_misses"])
	return StatsInfo{
		TotalConnections:       parseInt64(values["total_connections_received"]),
		TotalCommandsProcessed: parseInt64(values["total_commands_processed"]),
		InstantaneousOps:       parseInt64(values["instantaneous_ops_per_sec"]),
		KeyspaceHits:           hits,
		KeyspaceMisses:         misses,
		HitRate:                calculateHitRate(hits, misses),
		RejectedConnections:    parseInt64(values["rejected_connections"]),
		ExpiredKeys:            parseInt64(values["expired_keys"]),
		EvictedKeys:            parseInt64(values["evicted_keys"]),
	}
}

func extractPersistenceInfo(values map[string]string) PersistenceInfo {
	if values == nil {
		values = map[string]string{}
	}
	aofEnabled := values["aof_enabled"] == "1"
	lastSave := values["rdb_last_save_time"]
	if ts := parseInt64(lastSave); ts > 0 {
		lastSave = time.Unix(ts, 0).Format("2006-01-02 15:04:05")
	}
	return PersistenceInfo{
		RDBLastSaveTime:         lastSave,
		RDBLastStatus:           values["rdb_last_bgsave_status"],
		RDBChangesSinceLastSave: parseInt64(values["rdb_changes_since_last_save"]),
		AOFEnabled:              aofEnabled,
	}
}

func extractKeyspaceInfo(values map[string]string) []KeyspaceInfo {
	if values == nil {
		return nil
	}
	keyspaces := make([]KeyspaceInfo, 0, len(values))
	for db, payload := range values {
		parts := strings.Split(payload, ",")
		info := KeyspaceInfo{DB: db}
		for _, part := range parts {
			kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
			if len(kv) != 2 {
				continue
			}
			key := kv[0]
			value := kv[1]
			switch key {
			case "keys":
				info.Keys = parseInt64(value)
			case "expires":
				info.Expires = parseInt64(value)
			case "avg_ttl":
				info.AvgTTL = parseInt64(value)
			}
		}
		keyspaces = append(keyspaces, info)
	}
	return keyspaces
}

func parseInt64(value string) int64 {
	if value == "" {
		return 0
	}
	v, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0
	}
	return v
}

func parseUint64(value string) uint64 {
	if value == "" {
		return 0
	}
	v, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0
	}
	return v
}

func parseFloat(value string) float64 {
	if value == "" {
		return 0
	}
	v, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return v
}

func calculateHitRate(hits, misses int64) float64 {
	total := hits + misses
	if total <= 0 {
		return 0
	}
	rate := float64(hits) / float64(total) * 100
	return math.Round(rate*10) / 10
}

func formatDuration(d time.Duration) string {
	if d <= 0 {
		return "0s"
	}
	hours := d / time.Hour
	minutes := (d % time.Hour) / time.Minute
	days := hours / 24
	hours = hours % 24
	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	seconds := (d % time.Minute) / time.Second
	return fmt.Sprintf("%dm %ds", minutes, seconds)
}

func formatTTL(ttl time.Duration) string {
	switch {
	case ttl < 0:
		return "永久"
	case ttl < time.Second:
		return "<1s"
	case ttl < time.Minute:
		return fmt.Sprintf("%ds", int(ttl.Seconds()))
	case ttl < time.Hour:
		return fmt.Sprintf("%dm%ds", int(ttl.Minutes()), int(ttl.Seconds())%60)
	case ttl < 24*time.Hour:
		return fmt.Sprintf("%dh%dm", int(ttl.Hours()), int(ttl.Minutes())%60)
	default:
		days := int(ttl.Hours()) / 24
		hours := int(ttl.Hours()) % 24
		return fmt.Sprintf("%dd%dh", days, hours)
	}
}

func minInt64(a, b int64) int64 {
	if a == 0 {
		return b
	}
	if b == 0 {
		return a
	}
	if a < b {
		return a
	}
	return b
}
