import http from '@/lib/request';

import type {
  CaptchaData,
  CaptchaDto,
  LoginRequestPayload,
  LoginResponseData,
  LoginResult,
} from './type';

const DEFAULT_CAPTCHA_EXPIRES = 120;
const DEFAULT_LOGIN_SUCCESS_MESSAGE = '登录成功';

function isCaptchaDto(payload: unknown): payload is CaptchaDto {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'captcha_id' in payload
  );
}

function normalizeCaptcha(source: unknown): CaptchaData {
  if (isCaptchaDto(source)) {
    return {
      id: source.captcha_id ?? '',
      image: source.image ?? '',
      expiresIn: source.expires_in ?? DEFAULT_CAPTCHA_EXPIRES,
    };
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'id' in source &&
    'image' in source
  ) {
    const typed = source as CaptchaData;
    return {
      id: typed.id ?? '',
      image: typed.image ?? '',
      expiresIn: typed.expiresIn ?? DEFAULT_CAPTCHA_EXPIRES,
    };
  }

  return { id: '', image: '', expiresIn: DEFAULT_CAPTCHA_EXPIRES };
}

export async function fetchCaptcha(): Promise<CaptchaData> {
  const payload = await http.get<CaptchaDto | CaptchaData | null>(
    '/v1/auth/captcha',
  );
  const captcha = normalizeCaptcha(payload);

  if (!captcha.id) {
    throw new Error('获取验证码失败');
  }

  return captcha;
}

export async function login(
  payload: LoginRequestPayload,
): Promise<LoginResult> {
  const response = await http.request<LoginResponseData | null>(
    '/v1/auth/login',
    {
      method: 'POST',
      data: payload,
    },
  );

  const token = response.data?.token;

  if (!token) {
    throw new Error(response.msg ?? '登录失败，请稍后重试');
  }

  return {
    token,
    message: response.msg ?? DEFAULT_LOGIN_SUCCESS_MESSAGE,
  };
}
