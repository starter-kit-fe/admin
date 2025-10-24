package handler

import (
	"github.com/gin-gonic/gin"

	postservice "github.com/starter-kit-fe/admin/internal/service/post"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type PostHandler struct {
	service *postservice.Service
}

func NewPostHandler(service *postservice.Service) *PostHandler {
	if service == nil {
		return nil
	}
	return &PostHandler{service: service}
}

func (h *PostHandler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	posts, err := h.service.ListPosts(ctx.Request.Context(), postservice.ListOptions{
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
