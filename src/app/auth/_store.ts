import { create } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';
import { IUser } from './_type';
const STORAGE_KEY = 'auth-storage';
export enum AuthStep {
  Email,
  Password,
  Register,
}
interface AuthParams {
  email: string;
  isExists: boolean;
  password: string;
  code?: string;
  token: string;
}

interface AuthState {
  token: string | null;
  user: IUser.asObject | null;
  currentStep: AuthStep;
  authParams: AuthParams | null;
  setUser: (user: IUser.asObject) => void;
  removeUser: () => void;
  setToken: (token: string) => void;
  removeToken: () => void;
  setParams: (data: Partial<AuthParams>) => void;
  setStep: (step: AuthStep) => void;
  removeParams: () => void;
}

const createAuthStore = (
  set: (fn: (state: AuthState) => Partial<AuthState>) => void
): AuthState => ({
  currentStep: AuthStep.Email,
  authParams: null,
  token: null,
  user: null,
  setParams: (newParams) =>
    set((state) => ({
      authParams: { ...state.authParams, ...newParams } as AuthParams,
    })),
  setStep: (step) => set(() => ({ currentStep: step })),
  removeParams: () => set(() => ({ authParams: null })),
  setUser: (user) => set(() => ({ user })),
  removeUser: () => set(() => ({ user: null })),
  setToken: (token) => set(() => ({ token })),
  removeToken: () => set(() => ({ token: null })),
});

const persistOptions: PersistOptions<AuthState> = {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => sessionStorage),
};

export const useAuthStore = create<AuthState>()(
  persist(createAuthStore, persistOptions)
);
