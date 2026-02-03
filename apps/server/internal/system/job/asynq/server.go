package asynq

import (
	"context"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"
)

// Queue priority constants
const (
	QueueCritical = "critical"
	QueueDefault  = "default"
	QueueLow      = "low"
)

// Server wraps asynq.Server with lifecycle management
type Server struct {
	server    *asynq.Server
	mux       *asynq.ServeMux
	logger    *slog.Logger
	isRunning bool
}

// ServerOptions configures the Asynq server
type ServerOptions struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int
	Logger        *slog.Logger
}

// NewServer creates a new Asynq server
func NewServer(opts ServerOptions) *Server {
	concurrency := opts.Concurrency
	if concurrency <= 0 {
		concurrency = 10
	}

	logger := opts.Logger
	if logger == nil {
		logger = slog.Default()
	}

	server := asynq.NewServer(
		asynq.RedisClientOpt{
			Addr:     opts.RedisAddr,
			Password: opts.RedisPassword,
			DB:       opts.RedisDB,
		},
		asynq.Config{
			Concurrency: concurrency,
			Queues: map[string]int{
				QueueCritical: 6,
				QueueDefault:  3,
				QueueLow:      1,
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				logger.Error("task processing failed",
					"type", task.Type(),
					"error", err,
				)
			}),
			Logger: &slogAdapter{logger: logger},
		},
	)

	return &Server{
		server: server,
		mux:    asynq.NewServeMux(),
		logger: logger,
	}
}

// NewServerFromRedisOpt creates a server from asynq.RedisClientOpt
func NewServerFromRedisOpt(opt asynq.RedisClientOpt, concurrency int, logger *slog.Logger) *Server {
	if concurrency <= 0 {
		concurrency = 10
	}
	if logger == nil {
		logger = slog.Default()
	}

	server := asynq.NewServer(opt, asynq.Config{
		Concurrency: concurrency,
		Queues: map[string]int{
			QueueCritical: 6,
			QueueDefault:  3,
			QueueLow:      1,
		},
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
			logger.Error("task processing failed",
				"type", task.Type(),
				"error", err,
			)
		}),
		Logger: &slogAdapter{logger: logger},
	})

	return &Server{
		server: server,
		mux:    asynq.NewServeMux(),
		logger: logger,
	}
}

// Handle registers a handler for a task type
func (s *Server) Handle(pattern string, handler asynq.Handler) {
	s.mux.Handle(pattern, handler)
}

// HandleFunc registers a handler function for a task type
func (s *Server) HandleFunc(pattern string, handler func(context.Context, *asynq.Task) error) {
	s.mux.HandleFunc(pattern, handler)
}

// Use adds middleware to the server
func (s *Server) Use(middlewares ...asynq.MiddlewareFunc) {
	s.mux.Use(middlewares...)
}

// Start starts the server (non-blocking)
func (s *Server) Start() error {
	if s.isRunning {
		return nil
	}

	if err := s.server.Start(s.mux); err != nil {
		return err
	}

	s.isRunning = true
	s.logger.Info("asynq server started")
	return nil
}

// Stop gracefully shuts down the server
func (s *Server) Stop() {
	if !s.isRunning {
		return
	}

	s.server.Shutdown()
	s.isRunning = false
	s.logger.Info("asynq server stopped")
}

// IsRunning returns whether the server is running
func (s *Server) IsRunning() bool {
	return s.isRunning
}

// slogAdapter adapts slog.Logger to asynq.Logger interface
type slogAdapter struct {
	logger *slog.Logger
}

func (l *slogAdapter) Debug(args ...interface{}) {
	l.logger.Debug(formatArgs(args...))
}

func (l *slogAdapter) Info(args ...interface{}) {
	l.logger.Info(formatArgs(args...))
}

func (l *slogAdapter) Warn(args ...interface{}) {
	l.logger.Warn(formatArgs(args...))
}

func (l *slogAdapter) Error(args ...interface{}) {
	l.logger.Error(formatArgs(args...))
}

func (l *slogAdapter) Fatal(args ...interface{}) {
	l.logger.Error(formatArgs(args...))
}

func formatArgs(args ...interface{}) string {
	if len(args) == 0 {
		return ""
	}
	if len(args) == 1 {
		if s, ok := args[0].(string); ok {
			return s
		}
	}
	return ""
}

// LoggingMiddleware creates a middleware that logs task processing
func LoggingMiddleware(logger *slog.Logger) asynq.MiddlewareFunc {
	return func(next asynq.Handler) asynq.Handler {
		return asynq.HandlerFunc(func(ctx context.Context, task *asynq.Task) error {
			start := time.Now()
			logger.Info("task started", "type", task.Type())

			err := next.ProcessTask(ctx, task)

			duration := time.Since(start)
			if err != nil {
				logger.Error("task failed",
					"type", task.Type(),
					"duration", duration,
					"error", err,
				)
			} else {
				logger.Info("task completed",
					"type", task.Type(),
					"duration", duration,
				)
			}
			return err
		})
	}
}

// RecoveryMiddleware creates a middleware that recovers from panics
func RecoveryMiddleware(logger *slog.Logger) asynq.MiddlewareFunc {
	return func(next asynq.Handler) asynq.Handler {
		return asynq.HandlerFunc(func(ctx context.Context, task *asynq.Task) (err error) {
			defer func() {
				if r := recover(); r != nil {
					logger.Error("task panicked",
						"type", task.Type(),
						"panic", r,
					)
					err = asynq.SkipRetry
				}
			}()
			return next.ProcessTask(ctx, task)
		})
	}
}
