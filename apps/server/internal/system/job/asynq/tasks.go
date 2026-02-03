package asynq

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// Task type constants - register new job types here
const (
	TypeJobExecution = "job:execute" // Generic job execution
	TypeDBBackup     = "db:backup"   // Database backup
)

// JobExecutionPayload is the payload for executing a scheduled job
type JobExecutionPayload struct {
	JobID        int64           `json:"jobId"`
	JobName      string          `json:"jobName"`
	JobGroup     string          `json:"jobGroup"`
	InvokeTarget string          `json:"invokeTarget"`
	InvokeParams json.RawMessage `json:"invokeParams,omitempty"`
	Source       string          `json:"source"` // "manual" or "cron"
	Message      string          `json:"message"`
	LogID        int64           `json:"logId,omitempty"` // Pre-created log ID
}

// NewJobExecutionTask creates a new job execution task
func NewJobExecutionTask(payload JobExecutionPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal job execution payload: %w", err)
	}
	return asynq.NewTask(TypeJobExecution, data), nil
}

// ParseJobExecutionPayload parses the payload from an asynq.Task
func ParseJobExecutionPayload(task *asynq.Task) (*JobExecutionPayload, error) {
	var payload JobExecutionPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return nil, fmt.Errorf("unmarshal job execution payload: %w", err)
	}
	return &payload, nil
}

// ExecutorAdapter adapts the existing Executor type to asynq.Handler
type ExecutorAdapter struct {
	executor      types.Executor
	getLogger     func() interface{}
	getStepLogger func(logID int64) types.StepLoggerInterface
}

// NewExecutorAdapter creates a new adapter for existing executors
func NewExecutorAdapter(exec types.Executor) *ExecutorAdapter {
	return &ExecutorAdapter{executor: exec}
}

// WithLogger sets the logger provider
func (a *ExecutorAdapter) WithLogger(fn func() interface{}) *ExecutorAdapter {
	a.getLogger = fn
	return a
}

// WithStepLogger sets the step logger provider
func (a *ExecutorAdapter) WithStepLogger(fn func(logID int64) types.StepLoggerInterface) *ExecutorAdapter {
	a.getStepLogger = fn
	return a
}

// ProcessTask implements asynq.Handler
func (a *ExecutorAdapter) ProcessTask(ctx context.Context, task *asynq.Task) error {
	payload, err := ParseJobExecutionPayload(task)
	if err != nil {
		return fmt.Errorf("parse payload: %w", err)
	}

	execPayload := types.ExecutionPayload{
		Job: types.Job{
			JobID:        payload.JobID,
			JobName:      payload.JobName,
			JobGroup:     payload.JobGroup,
			InvokeTarget: payload.InvokeTarget,
			InvokeParams: payload.InvokeParams,
		},
		Params: payload.InvokeParams,
	}

	// Inject logger if available
	if a.getLogger != nil {
		if logger, ok := a.getLogger().(interface{ slogLogger() interface{} }); ok {
			_ = logger // unused for now, but available for future use
		}
	}

	// Inject step logger if available
	if a.getStepLogger != nil && payload.LogID > 0 {
		execPayload.StepLogger = a.getStepLogger(payload.LogID)
	}

	return a.executor(ctx, execPayload)
}

// HandlerRegistry manages task handlers
type HandlerRegistry struct {
	handlers map[string]asynq.Handler
}

// NewHandlerRegistry creates a new handler registry
func NewHandlerRegistry() *HandlerRegistry {
	return &HandlerRegistry{
		handlers: make(map[string]asynq.Handler),
	}
}

// Register registers a handler for a task type
func (r *HandlerRegistry) Register(taskType string, handler asynq.Handler) {
	r.handlers[taskType] = handler
}

// RegisterExecutor registers an executor as a handler
func (r *HandlerRegistry) RegisterExecutor(invokeTarget string, exec types.Executor) {
	adapter := NewExecutorAdapter(exec)
	r.handlers[invokeTarget] = adapter
}

// Get returns a handler for a task type
func (r *HandlerRegistry) Get(taskType string) (asynq.Handler, bool) {
	h, ok := r.handlers[taskType]
	return h, ok
}

// RegisterAll registers all handlers to an asynq.ServeMux
func (r *HandlerRegistry) RegisterAll(mux *asynq.ServeMux) {
	for taskType, handler := range r.handlers {
		mux.Handle(taskType, handler)
	}
}

// ApplyToServer registers all handlers to a Server
func (r *HandlerRegistry) ApplyToServer(s *Server) {
	for taskType, handler := range r.handlers {
		s.Handle(taskType, handler)
	}
}
