package types

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"
)

// ListResult General list result
type ListResult struct {
	List     []Job `json:"list"`
	Total    int64 `json:"total"`
	PageNum  int   `json:"pageNum"`
	PageSize int   `json:"pageSize"`
}

// Job DTO
type Job struct {
	JobID          int64           `json:"jobId"`
	JobName        string          `json:"jobName"`
	JobGroup       string          `json:"jobGroup"`
	InvokeTarget   string          `json:"invokeTarget"`
	InvokeParams   json.RawMessage `json:"invokeParams,omitempty"`
	CronExpression string          `json:"cronExpression"`
	MisfirePolicy  string          `json:"misfirePolicy"`
	Concurrent     string          `json:"concurrent"`
	Status         string          `json:"status"`
	Remark         *string         `json:"remark,omitempty"`
	CreateBy       string          `json:"createBy,omitempty"`
	CreatedAt      *time.Time      `json:"createdAt,omitempty"`
	UpdateBy       string          `json:"updateBy,omitempty"`
	UpdatedAt      *time.Time      `json:"updatedAt,omitempty"`
	IsRunning      bool            `json:"isRunning"`
	CurrentLogID   *int64          `json:"currentLogId,omitempty"`
}

// JobLog DTO
type JobLog struct {
	JobLogID     int64           `json:"jobLogId"`
	JobID        int64           `json:"jobId"`
	JobName      string          `json:"jobName"`
	JobGroup     string          `json:"jobGroup"`
	InvokeTarget string          `json:"invokeTarget"`
	InvokeParams json.RawMessage `json:"invokeParams,omitempty"`
	JobMessage   *string         `json:"jobMessage,omitempty"`
	Status       string          `json:"status"`
	Exception    string          `json:"exception,omitempty"`
	CreatedAt    *time.Time      `json:"createdAt,omitempty"`
	Steps        []JobLogStep    `json:"steps,omitempty"`
}

// JobLogStep DTO
type JobLogStep struct {
	StepID     int64      `json:"stepId"`
	JobLogID   int64      `json:"jobLogId"`
	StepName   string     `json:"stepName"`
	StepOrder  int        `json:"stepOrder"`
	Status     string     `json:"status"`
	Message    string     `json:"message,omitempty"`
	Output     string     `json:"output,omitempty"`
	Error      string     `json:"error,omitempty"`
	StartTime  string     `json:"startTime,omitempty"`
	EndTime    string     `json:"endTime,omitempty"`
	DurationMs *int64     `json:"durationMs,omitempty"`
	CreatedAt  *time.Time `json:"createdAt,omitempty"`
}

// JobLogList DTO
type JobLogList struct {
	List     []JobLog `json:"list"`
	Total    int64    `json:"total"`
	PageNum  int      `json:"pageNum"`
	PageSize int      `json:"pageSize"`
}

// JobDetail DTO
type JobDetail struct {
	Job              Job        `json:"job"`
	InvokeParamsText string     `json:"invokeParamsText"`
	Logs             JobLogList `json:"logs"`
}

// ListJobLogsOptions
type ListJobLogsOptions struct {
	PageNum  int
	PageSize int
}

// ListJobsOptions
type ListJobsOptions struct {
	PageNum   int
	PageSize  int
	JobName   string
	JobGroup  string
	Status    string
	StartTime time.Time
	EndTime   time.Time
}

// CreateJobInput
type CreateJobInput struct {
	JobName        string          `json:"jobName"`
	JobGroup       string          `json:"jobGroup"`
	InvokeTarget   string          `json:"invokeTarget"`
	InvokeParams   json.RawMessage `json:"invokeParams"`
	CronExpression string          `json:"cronExpression"`
	MisfirePolicy  string          `json:"misfirePolicy"`
	Concurrent     string          `json:"concurrent"`
	Status         string          `json:"status"`
	Remark         *string         `json:"remark"`
	Operator       string          `json:"operator"`
}

// UpdateJobInput
type UpdateJobInput struct {
	ID             int64
	JobName        *string          `json:"jobName"`
	JobGroup       *string          `json:"jobGroup"`
	InvokeTarget   *string          `json:"invokeTarget"`
	InvokeParams   *json.RawMessage `json:"invokeParams"`
	CronExpression *string          `json:"cronExpression"`
	MisfirePolicy  *string          `json:"misfirePolicy"`
	Concurrent     *string          `json:"concurrent"`
	Status         *string          `json:"status"`
	Remark         *string          `json:"remark"`
	Operator       string           `json:"operator"`
}

// StepEvent SSE Event
type StepEvent struct {
	Type      string      `json:"type"`
	JobLogID  int64       `json:"jobLogId"`
	StepID    int64       `json:"stepId,omitempty"`
	StepOrder int         `json:"stepOrder"`
	StepName  string      `json:"stepName,omitempty"`
	Status    string      `json:"status,omitempty"`
	Message   string      `json:"message,omitempty"`
	Output    string      `json:"output,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp string      `json:"timestamp"`
	Data      interface{} `json:"data,omitempty"`
}

// Executor definition
type Executor func(ctx context.Context, payload ExecutionPayload) error

// StepLoggerInterface interface for logging steps, to avoid circular deps if StepLogger is logic
type StepLoggerInterface interface {
	StartStep(name string) StepInterface
}

type StepInterface interface {
	Log(format string, args ...interface{})
	Success() error
	Fail(err error) error
}

// ExecutionPayload
type ExecutionPayload struct {
	Job        Job                 `json:"job"`
	Params     json.RawMessage     `json:"params,omitempty"`
	Logger     *slog.Logger        `json:"-"`
	StepLogger StepLoggerInterface `json:"-"`
}
