package handler

import (
	"github.com/gin-gonic/gin"

	menuservice "github.com/starter-kit-fe/admin/internal/service/menu"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type MenuHandler struct {
	service *menuservice.Service
}

func NewMenuHandler(service *menuservice.Service) *MenuHandler {
	if service == nil {
		return nil
	}
	return &MenuHandler{service: service}
}

func (h *MenuHandler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	status := ctx.Query("status")
	name := ctx.Query("menuName")

	tree, err := h.service.ListMenuTree(ctx.Request.Context(), menuservice.ListOptions{
		Status:   status,
		MenuName: name,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load menu tree"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}
