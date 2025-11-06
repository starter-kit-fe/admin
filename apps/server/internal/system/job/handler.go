package job

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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

type listJobQuery struct {
	PageNum   int    `form:"pageNum"`
	PageSize  int    `form:"pageSize"`
	JobName   string `form:"jobName"`
	JobGroup  string `form:"jobGroup"`
	Status    string `form:"status"`
	StartTime string `form:"startTime"`
	EndTime   string `form:"endTime"`
}

type createJobRequest struct {
	JobName        string  `json:"jobName" binding:"required"`
	JobGroup       string  `json:"jobGroup"`
	InvokeTarget   string  `json:"invokeTarget" binding:"required"`
	CronExpression string  `json:"cronExpression" binding:"required"`
	MisfirePolicy  string  `json:"misfirePolicy"`
	Concurrent     string  `json:"concurrent"`
	Status         string  `json:"status"`
	Remark         *string `json:"remark"`
}

type updateJobRequest struct {
	JobName        *string `json:"jobName"`
	JobGroup       *string `json:"jobGroup"`
	InvokeTarget   *string `json:"invokeTarget"`
	CronExpression *string `json:"cronExpression"`
	MisfirePolicy  *string `json:"misfirePolicy"`
	Concurrent     *string `json:"concurrent"`
	Status         *string `json:"status"`
	Remark         *string `json:"remark"`
}

type changeStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	var query listJobQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListJobs(ctx.Request.Context(), ListJobsOptions{
		PageNum:   query.PageNum,
		PageSize:  query.PageSize,
		JobName:   query.JobName,
		JobGroup:  query.JobGroup,
		Status:    query.Status,
		StartTime: query.StartTime,
		EndTime:   query.EndTime,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load jobs"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	var payload createJobRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job payload"))
		return
	}

	job, err := h.service.CreateJob(ctx.Request.Context(), CreateJobInput{
		JobName:        payload.JobName,
		JobGroup:       payload.JobGroup,
		InvokeTarget:   payload.InvokeTarget,
		CronExpression: payload.CronExpression,
		MisfirePolicy:  payload.MisfirePolicy,
		Concurrent:     payload.Concurrent,
		Status:         payload.Status,
		Remark:         payload.Remark,
		Operator:       currentOperator(ctx),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage(err.Error()))
		return
	}

	resp.Created(ctx, resp.WithData(job))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	job, err := h.service.GetJob(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load job"))
		return
	}

	resp.OK(ctx, resp.WithData(job))
}

func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	var payload updateJobRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job payload"))
		return
	}

	job, err := h.service.UpdateJob(ctx.Request.Context(), UpdateJobInput{
		ID:             id,
		JobName:        payload.JobName,
		JobGroup:       payload.JobGroup,
		InvokeTarget:   payload.InvokeTarget,
		CronExpression: payload.CronExpression,
		MisfirePolicy:  payload.MisfirePolicy,
		Concurrent:     payload.Concurrent,
		Status:         payload.Status,
		Remark:         payload.Remark,
		Operator:       currentOperator(ctx),
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage(err.Error()))
		return
	}

	resp.OK(ctx, resp.WithData(job))
}

func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	if err := h.service.DeleteJob(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete job"))
		return
	}

	resp.NoContent(ctx)
}

func (h *Handler) ChangeStatus(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	var payload changeStatusRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid status payload"))
		return
	}

	if err := h.service.ChangeStatus(ctx.Request.Context(), id, payload.Status, currentOperator(ctx)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		return
	}

	resp.OK(ctx, resp.WithData(true))
}

func (h *Handler) Trigger(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	if err := h.service.TriggerJob(ctx.Request.Context(), id, currentOperator(ctx)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to trigger job"))
		return
	}

	resp.OK(ctx, resp.WithData(true))
}

func parseID(value string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, errors.New("id is required")
	}
	return strconv.ParseInt(value, 10, 64)
}

func currentOperator(ctx *gin.Context) string {
	if ctx == nil {
		return defaultOperator
	}
	user := strings.TrimSpace(ctx.GetString("current_user"))
	if user != "" {
		return user
	}
	if claims, ok := ctx.Get("user_id"); ok {
		switch v := claims.(type) {
		case string:
			return v
		case int:
			return strconv.Itoa(v)
		case int64:
			return strconv.FormatInt(v, 10)
		case uint:
			return strconv.FormatUint(uint64(v), 10)
		case uint64:
			return strconv.FormatUint(v, 10)
		}
	}
	return defaultOperator
}
