package model

import (
	"time"
)

type SysDept struct {
	ParentID  int64   `gorm:"column:parent_id" json:"parent_id"`
	Ancestors string  `gorm:"column:ancestors" json:"ancestors"`
	DeptName  string  `gorm:"column:dept_name" json:"dept_name"`
	OrderNum  int     `gorm:"column:order_num" json:"order_num"`
	Leader    *string `gorm:"column:leader" json:"leader,omitempty"`
	Phone     *string `gorm:"column:phone" json:"phone,omitempty"`
	Email     *string `gorm:"column:email" json:"email,omitempty"`
	Status    string  `gorm:"column:status" json:"status"`
	Remark    *string `gorm:"column:remark" json:"remark,omitempty"`

	BaseModel
	CreateBy string `gorm:"column:create_by" json:"create_by"`
	UpdateBy string `gorm:"column:update_by" json:"update_by"`
}

func (SysDept) TableName() string {
	return tableName("sys_dept")
}

type SysUser struct {
	DeptID      *int64 `gorm:"column:dept_id" json:"dept_id,omitempty"`
	UserName    string `gorm:"column:user_name" json:"user_name"`
	NickName    string `gorm:"column:nick_name" json:"nick_name"`
	UserType    string `gorm:"column:user_type" json:"user_type"`
	Email       string `gorm:"column:email" json:"email"`
	Phonenumber string `gorm:"column:phonenumber" json:"phonenumber"`
	Sex         string `gorm:"column:sex" json:"sex"`
	Avatar      string `gorm:"column:avatar" json:"avatar"`
	Password    string `gorm:"column:password" json:"password"`
	Status      string `gorm:"column:status" json:"status"`

	LoginIP       string     `gorm:"column:login_ip" json:"login_ip"`
	LoginDate     *time.Time `gorm:"column:login_date" json:"login_date,omitempty"`
	PwdUpdateDate *time.Time `gorm:"column:pwd_update_date" json:"pwd_update_date,omitempty"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysUser) TableName() string {
	return tableName("sys_user")
}

type SysPost struct {
	PostCode string `gorm:"column:post_code" json:"post_code"`
	PostName string `gorm:"column:post_name" json:"post_name"`
	PostSort int    `gorm:"column:post_sort" json:"post_sort"`
	Status   string `gorm:"column:status" json:"status"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysPost) TableName() string {
	return tableName("sys_post")
}

type SysRole struct {
	RoleName          string `gorm:"column:role_name" json:"role_name"`
	RoleKey           string `gorm:"column:role_key" json:"role_key"`
	RoleSort          int    `gorm:"column:role_sort" json:"role_sort"`
	DataScope         string `gorm:"column:data_scope" json:"data_scope"`
	MenuCheckStrictly bool   `gorm:"column:menu_check_strictly" json:"menu_check_strictly"`
	DeptCheckStrictly bool   `gorm:"column:dept_check_strictly" json:"dept_check_strictly"`
	Status            string `gorm:"column:status" json:"status"`

	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysRole) TableName() string {
	return tableName("sys_role")
}

type SysMenu struct {
	MenuName string  `gorm:"column:menu_name" json:"menu_name"`
	ParentID int64   `gorm:"column:parent_id" json:"parent_id"`
	OrderNum int     `gorm:"column:order_num" json:"order_num"`
	Path     string  `gorm:"column:path" json:"path"`
	Query    *string `gorm:"column:query" json:"query,omitempty"`
	IsFrame  bool    `gorm:"column:is_frame" json:"is_frame"`
	IsCache  bool    `gorm:"column:is_cache" json:"is_cache"`
	MenuType string  `gorm:"column:menu_type" json:"menu_type"`
	Visible  string  `gorm:"column:visible" json:"visible"`
	Status   string  `gorm:"column:status" json:"status"`
	Perms    *string `gorm:"column:perms" json:"perms,omitempty"`
	Icon     string  `gorm:"column:icon" json:"icon"`
	BaseModel
	CreateBy string `gorm:"column:create_by" json:"create_by"`
	UpdateBy string `gorm:"column:update_by" json:"update_by"`
	Remark   string `gorm:"column:remark" json:"remark"`
}

func (SysMenu) TableName() string {
	return tableName("sys_menu")
}

type SysUserRole struct {
	UserID int64 `gorm:"column:user_id;primaryKey" json:"user_id"`
	RoleID int64 `gorm:"column:role_id;primaryKey" json:"role_id"`
}

func (SysUserRole) TableName() string {
	return tableName("sys_user_role")
}

type SysRoleMenu struct {
	RoleID int64 `gorm:"column:role_id;primaryKey" json:"role_id"`
	MenuID int64 `gorm:"column:menu_id;primaryKey" json:"menu_id"`
}

func (SysRoleMenu) TableName() string {
	return tableName("sys_role_menu")
}

type SysRoleDept struct {
	RoleID int64 `gorm:"column:role_id;primaryKey" json:"role_id"`
	DeptID int64 `gorm:"column:dept_id;primaryKey" json:"dept_id"`
}

func (SysRoleDept) TableName() string {
	return tableName("sys_role_dept")
}

