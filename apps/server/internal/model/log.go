package model

// SysOperLog 操作日志
type SysOperLog struct {
	BaseModel
	Title         string `gorm:"column:title;type:varchar(255)" json:"title"`
	BusinessType  int    `gorm:"column:business_type;index" json:"business_type"`
	Method        string `gorm:"column:method;type:varchar(255)" json:"method"`
	RequestMethod string `gorm:"column:request_method;type:varchar(10)" json:"request_method"`
	OperatorType  int    `gorm:"column:operator_type" json:"operator_type"`
	OperName      string `gorm:"column:oper_name;type:varchar(64);index" json:"oper_name"`
	DeptName      string `gorm:"column:dept_name;type:varchar(64)" json:"dept_name"`
	OperURL       string `gorm:"column:oper_url;type:varchar(255)" json:"oper_url"`
	OperIP        string `gorm:"column:oper_ip;type:varchar(64)" json:"oper_ip"`
	OperLocation  string `gorm:"column:oper_location;type:varchar(255)" json:"oper_location"`
	OperParam     string `gorm:"column:oper_param;type:jsonb" json:"oper_param"`
	JSONResult    string `gorm:"column:json_result;type:jsonb" json:"json_result"`
	Status        int    `gorm:"column:status;index" json:"status"`
	ErrorMsg      string `gorm:"column:error_msg;type:text" json:"error_msg"`
	CostTime      int64  `gorm:"column:cost_time" json:"cost_time"`
}

func (SysOperLog) TableName() string {
	return tableName("sys_oper_log")
}

// SysLogininfor 登录日志
type SysLogininfor struct {
	BaseModel
	UserName      string `gorm:"column:user_name;type:varchar(64);index" json:"user_name"`
	IPAddr        string `gorm:"column:ipaddr;type:varchar(64)" json:"ipaddr"`
	LoginLocation string `gorm:"column:login_location;type:varchar(255)" json:"login_location"`
	Browser       string `gorm:"column:browser;type:varchar(120)" json:"browser"`
	OS            string `gorm:"column:os;type:varchar(120)" json:"os"`
	Status        string `gorm:"column:status;index" json:"status"`
	Msg           string `gorm:"column:msg;type:varchar(255)" json:"msg"`
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
		TimeColumn: "created_at",
		IDColumn:   "id",
		Columns: []string{
			"id", "title", "business_type", "method", "request_method",
			"operator_type", "oper_name", "dept_name", "oper_url", "oper_ip",
			"oper_location", "oper_param", "json_result", "status", "error_msg",
			"created_at", "cost_time", "updated_at", "deleted_at",
		},
		ColumnsSQL: `
            id             BIGINT GENERATED ALWAYS AS IDENTITY,
            title          VARCHAR(255) NOT NULL DEFAULT '',
            business_type  SMALLINT NOT NULL DEFAULT 0,
            method         VARCHAR(255) NOT NULL DEFAULT '',
            request_method VARCHAR(10) NOT NULL DEFAULT '',
            operator_type  SMALLINT NOT NULL DEFAULT 0,
            oper_name      VARCHAR(64) NOT NULL DEFAULT '',
            dept_name      VARCHAR(64) NOT NULL DEFAULT '',
            oper_url       VARCHAR(255) NOT NULL DEFAULT '',
            oper_ip        VARCHAR(64) NOT NULL DEFAULT '',
            oper_location  VARCHAR(255) NOT NULL DEFAULT '',
            oper_param     JSONB,
            json_result    JSONB,
            status         SMALLINT NOT NULL DEFAULT 0,
            error_msg      TEXT,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            cost_time      BIGINT NOT NULL DEFAULT 0,
            updated_at     TIMESTAMPTZ,
            deleted_at     TIMESTAMPTZ
        `,
		Indexes: []LogIndexSpec{
			{Name: tableName + "_created_at_brin", Using: "BRIN", Columns: []string{"created_at"}},
			{Name: tableName + "_status_business_idx", Columns: []string{"status", "business_type"}},
			{Name: tableName + "_oper_name_idx", Columns: []string{"oper_name"}},
		},
	}
}

func LoginLogTableSpec() LogTableSpec {
	tableName := SysLogininfor{}.TableName()
	return LogTableSpec{
		TableName:  tableName,
		TimeColumn: "created_at",
		IDColumn:   "id",
		Columns: []string{
			"id", "user_name", "ipaddr", "login_location", "browser", "os", "status", "msg", "created_at", "updated_at", "deleted_at",
		},
		ColumnsSQL: `
            id             BIGINT GENERATED ALWAYS AS IDENTITY,
            user_name      VARCHAR(64) NOT NULL DEFAULT '',
            ipaddr         VARCHAR(64) NOT NULL DEFAULT '',
            login_location VARCHAR(255) NOT NULL DEFAULT '',
            browser        VARCHAR(120) NOT NULL DEFAULT '',
            os             VARCHAR(120) NOT NULL DEFAULT '',
            status         SMALLINT NOT NULL DEFAULT 0,
            msg            VARCHAR(255) NOT NULL DEFAULT '',
            created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at     TIMESTAMPTZ,
            deleted_at     TIMESTAMPTZ
        `,
		Indexes: []LogIndexSpec{
			{Name: tableName + "_created_at_brin", Using: "BRIN", Columns: []string{"created_at"}},
			{Name: tableName + "_user_name_idx", Columns: []string{"user_name"}},
			{Name: tableName + "_status_idx", Columns: []string{"status"}},
		},
	}
}
