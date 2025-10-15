package model

import "time"

type GenTable struct {
	TableID        int64      `gorm:"column:table_id;primaryKey;autoIncrement" json:"table_id"`
	Name           string     `gorm:"column:table_name" json:"table_name"`
	TableComment   string     `gorm:"column:table_comment" json:"table_comment"`
	SubTableName   *string    `gorm:"column:sub_table_name" json:"sub_table_name,omitempty"`
	SubTableFKName *string    `gorm:"column:sub_table_fk_name" json:"sub_table_fk_name,omitempty"`
	ClassName      string     `gorm:"column:class_name" json:"class_name"`
	TplCategory    string     `gorm:"column:tpl_category" json:"tpl_category"`
	TplWebType     string     `gorm:"column:tpl_web_type" json:"tpl_web_type"`
	PackageName    *string    `gorm:"column:package_name" json:"package_name,omitempty"`
	ModuleName     *string    `gorm:"column:module_name" json:"module_name,omitempty"`
	BusinessName   *string    `gorm:"column:business_name" json:"business_name,omitempty"`
	FunctionName   *string    `gorm:"column:function_name" json:"function_name,omitempty"`
	FunctionAuthor *string    `gorm:"column:function_author" json:"function_author,omitempty"`
	GenType        string     `gorm:"column:gen_type" json:"gen_type"`
	GenPath        string     `gorm:"column:gen_path" json:"gen_path"`
	Options        *string    `gorm:"column:options" json:"options,omitempty"`
	CreateBy       string     `gorm:"column:create_by" json:"create_by"`
	CreateTime     *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy       string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime     *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
	Remark         *string    `gorm:"column:remark" json:"remark,omitempty"`
}

func (GenTable) TableName() string {
	return tableName("gen_table")
}

type GenTableColumn struct {
	ColumnID      int64      `gorm:"column:column_id;primaryKey;autoIncrement" json:"column_id"`
	TableID       int64      `gorm:"column:table_id" json:"table_id"`
	ColumnName    string     `gorm:"column:column_name" json:"column_name"`
	ColumnComment *string    `gorm:"column:column_comment" json:"column_comment,omitempty"`
	ColumnType    *string    `gorm:"column:column_type" json:"column_type,omitempty"`
	JavaType      *string    `gorm:"column:java_type" json:"java_type,omitempty"`
	JavaField     *string    `gorm:"column:java_field" json:"java_field,omitempty"`
	IsPK          string     `gorm:"column:is_pk" json:"is_pk"`
	IsIncrement   string     `gorm:"column:is_increment" json:"is_increment"`
	IsRequired    string     `gorm:"column:is_required" json:"is_required"`
	IsInsert      string     `gorm:"column:is_insert" json:"is_insert"`
	IsEdit        string     `gorm:"column:is_edit" json:"is_edit"`
	IsList        string     `gorm:"column:is_list" json:"is_list"`
	IsQuery       string     `gorm:"column:is_query" json:"is_query"`
	QueryType     string     `gorm:"column:query_type" json:"query_type"`
	HTMLType      *string    `gorm:"column:html_type" json:"html_type,omitempty"`
	DictType      string     `gorm:"column:dict_type" json:"dict_type"`
	Sort          int        `gorm:"column:sort" json:"sort"`
	CreateBy      string     `gorm:"column:create_by" json:"create_by"`
	CreateTime    *time.Time `gorm:"column:create_time" json:"create_time,omitempty"`
	UpdateBy      string     `gorm:"column:update_by" json:"update_by"`
	UpdateTime    *time.Time `gorm:"column:update_time" json:"update_time,omitempty"`
}

func (GenTableColumn) TableName() string {
	return tableName("gen_table_column")
}
