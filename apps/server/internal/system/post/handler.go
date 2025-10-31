package post

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
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	posts, err := h.service.ListPosts(ctx.Request.Context(), QueryOptions{
		Status:   ctx.Query("status"),
		PostName: ctx.Query("postName"),
		PostCode: ctx.Query("postCode"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load posts"))
		return
	}

	resp.OK(ctx, resp.WithData(posts))
}
