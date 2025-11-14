export type CaptchaData = {
  captcha_id: string;
  image: string;
  expires_in: number;
};

export type LoginRequestPayload = {
  username: string;
  password: string;
  captcha: string;
  captcha_id?: string;
};

export type LoginResponseData = {
	session_id?: string;
	access_token?: string;
	refresh_token?: string;
	expires_at?: number;
};

/** —— 严格版：权限/角色使用字面量联合，最安全 —— */
export type Permission = string;

export type Role = 'admin';

export interface User {
  avatar: string;
  deptId: number;
  email: string;
  nickName: string;
  phonenumber: string;
  remark: string;
  /** 常见编码：0=未知/保密, 1=男, 2=女；可按实际约定调整 */
  sex: string;
  /** 常见编码：0=正常, 1=停用；可按实际约定调整 */
  status: string;
  userId: number;
  userName: string;
}

export interface AuthPayload {
  permissions: Permission[];
  roles: Role[];
  user: User;
}

/** —— 可扩展版：便于后续新增权限/角色 —— */
export interface AuthPayloadLoose {
  permissions: string[];
  roles: string[];
  user: User;
}
