export interface OnlineUser {
  infoId?: number | null;
  tokenId?: string | null;
  sessionId?: string | null;
  uuid?: string | null;
  userName: string;
  nickName?: string | null;
  deptName?: string | null;
  ipaddr?: string | null;
  loginLocation?: string | null;
  browser?: string | null;
  os?: string | null;
  status?: string | null;
  msg?: string | null;
  loginTime?: string | null;
  lastAccessTime?: string | null;
}

export interface OnlineUserListResponse {
  items: OnlineUser[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}

export function isOnlineUserListResponse(
  data: OnlineUserListResponse | OnlineUser[] | undefined,
): data is OnlineUserListResponse {
  return Boolean(data) && !Array.isArray(data) && Array.isArray((data as OnlineUserListResponse).items);
}
