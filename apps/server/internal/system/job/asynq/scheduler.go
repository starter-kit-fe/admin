package asynq

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"

	"github.com/hibiken/asynq"
)

// Scheduler wraps asynq.Scheduler for cron-based job scheduling
type Scheduler struct {
	scheduler *asynq.Scheduler
	logger    *slog.Logger

	mu      sync.RWMutex
	entries map[int64]string // jobID -> entryID
}

// SchedulerOptions configures the Asynq scheduler
type SchedulerOptions struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Logger        *slog.Logger
}

// NewScheduler creates a new Asynq scheduler
func NewScheduler(opts SchedulerOptions) *Scheduler {
	logger := opts.Logger
	if logger == nil {
		logger = slog.Default()
	}

	scheduler := asynq.NewScheduler(
		asynq.RedisClientOpt{
			Addr:     opts.RedisAddr,
			Password: opts.RedisPassword,
			DB:       opts.RedisDB,
		},
		&asynq.SchedulerOpts{
			Logger: &slogAdapter{logger: logger},
		},
	)

	return &Scheduler{
		scheduler: scheduler,
		logger:    logger,
		entries:   make(map[int64]string),
	}
}

// NewSchedulerFromRedisOpt creates a scheduler from asynq.RedisClientOpt
func NewSchedulerFromRedisOpt(opt asynq.RedisClientOpt, logger *slog.Logger) *Scheduler {
	if logger == nil {
		logger = slog.Default()
	}

	scheduler := asynq.NewScheduler(opt, &asynq.SchedulerOpts{
		Logger: &slogAdapter{logger: logger},
	})

	return &Scheduler{
		scheduler: scheduler,
		logger:    logger,
		entries:   make(map[int64]string),
	}
}

// ScheduleJob schedules a job with a cron expression
func (s *Scheduler) ScheduleJob(jobID int64, cronExpr string, payload JobExecutionPayload, opts ...asynq.Option) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Remove existing entry if any
	if entryID, exists := s.entries[jobID]; exists {
		if err := s.scheduler.Unregister(entryID); err != nil {
			s.logger.Warn("failed to unregister existing job", "jobID", jobID, "error", err)
		}
		delete(s.entries, jobID)
	}

	// Create the task
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}
	task := asynq.NewTask(TypeJobExecution, data, opts...)

	// Register with scheduler
	entryID, err := s.scheduler.Register(cronExpr, task, opts...)
	if err != nil {
		return fmt.Errorf("register scheduled job: %w", err)
	}

	s.entries[jobID] = entryID
	s.logger.Info("job scheduled", "jobID", jobID, "cron", cronExpr, "entryID", entryID)
	return nil
}

// UnscheduleJob removes a job from the scheduler
func (s *Scheduler) UnscheduleJob(jobID int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entryID, exists := s.entries[jobID]
	if !exists {
		return nil
	}

	if err := s.scheduler.Unregister(entryID); err != nil {
		return fmt.Errorf("unregister job: %w", err)
	}

	delete(s.entries, jobID)
	s.logger.Info("job unscheduled", "jobID", jobID)
	return nil
}

// UpdateJob updates a job's schedule
func (s *Scheduler) UpdateJob(jobID int64, cronExpr string, payload JobExecutionPayload, opts ...asynq.Option) error {
	return s.ScheduleJob(jobID, cronExpr, payload, opts...)
}

// Start starts the scheduler
func (s *Scheduler) Start() error {
	if err := s.scheduler.Start(); err != nil {
		return fmt.Errorf("start scheduler: %w", err)
	}
	s.logger.Info("asynq scheduler started")
	return nil
}

// Stop stops the scheduler
func (s *Scheduler) Stop() error {
	s.scheduler.Shutdown()
	s.logger.Info("asynq scheduler stopped")
	return nil
}

// Run starts the scheduler and blocks until context is cancelled
func (s *Scheduler) Run(ctx context.Context) error {
	if err := s.scheduler.Start(); err != nil {
		return err
	}

	<-ctx.Done()
	s.scheduler.Shutdown()
	return ctx.Err()
}

// IsScheduled returns whether a job is currently scheduled
func (s *Scheduler) IsScheduled(jobID int64) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, exists := s.entries[jobID]
	return exists
}

// GetEntryID returns the entry ID for a scheduled job
func (s *Scheduler) GetEntryID(jobID int64) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entryID, exists := s.entries[jobID]
	return entryID, exists
}

// Clear removes all scheduled jobs
func (s *Scheduler) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for jobID, entryID := range s.entries {
		if err := s.scheduler.Unregister(entryID); err != nil {
			s.logger.Warn("failed to unregister job during clear", "jobID", jobID, "error", err)
		}
	}
	s.entries = make(map[int64]string)
}
