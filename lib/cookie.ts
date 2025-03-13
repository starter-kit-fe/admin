import Cookies from 'js-cookie';
import { USER_TOKEN_KEY, USER_VISITOR_KEY } from './constant';
export const getToken = () => {
  return Cookies.get(USER_TOKEN_KEY);
};
export const setToken = (token: string) => {
  Cookies.set(USER_TOKEN_KEY, token);
};
export const removeToken = () => {
  Cookies.remove(USER_TOKEN_KEY);
};
export const setVisitor = (fingerprint: string) => {
  Cookies.set(USER_VISITOR_KEY, fingerprint);
};
export const getVisitor = () => {
  return Cookies.get(USER_VISITOR_KEY);
};
export const removeVisitor = () => {
  Cookies.remove(USER_VISITOR_KEY);
};
