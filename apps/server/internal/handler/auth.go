package handler

import (
	"errors"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/middleware"
	authservice "github.com/starter-kit-fe/admin/internal/service/auth"
	captchaservice "github.com/starter-kit-fe/admin/internal/service/captcha"
	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type AuthHandler struct {
	service        *authservice.Service
	captchaService *captchaservice.Service
	jwtMaker       *jwtpkg.JWTMaker
	secret         string
	tokenDuration  time.Duration
}

func NewAuthHandler(service *authservice.Service, captcha *captchaservice.Service, secret string, duration time.Duration) *AuthHandler {
	if service == nil || secret == "" {
		return nil
	}
	if duration <= 0 {
		duration = constant.JWT_EXP
	}
	return &AuthHandler{
		service:        service,
		captchaService: captcha,
		jwtMaker:       jwtpkg.NewJWTMaker(),
		secret:         secret,
		tokenDuration:  duration,
	}
}

func (h *AuthHandler) Login(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	var payload struct {
		Username  string `json:"username" binding:"required"`
		Password  string `json:"password" binding:"required"`
		Code      string `json:"code"`
		Captcha   string `json:"captcha"`
		UUID      string `json:"uuid"`
		CaptchaID string `json:"captcha_id"`
	}

	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid credentials payload"))
		return
	}

	if h.captchaService != nil {
		answer := strings.TrimSpace(payload.Code)
		if answer == "" {
			answer = strings.TrimSpace(payload.Captcha)
		}

		captchaID := strings.TrimSpace(payload.UUID)
		if captchaID == "" {
			captchaID = strings.TrimSpace(payload.CaptchaID)
		}

		if captchaID == "" || answer == "" || !h.captchaService.Verify(ctx.Request.Context(), captchaID, answer, true) {
			resp.Forbidden(ctx, resp.WithMessage("captcha verification failed"))
			return
		}
	}

	user, err := h.service.Authenticate(ctx.Request.Context(), payload.Username, payload.Password)
	if err != nil {
		switch {
		case errors.Is(err, authservice.ErrInvalidCredentials):
			resp.Unauthorized(ctx, resp.WithMessage("invalid username or password"))
		case errors.Is(err, authservice.ErrAccountDisabled):
			resp.Forbidden(ctx, resp.WithMessage("account disabled"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to authenticate"))
		}
		return
	}

	token, err := h.jwtMaker.CreateToken(uint(user.UserID), h.secret, h.tokenDuration)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to issue token"))
		return
	}

	ctx.JSON(200, gin.H{
		"code":  200,
		"msg":   "操作成功",
		"token": token,
	})
}

func (h *AuthHandler) GetInfo(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	user, roles, permissions, err := h.service.Profile(ctx.Request.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, authservice.ErrInvalidCredentials):
			resp.Unauthorized(ctx, resp.WithMessage("user not found"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to load user profile"))
		}
		return
	}

	if len(roles) == 0 {
		roles = []string{"common"}
	}

	ctx.JSON(200, gin.H{
		"code":        200,
		"msg":         "操作成功",
		"permissions": permissions,
		"roles":       roles,
		"user": gin.H{
			"userId":      user.UserID,
			"deptId":      user.DeptID,
			"userName":    user.UserName,
			"nickName":    user.NickName,
			"email":       user.Email,
			"phonenumber": user.Phonenumber,
			"sex":         user.Sex,
			"avatar":      user.Avatar,
			"status":      user.Status,
			"remark":      user.Remark,
		},
	})
}
