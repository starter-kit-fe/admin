package service

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// jobFromModel converts a model.SysJob to types.Job
func jobFromModel(record *model.SysJob) types.Job {
	if record == nil {
		return types.Job{}
	}

	var remark *string
	if strings.TrimSpace(record.Remark) != "" {
		r := strings.TrimSpace(record.Remark)
		remark = &r
	}

	var params json.RawMessage
	if trimmed := strings.TrimSpace(record.InvokeParams); trimmed != "" {
		raw := []byte(trimmed)
		if json.Valid(raw) {
			buf := make([]byte, len(raw))
			copy(buf, raw)
			params = json.RawMessage(buf)
		}
	}

	return types.Job{
		JobID:          int64(record.ID),
		JobName:        record.JobName,
		JobGroup:       record.JobGroup,
		InvokeTarget:   record.InvokeTarget,
		InvokeParams:   params,
		CronExpression: record.CronExpression,
		MisfirePolicy:  record.MisfirePolicy,
		Concurrent:     record.Concurrent,
		Status:         record.Status,
		Remark:         remark,
		CreateBy:       record.CreateBy,
		CreatedAt:      &record.CreatedAt,
		UpdateBy:       record.UpdateBy,
		UpdatedAt:      &record.UpdatedAt,
	}
}

// jobLogFromModel converts a model.SysJobLog to types.JobLog
func jobLogFromModel(record *model.SysJobLog) types.JobLog {
	if record == nil {
		return types.JobLog{}
	}

	var params json.RawMessage
	if trimmed := strings.TrimSpace(record.InvokeParams); trimmed != "" {
		raw := []byte(trimmed)
		if json.Valid(raw) {
			buf := make([]byte, len(raw))
			copy(buf, raw)
			params = json.RawMessage(buf)
		}
	}

	message := record.JobMessage
	exception := strings.TrimSpace(record.ExceptionInfo)

	return types.JobLog{
		JobLogID:     int64(record.ID),
		JobID:        record.JobID,
		JobName:      record.JobName,
		JobGroup:     record.JobGroup,
		InvokeTarget: record.InvokeTarget,
		InvokeParams: params,
		JobMessage:   message,
		Status:       record.Status,
		Exception:    exception,
		CreatedAt:    &record.CreatedAt,
	}
}

// jobLogStepFromModel converts a model.SysJobLogStep to types.JobLogStep
func jobLogStepFromModel(record *model.SysJobLogStep) types.JobLogStep {
	if record == nil {
		return types.JobLogStep{}
	}

	return types.JobLogStep{
		StepID:     int64(record.ID),
		JobLogID:   record.JobLogID,
		StepName:   record.StepName,
		StepOrder:  record.StepOrder,
		Status:     record.Status,
		Message:    record.Message,
		Output:     record.Output,
		Error:      record.Error,
		StartTime:  formatTime(record.StartTime),
		EndTime:    formatTime(record.EndTime),
		DurationMs: record.DurationMs,
		CreatedAt:  &record.CreatedAt,
	}
}

// formatTime formats a time pointer to string
func formatTime(value *time.Time) string {
	if value == nil || value.IsZero() {
		return ""
	}
	return value.Format("2006-01-02 15:04:05")
}

// sanitizeRemark cleans a remark string
func sanitizeRemark(remark *string) string {
	if remark == nil {
		return ""
	}
	return strings.TrimSpace(*remark)
}

// sanitizeOperator cleans an operator string
func sanitizeOperator(operator string) string {
	operator = strings.TrimSpace(operator)
	if operator == "" {
		return defaultOperator
	}
	if len(operator) > 64 {
		return operator[:64]
	}
	return operator
}

// normalizeJobGroup normalizes a job group string
func normalizeJobGroup(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		value = defaultJobGroup
	}
	if len(value) > 64 {
		value = value[:64]
	}
	return strings.ToUpper(value)
}

// sanitizeInvokeParams validates and sanitizes invoke params JSON
func sanitizeInvokeParams(raw json.RawMessage) (string, error) {
	trimmed := strings.TrimSpace(string(raw))
	if trimmed == "" {
		return "", nil
	}
	if !json.Valid([]byte(trimmed)) {
		return "", errInvalidJSON
	}
	return trimmed, nil
}

// cloneParams creates a deep copy of JSON params
func cloneParams(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return nil
	}
	buf := make([]byte, len(raw))
	copy(buf, raw)
	return json.RawMessage(buf)
}

// rawJSONText converts JSON to string
func rawJSONText(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	return strings.TrimSpace(string(raw))
}

// truncateString truncates a string to max length
func truncateString(value string, max int) string {
	if max <= 0 {
		return ""
	}
	if len(value) <= max {
		return value
	}
	return value[:max]
}
