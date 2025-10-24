package handler

import (
	"github.com/gin-gonic/gin"

	deptservice "github.com/starter-kit-fe/admin/internal/service/dept"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type DeptHandler struct {
	service *deptservice.Service
}

func NewDeptHandler(service *deptservice.Service) *DeptHandler {
	if service == nil {
		return nil
	}
	return &DeptHandler{service: service}
}

func (h *DeptHandler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	tree, err := h.service.ListDepartmentTree(ctx.Request.Context(), deptservice.ListOptions{
		Status:   ctx.Query("status"),
		DeptName: ctx.Query("deptName"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load departments"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}
