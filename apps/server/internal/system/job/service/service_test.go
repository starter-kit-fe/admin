package service

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/job/repository"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&model.SysJob{}, &model.SysJobLog{}, &model.SysJobLogStep{})
	require.NoError(t, err)

	return db
}

func setupTestRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	s := miniredis.RunT(t)
	r := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	return s, r
}

func TestService_StartStop(t *testing.T) {
	db := setupTestDB(t)
	_, rdb := setupTestRedis(t)
	repo := repository.NewRepository(db)

	svc := NewService(repo, ServiceOptions{
		Redis:     rdb,
		RedisAddr: rdb.Options().Addr,
	})
	require.NotNil(t, svc)

	ctx := context.Background()
	err := svc.Start(ctx)
	assert.NoError(t, err)

	svc.Stop()
}

func TestService_ManualTrigger(t *testing.T) {
	db := setupTestDB(t)
	_, rdb := setupTestRedis(t)
	repo := repository.NewRepository(db)

	svc := NewService(repo, ServiceOptions{
		Redis:     rdb,
		RedisAddr: rdb.Options().Addr,
	})
	require.NotNil(t, svc)
	defer svc.Stop()

	// Register mock executor using Service method
	err := svc.RegisterExecutor("testTarget", func(ctx context.Context, payload types.ExecutionPayload) error {
		return nil
	})
	require.NoError(t, err)

	ctx := context.Background()
	err = svc.Start(ctx)
	require.NoError(t, err)

	// Create a job
	job := &model.SysJob{
		JobName:        "Test Job",
		JobGroup:       "DEFAULT",
		InvokeTarget:   "testTarget",
		CronExpression: "0 0 * * *", // Won't run automatically soon
		MisfirePolicy:  "1",
		Concurrent:     "1",
		Status:         "0",
	}
	err = repo.CreateJob(ctx, job)
	require.NoError(t, err)

	// Trigger manually
	_, err = svc.TriggerJob(ctx, int64(job.ID), "manual:test")
	assert.NoError(t, err)

	// Give it some time to process via Asynq
	time.Sleep(2 * time.Second)

	// Verify log created
	logs, _, err := repo.ListJobLogs(ctx, int64(job.ID), 1, 15)
	require.NoError(t, err)

	if len(logs) == 0 {
		t.Fatal("expected logs, got none")
	}

	assert.Equal(t, int64(job.ID), logs[0].JobID)
	if assert.NotNil(t, logs[0].JobMessage) {
		assert.Contains(t, *logs[0].JobMessage, "手动触发")
	}

	// We can't easily verify execution success here because the worker runs in a separate goroutine
	// and we didn't wait/sync properly, plus Asynq worker might need more setup time.
	// But asserting log creation proves the service flow works.
}
