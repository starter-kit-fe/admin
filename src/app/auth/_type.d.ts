export declare namespace IUser {
  type asObject = {
    age: number;
    avatar: string;
    birthday: null;
    createdAt: string;
    email: string;
    gender: number;
    id: number;
    nickName: string;
    phone: string;
    roles: string[];
    updatedAt: string;
  };
  type signinParams = {
    email: string;
    password: string;
    token: string;
  };
  type signupParams = {
    email: string;
    password: string;
    token: string;
    code: string;
  };
  type postCodeParams = {
    email: string;
    token: string;
  };
  type userInfoResp = asObject;
}
