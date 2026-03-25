package service

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

// Task type constants
const (
	TypeJobExecution = "job:execute"
	TypeDBBackup     = "db:backup"
)

// JobExecutionPayload is the payload for executing a scheduled job
type JobExecutionPayload struct {
	ID           int64           `json:"id"`
	JobName      string          `json:"jobName"`
	JobGroup     string          `json:"jobGroup"`
	InvokeTarget string          `json:"invokeTarget"`
	InvokeParams json.RawMessage `json:"invokeParams,omitempty"`
	Source       string          `json:"source"` // "manual" or "cron"
	Message      string          `json:"message"`
	LogID        int64           `json:"logId,omitempty"`
}

// ParseJobExecutionPayload parses the payload from an asynq.Task
func ParseJobExecutionPayload(task *asynq.Task) (*JobExecutionPayload, error) {
	var payload JobExecutionPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return nil, fmt.Errorf("unmarshal job execution payload: %w", err)
	}
	return &payload, nil
}