type SysUserPost struct {
	UserID int64 `gorm:"column:user_id;primaryKey" json:"user_id"`
	PostID int64 `gorm:"column:post_id;primaryKey" json:"post_id"`
}

func (SysUserPost) TableName() string {
	return tableName("sys_user_post")
}

type SysDictType struct {
	DictName string `gorm:"column:dict_name" json:"dict_name"`
	DictType string `gorm:"column:dict_type;unique" json:"dict_type"`
	Status   string `gorm:"column:status" json:"status"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysDictType) TableName() string {
	return tableName("sys_dict_type")
}

type SysDictData struct {
	DictSort  int     `gorm:"column:dict_sort" json:"dict_sort"`
	DictLabel string  `gorm:"column:dict_label" json:"dict_label"`
	DictValue string  `gorm:"column:dict_value" json:"dict_value"`
	DictType  string  `gorm:"column:dict_type" json:"dict_type"`
	CSSClass  *string `gorm:"column:css_class" json:"css_class,omitempty"`
	ListClass *string `gorm:"column:list_class" json:"list_class,omitempty"`
	IsDefault string  `gorm:"column:is_default" json:"is_default"`
	Status    string  `gorm:"column:status" json:"status"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysDictData) TableName() string {
	return tableName("sys_dict_data")
}

type SysConfig struct {
	ConfigName  string `gorm:"column:config_name" json:"config_name"`
	ConfigKey   string `gorm:"column:config_key" json:"config_key"`
	ConfigValue string `gorm:"column:config_value" json:"config_value"`
	ConfigType  string `gorm:"column:config_type" json:"config_type"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysConfig) TableName() string {
	return tableName("sys_config")
}

type SysJob struct {
	JobName        string `gorm:"column:job_name;primaryKey" json:"job_name"`
	JobGroup       string `gorm:"column:job_group;primaryKey" json:"job_group"`
	InvokeTarget   string `gorm:"column:invoke_target" json:"invoke_target"`
	InvokeParams   string `gorm:"column:invoke_params" json:"invoke_params"`
	CronExpression string `gorm:"column:cron_expression" json:"cron_expression"`
	MisfirePolicy  string `gorm:"column:misfire_policy" json:"misfire_policy"`
	Concurrent     string `gorm:"column:concurrent" json:"concurrent"`
	Status         string `gorm:"column:status" json:"status"`
	BaseModel
	CreateBy string `gorm:"column:create_by" json:"create_by"`
	UpdateBy string `gorm:"column:update_by" json:"update_by"`
	Remark   string `gorm:"column:remark" json:"remark"`
}

func (SysJob) TableName() string {
	return tableName("sys_job")
}

type SysJobLog struct {
	JobID         int64   `gorm:"column:job_id" json:"job_id"`
	JobName       string  `gorm:"column:job_name" json:"job_name"`
	JobGroup      string  `gorm:"column:job_group" json:"job_group"`
	InvokeTarget  string  `gorm:"column:invoke_target" json:"invoke_target"`
	InvokeParams  string  `gorm:"column:invoke_params" json:"invoke_params"`
	JobMessage    *string `gorm:"column:job_message" json:"job_message,omitempty"`
	Status        string  `gorm:"column:status" json:"status"`
	ExceptionInfo string  `gorm:"column:exception_info" json:"exception_info"`
	BaseModel
}

func (SysJobLog) TableName() string {
	return tableName("sys_job_log")
}

// SysJobLogStep 定时任务执行步骤日志
type SysJobLogStep struct {
	BaseModel
	JobLogID   int64      `gorm:"column:job_log_id;not null;index" json:"jobLogId"`
	StepName   string     `gorm:"column:step_name;type:varchar(200);not null" json:"stepName"`
	StepOrder  int        `gorm:"column:step_order;not null;index:idx_job_log_step_order" json:"stepOrder"`
	Status     string     `gorm:"column:status;type:varchar(10);not null;default:'2';index" json:"status"`
	Message    string     `gorm:"column:message;type:text" json:"message,omitempty"`
	Output     string     `gorm:"column:output;type:text" json:"output,omitempty"`
	Error      string     `gorm:"column:error;type:text" json:"error,omitempty"`
	StartTime  *time.Time `gorm:"column:start_time" json:"startTime"`
	EndTime    *time.Time `gorm:"column:end_time" json:"endTime,omitempty"`
	DurationMs *int64     `gorm:"column:duration_ms" json:"durationMs,omitempty"`
}

// TableName 指定表名
func (SysJobLogStep) TableName() string {
	return tableName("sys_job_log_step")
}

type SysNotice struct {
	NoticeTitle   string `gorm:"column:notice_title" json:"notice_title"`
	NoticeType    string `gorm:"column:notice_type" json:"notice_type"`
	NoticeContent []byte `gorm:"column:notice_content" json:"notice_content"`
	Status        string `gorm:"column:status" json:"status"`
	BaseModel
	CreateBy string  `gorm:"column:create_by" json:"create_by"`
	UpdateBy string  `gorm:"column:update_by" json:"update_by"`
	Remark   *string `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysNotice) TableName() string {
	return tableName("sys_notice")
}
