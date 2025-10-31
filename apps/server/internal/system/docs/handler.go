package docs

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/docs"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) SwaggerJSON(ctx *gin.Context) {
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", docs.OpenAPISpec())
}

func (h *Handler) SwaggerUI(ctx *gin.Context) {
	ctx.Data(http.StatusOK, "text/html; charset=utf-8", docs.SwaggerHTML())
}
