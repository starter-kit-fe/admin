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

// Status godoc
// @Summary 健康检查
// @Description 返回数据库、缓存等依赖的状态
// @Tags Health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /healthz [get]
func (h *HealthHandler) Status(ctx *gin.Context) {
	timeoutCtx, cancel := context.WithTimeout(ctx.Request.Context(), 2*time.Second)
	defer cancel()

	status := h.service.Status(timeoutCtx)
	resp.Success(ctx, status)
}
