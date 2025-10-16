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
  data: boolean;
};

export type User = {
  name: string;
};
