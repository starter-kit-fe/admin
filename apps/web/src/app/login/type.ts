export type CaptchaDto = {
  captcha_id: string;
  image: string;
  expires_in: number;
};

export type CaptchaData = {
  id: string;
  image: string;
  expiresIn: number;
};

export type LoginRequestPayload = {
  username: string;
  password: string;
  captcha: string;
  captcha_id?: string;
};

export type LoginResponseData = {
  token: string;
};

export type LoginResult = {
  token: string;
  message: string;
};
