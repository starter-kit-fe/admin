package resp

import "github.com/gin-gonic/gin"

type Response struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(ctx *gin.Context, data interface{}) {
	ctx.JSON(200, Response{
		Message: "OK",
		Data:    data,
	})
}

func Error(ctx *gin.Context, code int, message string) {
	ctx.JSON(code, Response{
		Message: message,
	})
}
