export type NoticeType = '1' | '2';
export type NoticeStatus = '0' | '1';

export interface Notice {
  id: number;
  noticeTitle: string;
  noticeType: NoticeType;
  noticeContent: string;
  status: NoticeStatus;
  remark?: string | null;
  createBy?: string;
  createdAt?: string;
  updateBy?: string;
  updatedAt?: string | null;
}

export interface NoticeFormValues {
  noticeTitle: string;
  noticeType: NoticeType;
  noticeContent: string;
  status: NoticeStatus;
  remark: string;
}
