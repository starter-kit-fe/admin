package test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHealthCheck(t *testing.T) {
	application, _ := SetupApp(t)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	w := httptest.NewRecorder()

	application.Handler().ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	// Health check response might vary, usually JSON or "OK"
	// Just checking 200 is good for now, assuming standard health check behavior
}
