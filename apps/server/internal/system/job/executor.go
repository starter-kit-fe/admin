package job

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"sync"
)

// Executor defines the signature for concrete job implementations.
type Executor func(ctx context.Context, payload ExecutionPayload) error

// ExecutionPayload carries metadata and raw parameters for a job invocation.
type ExecutionPayload struct {
	Job        Job             `json:"job"`
	Params     json.RawMessage `json:"params,omitempty"`
	Logger     *slog.Logger    `json:"-"`
	StepLogger *StepLogger     `json:"-"`
}

type executorRegistry struct {
	mu      sync.RWMutex
	entries map[string]Executor
}

func newExecutorRegistry() *executorRegistry {
	return &executorRegistry{
		entries: make(map[string]Executor),
	}
}

func (r *executorRegistry) Register(key string, exec Executor) error {
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

func (r *executorRegistry) Resolve(key string) (Executor, bool) {
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
