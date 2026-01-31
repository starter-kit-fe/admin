package service

import (
	"errors"
	"strings"
	"sync"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

type executorRegistry struct {
	mu      sync.RWMutex
	entries map[string]types.Executor
}

func newExecutorRegistry() *executorRegistry {
	return &executorRegistry{
		entries: make(map[string]types.Executor),
	}
}

func (r *executorRegistry) Register(key string, exec types.Executor) error {
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
	r.entries[key] = exec
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
	exec, ok := r.entries[key]
	return exec, ok
}
