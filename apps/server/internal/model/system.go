package model

import (
	"time"

	"github.com/starter-kit-fe/admin/constant"
)

func tableName(suffix string) string {
	return constant.DB_PREFIX + suffix
}

type SysDept struct {
	DeptID     int64      `gorm:"column:dept_id;primaryKey;autoIncrement" json:"dept_id"`
	ParentID   int64      `gorm:"column:parent_id" json:"parent_id"`
	Ancestors  string     `gorm:"column:ancestors" json:"ancestors"`
	DeptName   string     `gorm:"column:dept_name" json:"dept_name"`
	OrderNum   int        `gorm:"column:order_num" json:"order_num"`
	Leader     *string    `gorm:"column:leader" json:"leader,omitempty"`
	Phone      *string    `gorm:"column:phone" json:"phone,omitempty"`
	Email      *string    `gorm:"column:email" json:"email,omitempty"`
	Status     string     `gorm:"column:status" json:"status"`
	Remark     *string    `gorm:"column:remark" json:"remark,omitempty"`
	DelFlag    string     `gorm:"column:del_flag" json:"del_flag"`
	CreateBy   string     `gorm:"column:create_by" json:"create_by"`
	CreateTime *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy   string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
}

func (SysDept) TableName() string {
	return tableName("sys_dept")
}

type SysUser struct {
	UserID        int64      `gorm:"column:user_id;primaryKey;autoIncrement" json:"user_id"`
	DeptID        *int64     `gorm:"column:dept_id" json:"dept_id,omitempty"`
	UserName      string     `gorm:"column:user_name" json:"user_name"`
	NickName      string     `gorm:"column:nick_name" json:"nick_name"`
	UserType      string     `gorm:"column:user_type" json:"user_type"`
	Email         string     `gorm:"column:email" json:"email"`
	Phonenumber   string     `gorm:"column:phonenumber" json:"phonenumber"`
	Sex           string     `gorm:"column:sex" json:"sex"`
	Avatar        string     `gorm:"column:avatar" json:"avatar"`
	Password      string     `gorm:"column:password" json:"password"`
	Status        string     `gorm:"column:status" json:"status"`
	DelFlag       string     `gorm:"column:del_flag" json:"del_flag"`
	LoginIP       string     `gorm:"column:login_ip" json:"login_ip"`
	LoginDate     *time.Time `gorm:"column:login_date" json:"login_date,omitempty"`
	PwdUpdateDate *time.Time `gorm:"column:pwd_update_date" json:"pwd_update_date,omitempty"`
	CreateBy      string     `gorm:"column:create_by" json:"create_by"`
	CreateTime    *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy      string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime    *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark        *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysUser) TableName() string {
	return tableName("sys_user")
}

type SysPost struct {
	PostID     int64      `gorm:"column:post_id;primaryKey;autoIncrement" json:"post_id"`
	PostCode   string     `gorm:"column:post_code" json:"post_code"`
	PostName   string     `gorm:"column:post_name" json:"post_name"`
	PostSort   int        `gorm:"column:post_sort" json:"post_sort"`
	Status     string     `gorm:"column:status" json:"status"`
	CreateBy   string     `gorm:"column:create_by" json:"create_by"`
	CreateTime *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy   string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark     *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysPost) TableName() string {
	return tableName("sys_post")
}

type SysRole struct {
	RoleID            int64      `gorm:"column:role_id;primaryKey;autoIncrement" json:"role_id"`
	RoleName          string     `gorm:"column:role_name" json:"role_name"`
	RoleKey           string     `gorm:"column:role_key" json:"role_key"`
	RoleSort          int        `gorm:"column:role_sort" json:"role_sort"`
	DataScope         string     `gorm:"column:data_scope" json:"data_scope"`
	MenuCheckStrictly bool       `gorm:"column:menu_check_strictly" json:"menu_check_strictly"`
	DeptCheckStrictly bool       `gorm:"column:dept_check_strictly" json:"dept_check_strictly"`
	Status            string     `gorm:"column:status" json:"status"`
	DelFlag           string     `gorm:"column:del_flag" json:"del_flag"`
	CreateBy          string     `gorm:"column:create_by" json:"create_by"`
	CreateTime        *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy          string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime        *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark            *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysRole) TableName() string {
	return tableName("sys_role")
}

