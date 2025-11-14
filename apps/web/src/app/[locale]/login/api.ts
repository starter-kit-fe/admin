import { get, post } from '@/lib/request';

import type {
  AuthPayloadLoose,
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
  return get<AuthPayloadLoose>('/v1/auth/me');
}

export function logout() {
  return post<boolean>('/v1/auth/logout');
}
