import { request } from '@/lib/request';
import type { RequestOptions } from '@/lib/request';
import { IUser } from './_type';

// 指纹登录
// GET / visitor
// 接口ID：144790851
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-144790851
export const getVisitor = () => {
  return request<string>('/visitor', {
    method: 'GET',
  });
};

// 获取用户信息
//   GET /userinfo
//   接口ID：137769255
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-137769255
export const getUserInfo = (options: RequestOptions = {}) => {
  return request<IUser.userInfoResp>('/user/info', {
    method: 'GET',
    ...options,
  });
};

// google登录
// GET /google/{access_token}
// 接口ID：182951248
// 接口地址：https://www.apifox.cn/link/project/3200371/apis/api-182951248
export const getGoogleAuth = (access_token: string) => {
  return request<string>(`/google/${access_token}`, {
    method: 'GET',
  });
};

// 检查邮箱可用性
// GET /checkemailexists/{email}
// 接口ID：186843021
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-186843021
export const getCheckEmailExists = (email: string) => {
  return request<boolean>(`/email/isexists/${email}`, {
    method: 'GET',
  });
};

// 登录
// POST /signin
// 接口ID：137769394
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-137769394
export const postsignin = (data: IUser.signinParams) => {
  return request<string>(`/signin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 密码注册
// POST / signup
// 接口ID：187631121
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-187631121
export const postSignup = (data: IUser.signupParams) => {
  return request<string>(`/signup`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
// 登出
// GET / user / signout
// 接口ID：231682591
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-231682591
export const getSignout = () => {
  return request<string>(`/user/signout`, {
    method: 'GET',
  });
};

// 发送邮箱验证码
// GET /code/{email}
// 接口ID：187351020
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-187351020
export const postCode = (data: IUser.postCodeParams) => {
  return request<string>(`/email/code`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