type SysMenu struct {
	MenuID     int64      `gorm:"column:menu_id;primaryKey;autoIncrement" json:"menu_id"`
	MenuName   string     `gorm:"column:menu_name" json:"menu_name"`
	ParentID   int64      `gorm:"column:parent_id" json:"parent_id"`
	OrderNum   int        `gorm:"column:order_num" json:"order_num"`
	Path       string     `gorm:"column:path" json:"path"`
	Query      *string    `gorm:"column:query" json:"query,omitempty"`
	IsFrame    bool       `gorm:"column:is_frame" json:"is_frame"`
	IsCache    bool       `gorm:"column:is_cache" json:"is_cache"`
	MenuType   string     `gorm:"column:menu_type" json:"menu_type"`
	Visible    string     `gorm:"column:visible" json:"visible"`
	Status     string     `gorm:"column:status" json:"status"`
	Perms      *string    `gorm:"column:perms" json:"perms,omitempty"`
	Icon       string     `gorm:"column:icon" json:"icon"`
	CreateBy   string     `gorm:"column:create_by" json:"create_by"`
	CreateTime *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy   string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark     string     `gorm:"column:remark" json:"remark"`
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

type SysOperLog struct {
	OperID        int64      `gorm:"column:oper_id;primaryKey;autoIncrement" json:"oper_id"`
	Title         string     `gorm:"column:title" json:"title"`
	BusinessType  int        `gorm:"column:business_type" json:"business_type"`
	Method        string     `gorm:"column:method" json:"method"`
	RequestMethod string     `gorm:"column:request_method" json:"request_method"`
	OperatorType  int        `gorm:"column:operator_type" json:"operator_type"`
	OperName      string     `gorm:"column:oper_name" json:"oper_name"`
	DeptName      string     `gorm:"column:dept_name" json:"dept_name"`
	OperURL       string     `gorm:"column:oper_url" json:"oper_url"`
	OperIP        string     `gorm:"column:oper_ip" json:"oper_ip"`
	OperLocation  string     `gorm:"column:oper_location" json:"oper_location"`
	OperParam     string     `gorm:"column:oper_param" json:"oper_param"`
	JSONResult    string     `gorm:"column:json_result" json:"json_result"`
	Status        int        `gorm:"column:status" json:"status"`
	ErrorMsg      string     `gorm:"column:error_msg" json:"error_msg"`
	OperTime      *time.Time `gorm:"column:oper_time" json:"oper_time,omitempty"`
	CostTime      int64      `gorm:"column:cost_time" json:"cost_time"`
}

func (SysOperLog) TableName() string {
	return tableName("sys_oper_log")
}

type SysDictType struct {
	DictID     int64      `gorm:"column:dict_id;primaryKey;autoIncrement" json:"dict_id"`
	DictName   string     `gorm:"column:dict_name" json:"dict_name"`
	DictType   string     `gorm:"column:dict_type;unique" json:"dict_type"`
	Status     string     `gorm:"column:status" json:"status"`
	CreateBy   string     `gorm:"column:create_by" json:"create_by"`
	CreateTime *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy   string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark     *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysDictType) TableName() string {
	return tableName("sys_dict_type")
}

type SysDictData struct {
	DictCode   int64      `gorm:"column:dict_code;primaryKey;autoIncrement" json:"dict_code"`
	DictSort   int        `gorm:"column:dict_sort" json:"dict_sort"`
	DictLabel  string     `gorm:"column:dict_label" json:"dict_label"`
	DictValue  string     `gorm:"column:dict_value" json:"dict_value"`
	DictType   string     `gorm:"column:dict_type" json:"dict_type"`
	CSSClass   *string    `gorm:"column:css_class" json:"css_class,omitempty"`
	ListClass  *string    `gorm:"column:list_class" json:"list_class,omitempty"`
	IsDefault  string     `gorm:"column:is_default" json:"is_default"`
	Status     string     `gorm:"column:status" json:"status"`
	CreateBy   string     `gorm:"column:create_by" json:"create_by"`
	CreateTime *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy   string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark     *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysDictData) TableName() string {
	return tableName("sys_dict_data")
}

type SysConfig struct {
	ConfigID    int64      `gorm:"column:config_id;primaryKey;autoIncrement" json:"config_id"`
	ConfigName  string     `gorm:"column:config_name" json:"config_name"`
	ConfigKey   string     `gorm:"column:config_key" json:"config_key"`
	ConfigValue string     `gorm:"column:config_value" json:"config_value"`
	ConfigType  string     `gorm:"column:config_type" json:"config_type"`
	CreateBy    string     `gorm:"column:create_by" json:"create_by"`
	CreateTime  *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy    string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime  *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark      *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysConfig) TableName() string {
	return tableName("sys_config")
}

type SysLogininfor struct {
	InfoID        int64      `gorm:"column:info_id;primaryKey;autoIncrement" json:"info_id"`
	UserName      string     `gorm:"column:user_name" json:"user_name"`
	IPAddr        string     `gorm:"column:ipaddr" json:"ipaddr"`
	LoginLocation string     `gorm:"column:login_location" json:"login_location"`
	Browser       string     `gorm:"column:browser" json:"browser"`
	OS            string     `gorm:"column:os" json:"os"`
	Status        string     `gorm:"column:status" json:"status"`
	Msg           string     `gorm:"column:msg" json:"msg"`
	LoginTime     *time.Time `gorm:"column:login_time" json:"login_time,omitempty"`
}

func (SysLogininfor) TableName() string {
	return tableName("sys_logininfor")
}

type SysJob struct {
	JobID          int64      `gorm:"column:job_id;primaryKey;autoIncrement" json:"job_id"`
	JobName        string     `gorm:"column:job_name;primaryKey" json:"job_name"`
	JobGroup       string     `gorm:"column:job_group;primaryKey" json:"job_group"`
	InvokeTarget   string     `gorm:"column:invoke_target" json:"invoke_target"`
	InvokeParams   string     `gorm:"column:invoke_params" json:"invoke_params"`
	CronExpression string     `gorm:"column:cron_expression" json:"cron_expression"`
	MisfirePolicy  string     `gorm:"column:misfire_policy" json:"misfire_policy"`
	Concurrent     string     `gorm:"column:concurrent" json:"concurrent"`
	Status         string     `gorm:"column:status" json:"status"`
	CreateBy       string     `gorm:"column:create_by" json:"create_by"`
	CreateTime     *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy       string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime     *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark         string     `gorm:"column:remark" json:"remark"`
}

func (SysJob) TableName() string {
	return tableName("sys_job")
}

type SysJobLog struct {
	JobLogID      int64      `gorm:"column:job_log_id;primaryKey;autoIncrement" json:"job_log_id"`
	JobID         int64      `gorm:"column:job_id" json:"job_id"`
	JobName       string     `gorm:"column:job_name" json:"job_name"`
	JobGroup      string     `gorm:"column:job_group" json:"job_group"`
	InvokeTarget  string     `gorm:"column:invoke_target" json:"invoke_target"`
	InvokeParams  string     `gorm:"column:invoke_params" json:"invoke_params"`
	JobMessage    *string    `gorm:"column:job_message" json:"job_message,omitempty"`
	Status        string     `gorm:"column:status" json:"status"`
	ExceptionInfo string     `gorm:"column:exception_info" json:"exception_info"`
	CreateTime    *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
}

func (SysJobLog) TableName() string {
	return tableName("sys_job_log")
}

type SysNotice struct {
	NoticeID      int64      `gorm:"column:notice_id;primaryKey;autoIncrement" json:"notice_id"`
	NoticeTitle   string     `gorm:"column:notice_title" json:"notice_title"`
	NoticeType    string     `gorm:"column:notice_type" json:"notice_type"`
	NoticeContent []byte     `gorm:"column:notice_content" json:"notice_content"`
	Status        string     `gorm:"column:status" json:"status"`
	CreateBy      string     `gorm:"column:create_by" json:"create_by"`
	CreateTime    *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy      string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime    *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark        *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (SysNotice) TableName() string {
	return tableName("sys_notice")
}
