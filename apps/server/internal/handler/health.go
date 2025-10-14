package handler

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/service/health"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type HealthHandler struct {
	service *health.Service
}

func NewHealthHandler(service *health.Service) *HealthHandler {
	return &HealthHandler{service: service}
}

func (h *HealthHandler) Register(r gin.IRoutes) {
	r.GET("/healthz", h.getStatus)
}

func (h *HealthHandler) getStatus(ctx *gin.Context) {
	timeoutCtx, cancel := context.WithTimeout(ctx.Request.Context(), 2*time.Second)
	defer cancel()

	status := h.service.Status(timeoutCtx)
	resp.Success(ctx, status)
}
