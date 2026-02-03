package service

import (
	"context"
	"fmt"
	"time"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/job/executor"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// executeJob runs the actual job logic
func (s *Service) executeJob(ctx context.Context, job types.Job, opts jobRunOptions) {
	if s == nil {
		return
	}

	runCtx := runContextFrom(ctx)
	startTime := time.Now()
	var execErr error
	var logID int64 = opts.logID

	var release func(context.Context) error
	var proceed bool = true
	var err error

	if s.redis != nil && job.Concurrent == "1" {
		release, proceed, err = s.tryAcquireLock(ctx, job)
		if err != nil {
			execErr = fmt.Errorf("acquire job lock failed: %w", err)
			s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
			return
		}
		if !proceed {
			count := s.incrementLockMiss(job.ID)
			if s.logger != nil {
				s.logger.Info("job lock busy", "jobID", job.ID, "misses", count)
			}
			execErr = fmt.Errorf("job is already running")
			s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
			return
		}
		defer func() {
			if release != nil {
				if err := release(context.Background()); err != nil && s.logger != nil {
					s.logger.Error("release job lock failed", "jobID", job.ID, "error", err)
				}
			}
		}()
	}

	logID, stepLogger, startErr := s.startJobRun(ctx, job, runCtx, opts)
	if startErr != nil {
		execErr = startErr
		s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
		return
	}

	if stepLogger != nil {
		defer stepLogger.Close()
	}
	defer func() {
		s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
	}()

	exec, ok := s.registry.Resolve(job.InvokeTarget)
	if !ok {
		if s.logger != nil {
			s.logger.Warn("no executor registered", "jobID", job.ID, "target", job.InvokeTarget)
		}
		execErr = fmt.Errorf("no executor registered for %s", job.InvokeTarget)
		return
	}

	payload := types.ExecutionPayload{
		Job:        job,
		Logger:     s.logger,
		StepLogger: stepLogger,
	}
	if len(job.InvokeParams) > 0 {
		payload.Params = cloneParams(job.InvokeParams)
	}

	if err := exec(ctx, payload); err != nil {
		execErr = err
		if s.logger != nil {
			s.logger.Error("job execution failed", "jobID", job.ID, "error", err)
		}
	} else if s.logger != nil {
		s.logger.Info("job executed", "jobID", job.ID)
	}
}

// startJobRun initializes a job run and returns the log ID and step logger
func (s *Service) startJobRun(ctx context.Context, job types.Job, meta jobRunContext, opts jobRunOptions) (int64, *executor.StepLogger, error) {
	if s == nil || s.repo == nil {
		return 0, nil, ErrServiceUnavailable
	}

	if opts.logID > 0 {
		return opts.logID, s.newStepLogger(opts.logID), nil
	}

	logID, err := s.createRunningLogRecord(ctx, job, meta)
	if err != nil {
		return 0, nil, err
	}

	return logID, s.newStepLogger(logID), nil
}

// finishJobRun completes a job run and updates the log record
func (s *Service) finishJobRun(ctx context.Context, job types.Job, meta jobRunContext, logID int64, startTime time.Time, execErr error) {
	if s == nil {
		return
	}

	if ctx == nil {
		ctx = context.Background()
	}

	status := "0"
	resultLabel := "成功"
	if execErr != nil {
		status = "1"
		resultLabel = "失败"
	}

	if logID > 0 && s.streams != nil {
		s.streams.Publish(logID, &types.StepEvent{
			Type:      "complete",
			JobLogID:  logID,
			Status:    status,
			Timestamp: time.Now().Format(time.RFC3339),
			Data: map[string]interface{}{
				"durationMs": time.Since(startTime).Milliseconds(),
				"result":     resultLabel,
			},
		})
		s.streams.Close(logID)
	}

	if s.repo == nil || logID == 0 {
		return
	}

	message := resolveRunMessage(meta)
	durationText := time.Since(startTime).Round(time.Millisecond)
	detail := fmt.Sprintf("%s | %s | 用时 %s", message, resultLabel, durationText)

	updates := map[string]interface{}{
		"status":      status,
		"job_message": detail,
	}

	if execErr != nil {
		updates["exception_info"] = truncateString(execErr.Error(), maxExceptionInfoLen)
	}

	if err := s.repo.UpdateJobLog(ctx, logID, updates); err != nil && s.logger != nil {
		s.logger.Error("update job log failed", "jobID", job.ID, "jobLogID", logID, "error", err)
	}
}

// createRunningLogRecord creates a new job log record in running state
func (s *Service) createRunningLogRecord(ctx context.Context, job types.Job, meta jobRunContext) (int64, error) {
	if s == nil || s.repo == nil {
		return 0, ErrServiceUnavailable
	}
	if ctx == nil {
		ctx = context.Background()
	}

	message := resolveRunMessage(meta)
	detail := fmt.Sprintf("%s | 执行中", message)

	record := &model.SysJobLog{
		JobID:        job.ID,
		JobName:      job.JobName,
		JobGroup:     job.JobGroup,
		InvokeTarget: job.InvokeTarget,
		InvokeParams: rawJSONText(job.InvokeParams),
		Status:       "2",
		JobMessage:   &detail,
	}

	now := time.Now()
	record.CreatedAt = now

	if err := s.repo.CreateJobLog(ctx, record); err != nil {
		if s.logger != nil {
			s.logger.Error("create running job log failed", "jobID", job.ID, "error", err)
		}
		return 0, err
	}

	return int64(record.ID), nil
}

// newStepLogger creates a new step logger for a job log
func (s *Service) newStepLogger(jobLogID int64) *executor.StepLogger {
	if s == nil || jobLogID == 0 {
		return nil
	}

	return executor.NewStepLogger(jobLogID, s.repo, s.logger, func(event *types.StepEvent) {
		if s.streams != nil && event != nil {
			s.streams.Publish(jobLogID, event)
		}
	})
}

// attachRunningState adds running state information to jobs
func (s *Service) attachRunningState(ctx context.Context, jobs []types.Job) {
	if s == nil || s.repo == nil || len(jobs) == 0 {
		return
	}

	if ctx == nil {
		ctx = context.Background()
	}

	ids := make([]int64, 0, len(jobs))
	for i := range jobs {
		ids = append(ids, jobs[i].ID)
	}

	runningLogs, err := s.repo.GetLatestLogsByStatus(ctx, ids, []string{"2"})
	if err != nil {
		if s.logger != nil {
			s.logger.Warn("load running job logs failed", "error", err)
		}
		return
	}

	for i := range jobs {
		if log, ok := runningLogs[jobs[i].ID]; ok {
			jobs[i].IsRunning = true
			logID := int64(log.ID)
			jobs[i].CurrentLogID = &logID
		}
	}
}

// isJobRunning checks if a job is currently running
func (s *Service) isJobRunning(ctx context.Context, jobID int64) bool {
	if s == nil || s.repo == nil || jobID == 0 {
		return false
	}

	ids := []int64{jobID}
	if ctx == nil {
		ctx = context.Background()
	}

	logs, err := s.repo.GetLatestLogsByStatus(ctx, ids, []string{"2"})
	if err != nil {
		if s.logger != nil {
			s.logger.Warn("check running job failed", "jobID", jobID, "error", err)
		}
		return false
	}

	_, ok := logs[jobID]
	return ok
}

// SubscribeLogStream returns a channel for receiving job log events
func (s *Service) SubscribeLogStream(jobLogID int64) (<-chan *types.StepEvent, func()) {
	if s == nil || s.streams == nil || jobLogID <= 0 {
		return nil, func() {}
	}

	return s.streams.Subscribe(jobLogID)
}
