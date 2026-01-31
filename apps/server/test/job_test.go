package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
	"github.com/stretchr/testify/assert"
)

func TestJobModule(t *testing.T) {
	app, mr := SetupApp(t)
	CreateUser(t, app, "admin", "admin123")
	token := Login(t, app, mr, "admin", "admin123")

	t.Run("List Jobs Empty", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/v1/monitor/jobs", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		app.Handler().ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var res struct {
			Data types.ListResult `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &res)
		assert.NoError(t, err)
		assert.Equal(t, int64(0), res.Data.Total)
	})

	t.Run("Create Job", func(t *testing.T) {
		job := types.CreateJobInput{
			JobName:        "Test Job",
			JobGroup:       "default",
			InvokeTarget:   "db.backup",
			CronExpression: "0 0 * * * ?",
			MisfirePolicy:  "1",
			Concurrent:     "0",
			Status:         "0",
			Remark:         nil,
		}
		body, _ := json.Marshal(job)
		req := httptest.NewRequest(http.MethodPost, "/v1/monitor/jobs", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		app.Handler().ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("List Jobs After Create", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/v1/monitor/jobs", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		app.Handler().ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var res struct {
			Data types.ListResult `json:"data"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &res)
		assert.Equal(t, int64(1), res.Data.Total)
		assert.Equal(t, "Test Job", res.Data.List[0].JobName)
		// jobID = res.Data.List[0].JobID
	})

	// Run Job
	// Since we mocked Redis but didn't actually start the Cron scheduler properly in test mode?
	// App.New calls jobs.Start(). So scheduler SHOULD be running.
	// But it uses Redis for distributed lock or something?
	// Test env uses Miniredis.
	// InvokeTarget "db.backup" uses "db.backup" executor.
	// We didn't config S3, so backup executor (which uses S3) might fail.
	// But we just want to trigger it and see if it returns 200 (OK triggered).

	// t.Run("Trigger Job", func(t *testing.T) {
	// 	// Implementation ...
	// })
}
