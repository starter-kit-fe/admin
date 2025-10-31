package dept

import (
	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	if service == nil {
		return nil
	}
	return &Handler{service: service}
}

func (h *Handler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	tree, err := h.service.ListDepartmentTree(ctx.Request.Context(), QueryOptions{
		Status:   ctx.Query("status"),
		DeptName: ctx.Query("deptName"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load departments"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}
