export type NoticeType = '1' | '2';
export type NoticeStatus = '0' | '1';

export interface Notice {
  noticeId: number;
  noticeTitle: string;
  noticeType: NoticeType;
  noticeContent: string;
  status: NoticeStatus;
  remark?: string | null;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string | null;
}

export interface NoticeFormValues {
  noticeTitle: string;
  noticeType: NoticeType;
  noticeContent: string;
  status: NoticeStatus;
  remark: string;
}
