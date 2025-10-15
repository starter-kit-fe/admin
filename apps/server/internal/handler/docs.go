package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/docs"
)

type DocsHandler struct{}

func NewDocsHandler() *DocsHandler {
	return &DocsHandler{}
}

func (h *DocsHandler) SwaggerJSON(ctx *gin.Context) {
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", docs.OpenAPISpec())
}

func (h *DocsHandler) SwaggerUI(ctx *gin.Context) {
	ctx.Data(http.StatusOK, "text/html; charset=utf-8", docs.SwaggerHTML())
}
