import { create } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';
import type { userInfoResponse } from './api'
import { getSignout } from '@/api'
import { removeToken, removeVisitor } from '@/lib/cookie'
const STORAGE_KEY = 'auth-storage';
export const enum AuthStep {
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

interface State {
    user: userInfoResponse | null;
    currentStep: AuthStep;
    authParams: AuthParams | null;
    setUser: (user: userInfoResponse) => void;
    removeUser: () => void;
    setParams: (data: Partial<AuthParams>) => void;
    setStep: (step: AuthStep) => void;
    removeParams: () => void;
    logout: () => void
}

const createStore = (
    set: (fn: (state: State) => Partial<State>) => void
): State => ({
    currentStep: AuthStep.Email,
    authParams: null,
    user: null,
    setParams: (newParams) =>
        set((state) => ({
            authParams: { ...state.authParams, ...newParams } as AuthParams,
        })),
    setStep: (step) => set(() => ({ currentStep: step })),
    removeParams: () => set(() => ({ authParams: null })),
    setUser: (user) => set(() => ({ user })),
    removeUser: () => set(() => ({ user: null })),
    logout: () => {
        set((state) => ({ currentStep: AuthStep.Email }));
        set((state) => {
            getSignout()
            state.removeParams();
            state.removeUser();
            removeToken()
            removeVisitor()
            sessionStorage.clear()
            return {};
        });
    }
});

const persistOptions: PersistOptions<State> = {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => sessionStorage),
};

export const useStore = create<State>()(
    persist(createStore, persistOptions)
);
