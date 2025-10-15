package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

func NotImplemented(feature string) gin.HandlerFunc {
	message := "not implemented"
	if feature != "" {
		message = fmt.Sprintf("%s not implemented", feature)
	}

	return func(ctx *gin.Context) {
		resp.NotImplemented(ctx, resp.WithMessage(message))
	}
}
