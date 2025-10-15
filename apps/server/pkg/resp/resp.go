package resp

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"msg"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

type Option func(*Response)

func WithMessage(msg string) Option {
	return func(r *Response) {
		r.Message = msg
	}
}

func WithData(data interface{}) Option {
	return func(r *Response) {
		r.Data = data
	}
}

func WithError(err interface{}) Option {
	return func(r *Response) {
		r.Error = err
	}
}

func WithCode(code int) Option {
	return func(r *Response) {
		r.Code = code
	}
}

func Success(ctx *gin.Context, data interface{}) {
	OK(ctx, WithData(data))
}

func Error(ctx *gin.Context, code int, message string) {
	respond(ctx, code, message)
}

func OK(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusOK, http.StatusText(http.StatusOK), opts...)
}

func Created(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusCreated, http.StatusText(http.StatusCreated), opts...)
}

func Accepted(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusAccepted, http.StatusText(http.StatusAccepted), opts...)
}

func NoContent(ctx *gin.Context) {
	ctx.Status(http.StatusNoContent)
}

func BadRequest(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusBadRequest, http.StatusText(http.StatusBadRequest), opts...)
}

func Unauthorized(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusUnauthorized, http.StatusText(http.StatusUnauthorized), opts...)
}

func Forbidden(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusForbidden, http.StatusText(http.StatusForbidden), opts...)
}

func NotFound(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusNotFound, http.StatusText(http.StatusNotFound), opts...)
}

func Conflict(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusConflict, http.StatusText(http.StatusConflict), opts...)
}

func MethodNotAllowed(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusMethodNotAllowed, http.StatusText(http.StatusMethodNotAllowed), opts...)
}

func UnprocessableEntity(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusUnprocessableEntity, http.StatusText(http.StatusUnprocessableEntity), opts...)
}

func InternalServerError(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError), opts...)
}

func ServiceUnavailable(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusServiceUnavailable, http.StatusText(http.StatusServiceUnavailable), opts...)
}

func NotImplemented(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusNotImplemented, http.StatusText(http.StatusNotImplemented), opts...)
}

func TooManyRequests(ctx *gin.Context, opts ...Option) {
	respond(ctx, http.StatusTooManyRequests, http.StatusText(http.StatusTooManyRequests), opts...)
}

func respond(ctx *gin.Context, status int, defaultMessage string, opts ...Option) {
	response := Response{
		Code:    status,
		Message: defaultMessage,
	}

	for _, opt := range opts {
		opt(&response)
	}

	ctx.JSON(status, response)
}
