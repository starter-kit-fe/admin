package model

import "time"

// SysOperLog 操作日志
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

// SysLogininfor 登录日志
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

// LogIndexSpec describes an index to create for a log table.
type LogIndexSpec struct {
	Name    string
	Columns []string
	Using   string
}

// LogTableSpec captures the schema needed to build or migrate a log table.
type LogTableSpec struct {
	TableName  string
	TimeColumn string
	IDColumn   string
	ColumnsSQL string
	Columns    []string
	Indexes    []LogIndexSpec
}

func OperLogTableSpec() LogTableSpec {
	tableName := SysOperLog{}.TableName()
	return LogTableSpec{
		TableName:  tableName,
		TimeColumn: "oper_time",
		IDColumn:   "oper_id",
		Columns: []string{
			"oper_id",
			"title",
			"business_type",
			"method",
			"request_method",
			"operator_type",
			"oper_name",
			"dept_name",
			"oper_url",
			"oper_ip",
			"oper_location",
			"oper_param",
			"json_result",
			"status",
			"error_msg",
			"oper_time",
			"cost_time",
		},
		ColumnsSQL: `
            oper_id        BIGINT GENERATED ALWAYS AS IDENTITY,
            title          VARCHAR(96) NOT NULL DEFAULT '',
            business_type  SMALLINT NOT NULL DEFAULT 0,
            method         VARCHAR(200) NOT NULL DEFAULT '',
            request_method VARCHAR(10) NOT NULL DEFAULT '',
            operator_type  SMALLINT NOT NULL DEFAULT 0,
            oper_name      VARCHAR(64) NOT NULL DEFAULT '',
            dept_name      VARCHAR(64) NOT NULL DEFAULT '',
            oper_url       VARCHAR(255) NOT NULL DEFAULT '',
            oper_ip        VARCHAR(64) NOT NULL DEFAULT '',
            oper_location  VARCHAR(255) NOT NULL DEFAULT '',
            oper_param     TEXT,
            json_result    TEXT,
            status         SMALLINT NOT NULL DEFAULT 0,
            error_msg      TEXT,
            oper_time      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            cost_time      BIGINT NOT NULL DEFAULT 0
        `,
		Indexes: []LogIndexSpec{
			{Name: tableName + "_oper_time_brin", Using: "BRIN", Columns: []string{"oper_time"}},
			{Name: tableName + "_status_business_idx", Columns: []string{"status", "business_type"}},
			{Name: tableName + "_oper_name_idx", Columns: []string{"oper_name"}},
		},
	}
}

func LoginLogTableSpec() LogTableSpec {
	tableName := SysLogininfor{}.TableName()
	return LogTableSpec{
		TableName:  tableName,
		TimeColumn: "login_time",
		IDColumn:   "info_id",
		Columns: []string{
			"info_id",
			"user_name",
			"ipaddr",
			"login_location",
			"browser",
			"os",
			"status",
			"msg",
			"login_time",
		},
		ColumnsSQL: `
            info_id        BIGINT GENERATED ALWAYS AS IDENTITY,
            user_name      VARCHAR(64) NOT NULL DEFAULT '',
            ipaddr         VARCHAR(64) NOT NULL DEFAULT '',
            login_location VARCHAR(255) NOT NULL DEFAULT '',
            browser        VARCHAR(120) NOT NULL DEFAULT '',
            os             VARCHAR(120) NOT NULL DEFAULT '',
            status         SMALLINT NOT NULL DEFAULT 0,
            msg            VARCHAR(255) NOT NULL DEFAULT '',
            login_time     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        `,
		Indexes: []LogIndexSpec{
			{Name: tableName + "_login_time_brin", Using: "BRIN", Columns: []string{"login_time"}},
			{Name: tableName + "_user_name_idx", Columns: []string{"user_name"}},
			{Name: tableName + "_status_idx", Columns: []string{"status"}},
		},
	}
}
