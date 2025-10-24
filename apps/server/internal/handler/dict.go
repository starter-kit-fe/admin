package handler

import (
	"github.com/gin-gonic/gin"

	dictservice "github.com/starter-kit-fe/admin/internal/service/dict"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type DictHandler struct {
	service *dictservice.Service
}

func NewDictHandler(service *dictservice.Service) *DictHandler {
	if service == nil {
		return nil
	}
	return &DictHandler{service: service}
}

func (h *DictHandler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	items, err := h.service.ListDictTypes(ctx.Request.Context(), dictservice.ListOptions{
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
