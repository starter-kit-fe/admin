# Job Module

Job scheduling and execution module powered by [Asynq](https://github.com/hibiken/asynq) distributed task queue.

## Architecture

```
internal/system/job/
├── asynq/           # Asynq wrappers
│   ├── client.go    # Task client for enqueueing
│   ├── server.go    # Worker server with priority queues
│   ├── scheduler.go # Cron-based scheduler
│   └── tasks.go     # Task types and handlers
├── executor/        # Job executors
│   ├── backup_executor.go
│   ├── backup_demo.go
│   └── step_logger.go
├── handler/         # HTTP API handlers
├── repository/      # Database operations
├── service/         # Business logic
│   ├── service.go   # Core service
│   ├── execution.go # Job execution logic
│   ├── converters.go # Model conversions
│   └── validation.go # Input validation
├── types/           # Type definitions
├── handler.go       # Handler exports
├── repository.go    # Repository exports
└── service.go       # Service exports
```

## Task Types

| Type          | Description                                        |
| ------------- | -------------------------------------------------- |
| `job:execute` | Generic job execution (wraps registered executors) |
| `db:backup`   | Database backup to S3                              |

## Priority Queues

| Queue      | Weight | Use Case               |
| ---------- | ------ | ---------------------- |
| `critical` | 6      | High-priority jobs     |
| `default`  | 3      | Regular scheduled jobs |
| `low`      | 1      | Background tasks       |

## Adding a New Job Type

### 1. Create the Executor

```go
// executor/my_executor.go
package executor

func NewMyExecutor(deps MyDeps) types.Executor {
    return func(ctx context.Context, payload types.ExecutionPayload) error {
        // Parse params
        var params MyParams
        if err := json.Unmarshal(payload.Params, &params); err != nil {
            return err
        }

        // Use step logger for progress
        if payload.StepLogger != nil {
            step := payload.StepLogger.StartStep("Processing")
            defer step.Success()
        }

        // Execute logic
        return nil
    }
}
```

### 2. Register the Executor

In `internal/app/modules.go`:

```go
if err := jobSvc.RegisterExecutor("my.job", job.NewMyExecutor(deps)); err != nil {
    logger.Error("register my executor failed", "error", err)
}
```

### 3. Create Job via API

```bash
curl -X POST /v1/monitor/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "jobName": "My Job",
    "jobGroup": "DEFAULT",
    "invokeTarget": "my.job",
    "invokeParams": {"key": "value"},
    "cronExpression": "0 0 * * *",
    "status": "0"
  }'
```

## Configuration

The job module requires Redis for Asynq. Configure via environment:

```env
REDIS_URL=redis://localhost:6379/0
```

## API Endpoints

| Method | Endpoint                           | Description       |
| ------ | ---------------------------------- | ----------------- |
| GET    | `/v1/monitor/jobs`                 | List jobs         |
| POST   | `/v1/monitor/jobs`                 | Create job        |
| GET    | `/v1/monitor/jobs/:id`             | Get job           |
| PUT    | `/v1/monitor/jobs/:id`             | Update job        |
| DELETE | `/v1/monitor/jobs/:id`             | Delete job        |
| GET    | `/v1/monitor/jobs/:id/detail`      | Get job with logs |
| PUT    | `/v1/monitor/jobs/:id/status`      | Change status     |
| POST   | `/v1/monitor/jobs/:id/trigger`     | Trigger manually  |
| DELETE | `/v1/monitor/jobs/:id/logs`        | Clear logs        |
| GET    | `/v1/monitor/jobs/:id/logs/stream` | Stream logs (SSE) |

## Job Status

| Status | Description         |
| ------ | ------------------- |
| `0`    | Enabled (scheduled) |
| `1`    | Disabled            |

## Misfire Policy

| Policy | Description          |
| ------ | -------------------- |
| `1`    | Execute immediately  |
| `2`    | Execute once         |
| `3`    | Do nothing (default) |

## Concurrent Options

| Option | Description                                |
| ------ | ------------------------------------------ |
| `0`    | Allow concurrent                           |
| `1`    | Disallow concurrent (use distributed lock) |
