import { get, post } from '@/lib/request';

import type {
  CaptchaData,
  LoginRequestPayload,
  LoginResponseData,
} from './type';

export function login(payload: LoginRequestPayload) {
  return post<LoginResponseData>('/v1/auth/login', payload);
}

export function getCaptcha() {
  return get<CaptchaData>('/v1/auth/captcha');
}

export function getUserInfo() {
  return get<CaptchaData>('/v1/auth/me');
}
