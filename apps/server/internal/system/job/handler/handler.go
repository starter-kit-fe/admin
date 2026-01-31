package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/system/job/service"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

const defaultOperator = "system"

type Handler struct {
	service *service.Service
}

func NewHandler(service *service.Service) *Handler {
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
	JobName        string          `json:"jobName" binding:"required"`
	JobGroup       string          `json:"jobGroup"`
	InvokeTarget   string          `json:"invokeTarget" binding:"required"`
	InvokeParams   json.RawMessage `json:"invokeParams"`
	CronExpression string          `json:"cronExpression" binding:"required"`
	MisfirePolicy  string          `json:"misfirePolicy"`
	Concurrent     string          `json:"concurrent"`
	Status         string          `json:"status"`
	Remark         *string         `json:"remark"`
}

type updateJobRequest struct {
	JobName        *string          `json:"jobName"`
	JobGroup       *string          `json:"jobGroup"`
	InvokeTarget   *string          `json:"invokeTarget"`
	InvokeParams   *json.RawMessage `json:"invokeParams"`
	CronExpression *string          `json:"cronExpression"`
	MisfirePolicy  *string          `json:"misfirePolicy"`
	Concurrent     *string          `json:"concurrent"`
	Status         *string          `json:"status"`
	Remark         *string          `json:"remark"`
}

type changeStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type jobDetailQuery struct {
	LogPageNum  int `form:"logPageNum"`
	LogPageSize int `form:"logPageSize"`
}

