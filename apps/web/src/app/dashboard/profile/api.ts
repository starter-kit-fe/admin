import { get, post, put } from '@/lib/request';
import type { OnlineUserListResponse } from '../monitor/online/type';

export type ProfileData = {
  userId: number;
  userName: string;
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string;
  remark?: string | null;
  avatar?: string;
  loginIp?: string | null;
  loginDate?: string | null;
  pwdUpdateDate?: string | null;
};

export type UpdateProfilePayload = {
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string;
  remark?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export function getProfile() {
  return get<ProfileData>('/v1/profile');
}

export function updateProfile(payload: UpdateProfilePayload) {
  return put<ProfileData>('/v1/profile', payload);
}

export function changePassword(payload: ChangePasswordPayload) {
  return put<unknown>('/v1/profile/password', payload);
}

export function listSelfSessions() {
  return get<OnlineUserListResponse>('/v1/profile/sessions');
}

export function forceLogoutSelfSession(sessionId: string) {
  const identifier = encodeURIComponent(sessionId.trim());
  return post(`/v1/profile/sessions/${identifier}/force-logout`);
}
