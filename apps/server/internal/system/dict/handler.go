package dict

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

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	items, err := h.service.ListDictTypes(ctx.Request.Context(), QueryOptions{
		Status:   ctx.Query("status"),
		DictName: ctx.Query("dictName"),
		DictType: ctx.Query("dictType"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load dictionary types"))
		return
	}

	resp.OK(ctx, resp.WithData(items))
}