// List godoc
// @Summary 获取定时任务列表
// @Description 按名称、分组、状态、时间范围过滤任务
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param jobName query string false "任务名称"
// @Param jobGroup query string false "任务分组"
// @Param status query string false "任务状态"
// @Param startTime query string false "开始时间(YYYY-MM-DD HH:mm:ss)"
// @Param endTime query string false "结束时间(YYYY-MM-DD HH:mm:ss)"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs [get]
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

	var startTime time.Time
	var endTime time.Time
	if trimmed := strings.TrimSpace(query.StartTime); trimmed != "" {
		if ts, err := time.Parse("2006-01-02 15:04:05", trimmed); err == nil {
			startTime = ts
		}
	}
	if trimmed := strings.TrimSpace(query.EndTime); trimmed != "" {
		if ts, err := time.Parse("2006-01-02 15:04:05", trimmed); err == nil {
			endTime = ts
		}
	}

	result, err := h.service.ListJobs(ctx.Request.Context(), types.ListJobsOptions{
		PageNum:   query.PageNum,
		PageSize:  query.PageSize,
		JobName:   query.JobName,
		JobGroup:  query.JobGroup,
		Status:    query.Status,
		StartTime: startTime,
		EndTime:   endTime,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load jobs"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

// Create godoc
// @Summary 新增定时任务
// @Description 创建任务并保存调度规则
// @Tags Monitor/Job
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createJobRequest true "任务参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs [post]
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

	job, err := h.service.CreateJob(ctx.Request.Context(), types.CreateJobInput{
		JobName:        payload.JobName,
		JobGroup:       payload.JobGroup,
		InvokeTarget:   payload.InvokeTarget,
		InvokeParams:   payload.InvokeParams,
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

// Get godoc
// @Summary 获取定时任务详情
// @Description 根据任务ID查询详情
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "任务ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id} [get]
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

// Detail godoc
// @Summary 获取定时任务详情
// @Description 返回任务及执行日志
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "任务ID"
// @Param logPageNum query int false "日志页码"
// @Param logPageSize query int false "日志页大小"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id}/detail [get]
func (h *Handler) Detail(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	var query jobDetailQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	detail, err := h.service.GetJobDetail(ctx.Request.Context(), id, types.ListJobLogsOptions{
		PageNum:  query.LogPageNum,
		PageSize: query.LogPageSize,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load job detail"))
		return
	}

	resp.OK(ctx, resp.WithData(detail))
}

// Update godoc
// @Summary 修改定时任务
// @Description 更新任务及调度信息
// @Tags Monitor/Job
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "任务ID"
// @Param request body updateJobRequest true "任务参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id} [put]
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

	job, err := h.service.UpdateJob(ctx.Request.Context(), types.UpdateJobInput{
		ID:             id,
		JobName:        payload.JobName,
		JobGroup:       payload.JobGroup,
		InvokeTarget:   payload.InvokeTarget,
		InvokeParams:   payload.InvokeParams,
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

// Delete godoc
// @Summary 删除定时任务
// @Description 根据ID移除任务
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "任务ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id} [delete]
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

// ClearLogs godoc
// @Summary 清空定时任务日志
// @Description 删除指定任务的全部执行日志
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "任务ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id}/logs [delete]
func (h *Handler) ClearLogs(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	id, err := parseID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid job id"))
		return
	}

	if err := h.service.ClearJobLogs(ctx.Request.Context(), id, currentOperator(ctx)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		if errors.Is(err, service.ErrJobRunningActive) || errors.Is(err, service.ErrJobRunningConflict) {
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
			return
		}
		if errors.Is(err, service.ErrServiceUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to clear job logs"))
		return
	}

	resp.NoContent(ctx)
}

// ChangeStatus godoc
// @Summary 修改任务状态
// @Description 启停指定任务
// @Tags Monitor/Job
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "任务ID"
// @Param request body changeStatusRequest true "状态参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id}/status [patch]
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

// Trigger godoc
// @Summary 立即执行任务
// @Description 手动触发一次定时任务
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "任务ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/{id}/run [post]
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

	logID, err := h.service.TriggerJob(ctx.Request.Context(), id, currentOperator(ctx))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job not found"))
			return
		}
		if errors.Is(err, service.ErrJobRunningConflict) {
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to trigger job"))
		return
	}

	resp.OK(ctx, resp.WithData(gin.H{"jobLogId": logID}))
}

// GetLogSteps godoc
// @Summary 获取执行日志的步骤
// @Description 按日志 ID 返回步骤明细
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce json
// @Param id path int true "日志ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/logs/{id}/steps [get]
func (h *Handler) GetLogSteps(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	logID, err := parseID(ctx.Param("id"))
	if err != nil || logID <= 0 {
		resp.BadRequest(ctx, resp.WithMessage("invalid job log id"))
		return
	}

	steps, err := h.service.GetJobLogSteps(ctx.Request.Context(), logID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load job log steps"))
		return
	}

	resp.OK(ctx, resp.WithData(steps))
}

// StreamLog godoc
// @Summary 查看任务执行实时日志
// @Description 通过 SSE 订阅指定日志的步骤流
// @Tags Monitor/Job
// @Security BearerAuth
// @Produce text/event-stream
// @Param id path int true "日志ID"
// @Success 200 {string} string
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/jobs/logs/{id}/stream [get]
func (h *Handler) StreamLog(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("job service unavailable"))
		return
	}

	logID, err := parseID(ctx.Param("id"))
	if err != nil || logID <= 0 {
		resp.BadRequest(ctx, resp.WithMessage("invalid job log id"))
		return
	}

	if _, err := h.service.GetJobLog(ctx.Request.Context(), logID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("job log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load job log"))
		return
	}

	stream, cleanup := h.service.SubscribeLogStream(logID)
	if stream == nil {
		resp.InternalServerError(ctx, resp.WithMessage("log stream unavailable"))
		return
	}
	defer cleanup()

	flusher, ok := ctx.Writer.(http.Flusher)
	if !ok {
		resp.InternalServerError(ctx, resp.WithMessage("streaming unsupported"))
		return
	}

	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Writer.WriteHeader(http.StatusOK)
	flusher.Flush()

	sendEvent := func(eventType string, payload interface{}) {
		data, err := json.Marshal(payload)
		if err != nil {
			return
		}
		_, _ = ctx.Writer.Write([]byte("event: " + eventType + "\n"))
		_, _ = ctx.Writer.Write([]byte("data: " + string(data) + "\n\n"))
		flusher.Flush()
	}

	sendEvent("connected", types.StepEvent{
		Type:      "connected",
		JobLogID:  logID,
		Timestamp: time.Now().Format(time.RFC3339),
	})

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-stream:
			if !ok {
				return
			}
			if evt == nil {
				continue
			}
			sendEvent(evt.Type, evt)
		case t := <-heartbeat.C:
			sendEvent("heartbeat", types.StepEvent{
				Type:      "heartbeat",
				JobLogID:  logID,
				Timestamp: t.UTC().Format(time.RFC3339),
			})
		}
	}
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
