package service

import (
	"errors"
	"sort"
	"strings"
	"sync"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

type executorRegistry struct {
	mu      sync.RWMutex
	entries map[string]*executorEntry
}

type executorEntry struct {
	exec        types.Executor
	description string
}

func newExecutorRegistry() *executorRegistry {
	return &executorRegistry{
		entries: make(map[string]*executorEntry),
	}
}

func (r *executorRegistry) Register(key string, exec types.Executor) error {
	return r.RegisterWithDesc(key, "", exec)
}

func (r *executorRegistry) RegisterWithDesc(key, description string, exec types.Executor) error {
	if exec == nil {
		return errors.New("executor is nil")
	}
	key = strings.TrimSpace(strings.ToLower(key))
	if key == "" {
		return errors.New("executor key is required")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.entries[key]; exists {
		return errors.New("duplicate executor key: " + key)
	}
	r.entries[key] = &executorEntry{
		exec:        exec,
		description: strings.TrimSpace(description),
	}
	return nil
}

func (r *executorRegistry) Resolve(key string) (types.Executor, bool) {
	if r == nil {
		return nil, false
	}
	key = strings.TrimSpace(strings.ToLower(key))
	if key == "" {
		return nil, false
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	entry, ok := r.entries[key]
	if !ok {
		return nil, false
	}
	exec := entry.exec
	return exec, ok
}

func (r *executorRegistry) List() []types.AvailableExecutor {
	if r == nil {
		return nil
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]types.AvailableExecutor, 0, len(r.entries))
	for key, entry := range r.entries {
		result = append(result, types.AvailableExecutor{
			Key:         key,
			Description: entry.description,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Key < result[j].Key
	})

	return result
}
