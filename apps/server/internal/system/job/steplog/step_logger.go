package steplog

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/job/repository"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// StepLogger 步骤日志记录器
type StepLogger struct {
	jobLogID  int64
	repo      *repository.Repository
	logger    *slog.Logger
	stepOrder int
	mu        sync.Mutex
	eventChan chan *types.StepEvent
	onEvent   func(*types.StepEvent)
	closed    uint32
}

// New 创建步骤日志记录器
func New(jobLogID int64, repo *repository.Repository, logger *slog.Logger, onEvent func(*types.StepEvent)) *StepLogger {
	return &StepLogger{
		jobLogID:  jobLogID,
		repo:      repo,
		logger:    logger,
		eventChan: make(chan *types.StepEvent, 100),
		onEvent:   onEvent,
	}
}

// EventChannel 获取事件通道（用于 SSE）
func (s *StepLogger) EventChannel() <-chan *types.StepEvent {
	return s.eventChan
}

// StartStep 开始一个步骤
func (s *StepLogger) StartStep(name string) types.StepInterface {
	s.mu.Lock()
	s.stepOrder++
	order := s.stepOrder
	s.mu.Unlock()

	startTime := time.Now()
	step := &step{
		logger:    s,
		jobLogID:  s.jobLogID,
		stepName:  name,
		stepOrder: order,
		startTime: startTime,
		outputs:   make([]string, 0),
	}

	record := &model.SysJobLogStep{
		JobLogID:  s.jobLogID,
		StepName:  name,
		StepOrder: order,
		Status:    "2", // 进行中
		StartTime: &startTime,
	}

	if s.repo != nil {
		if err := s.repo.CreateJobLogStep(context.Background(), record); err != nil {
			if s.logger != nil {
				s.logger.Warn("create job log step failed", "jobLogID", s.jobLogID, "step", name, "error", err)
			}
			return step
		}
	}

	step.stepID = int64(record.ID)

	s.sendEvent(&types.StepEvent{
		Type:      "step_start",
		JobLogID:  s.jobLogID,
		StepID:    int64(record.ID),
		StepOrder: order,
		StepName:  name,
		Status:    "2",
		Timestamp: startTime.Format(time.RFC3339),
	})

	return step
}

// Close 关闭事件通道
func (s *StepLogger) Close() {
	if s == nil {
		return
	}
	if atomic.CompareAndSwapUint32(&s.closed, 0, 1) {
		close(s.eventChan)
	}
}

func (s *StepLogger) sendEvent(event *types.StepEvent) {
	if s == nil || event == nil || atomic.LoadUint32(&s.closed) == 1 {
		return
	}
	select {
	case s.eventChan <- event:
	default:
		// Channel is full; drop silently to avoid blocking
	}

	if s.onEvent != nil {
		s.onEvent(event)
	}
}

// step 单个执行步骤
type step struct {
	logger    *StepLogger
	jobLogID  int64
	stepID    int64
	stepName  string
	stepOrder int
	startTime time.Time
	outputs   []string
	mu        sync.Mutex
}

// Log 记录日志
func (s *step) Log(format string, args ...interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()

	timestamp := time.Now().Format("15:04:05")
	message := fmt.Sprintf(format, args...)
	output := fmt.Sprintf("[%s] %s", timestamp, message)
	s.outputs = append(s.outputs, output)

	s.logger.sendEvent(&types.StepEvent{
		Type:      "step_log",
		JobLogID:  s.jobLogID,
		StepID:    s.stepID,
		StepOrder: s.stepOrder,
		Output:    output,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// Success 标记步骤成功
func (s *step) Success() error {
	return s.finish("0", "")
}

// Fail 标记步骤失败
func (s *step) Fail(err error) error {
	errorMsg := ""
	if err != nil {
		errorMsg = err.Error()
	}
	return s.finish("1", errorMsg)
}

func (s *step) finish(status string, errorMsg string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	endTime := time.Now()
	duration := endTime.Sub(s.startTime).Milliseconds()

	if s.logger != nil && s.logger.repo != nil && s.stepID > 0 {
		updates := map[string]interface{}{
			"status":      status,
			"output":      strings.Join(s.outputs, "\n"),
			"error":       errorMsg,
			"end_time":    endTime,
			"duration_ms": duration,
		}

		if err := s.logger.repo.UpdateJobLogStep(context.Background(), s.stepID, updates); err != nil {
			return err
		}
	}

	s.logger.sendEvent(&types.StepEvent{
		Type:      "step_end",
		JobLogID:  s.jobLogID,
		StepID:    s.stepID,
		StepOrder: s.stepOrder,
		Status:    status,
		Error:     errorMsg,
		Timestamp: endTime.Format(time.RFC3339),
		Data: map[string]interface{}{
			"durationMs": duration,
		},
	})

	return nil
}
