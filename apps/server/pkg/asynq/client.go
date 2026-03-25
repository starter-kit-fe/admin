package asynq

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

// Client wraps asynq.Client with convenience methods
type Client struct {
	client *asynq.Client
}

// ClientOptions configures the Asynq client
type ClientOptions struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
}

// NewClient creates a new Asynq client
func NewClient(opts ClientOptions) *Client {
	client := asynq.NewClient(asynq.RedisClientOpt{
		Addr:     opts.RedisAddr,
		Password: opts.RedisPassword,
		DB:       opts.RedisDB,
	})
	return &Client{client: client}
}

// NewClientFromRedisOpt creates a client from asynq.RedisClientOpt
func NewClientFromRedisOpt(opt asynq.RedisClientOpt) *Client {
	return &Client{client: asynq.NewClient(opt)}
}

// Close closes the client connection
func (c *Client) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
}

// EnqueueTask enqueues a task to the default queue
func (c *Client) EnqueueTask(ctx context.Context, taskType string, payload interface{}, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal task payload: %w", err)
	}
	task := asynq.NewTask(taskType, data)
	return c.client.EnqueueContext(ctx, task, opts...)
}

// EnqueueTaskIn schedules a task to run after the specified duration
func (c *Client) EnqueueTaskIn(ctx context.Context, taskType string, payload interface{}, delay time.Duration, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	opts = append(opts, asynq.ProcessIn(delay))
	return c.EnqueueTask(ctx, taskType, payload, opts...)
}

// EnqueueTaskAt schedules a task to run at the specified time
func (c *Client) EnqueueTaskAt(ctx context.Context, taskType string, payload interface{}, at time.Time, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	opts = append(opts, asynq.ProcessAt(at))
	return c.EnqueueTask(ctx, taskType, payload, opts...)
}

// EnqueueUniqueTask enqueues a unique task (prevents duplicates within TTL)
func (c *Client) EnqueueUniqueTask(ctx context.Context, taskType string, payload interface{}, uniqueTTL time.Duration, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	opts = append(opts, asynq.Unique(uniqueTTL))
	return c.EnqueueTask(ctx, taskType, payload, opts...)
}

// TaskOptions returns common task option builders
type TaskOptions struct{}

// Critical returns options for critical priority tasks
func (TaskOptions) Critical() []asynq.Option {
	return []asynq.Option{
		asynq.Queue(QueueCritical),
		asynq.MaxRetry(5),
	}
}

// Default returns options for default priority tasks
func (TaskOptions) Default() []asynq.Option {
	return []asynq.Option{
		asynq.Queue(QueueDefault),
		asynq.MaxRetry(3),
	}
}

// Low returns options for low priority tasks
func (TaskOptions) Low() []asynq.Option {
	return []asynq.Option{
		asynq.Queue(QueueLow),
		asynq.MaxRetry(2),
	}
}

// WithTimeout returns options with a timeout
func (TaskOptions) WithTimeout(d time.Duration) asynq.Option {
	return asynq.Timeout(d)
}

// WithDeadline returns options with a deadline
func (TaskOptions) WithDeadline(t time.Time) asynq.Option {
	return asynq.Deadline(t)
}

// WithRetention returns options to retain task info after completion
func (TaskOptions) WithRetention(d time.Duration) asynq.Option {
	return asynq.Retention(d)
}
