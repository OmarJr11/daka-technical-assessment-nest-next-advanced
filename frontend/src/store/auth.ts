import { create } from "zustand";
import authService from "@/lib/auth-service";

type AuthUser = {
    id: number;
    username: string;
};

type AuthResult = {
    isSuccess: boolean;
    errorMessage: string;
};

type LoginInput = {
    username: string;
    password: string;
};

type RegisterInput = {
    username: string;
    password: string;
    confirmPassword: string;
};

type AuthState = {
    user: AuthUser | null;
    isLoading: boolean;
    isInitialized: boolean;
    initializeSession: () => Promise<void>;
    login: (input: LoginInput) => Promise<AuthResult>;
    register: (input: RegisterInput) => Promise<AuthResult>;
    logout: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    isInitialized: false,

    initializeSession: async (): Promise<void> => {
        set({ isLoading: true });
        const response = await authService.me();
        if (response.isSuccess && response.data) {
            set({
                user: response.data,
                isLoading: false,
                isInitialized: true,
            });
            return;
        }
        set({
            user: null,
            isLoading: false,
            isInitialized: true,
        });
    },

    login: async (input: LoginInput): Promise<AuthResult> => {
        set({ isLoading: true });
        const loginResponse = await authService.login(input);
        if (!loginResponse.isSuccess) {
            set({ isLoading: false });
            return {
                isSuccess: false,
                errorMessage: loginResponse.errorMessage,
            };
        }
        const meResponse = await authService.me();
        if (!meResponse.isSuccess || !meResponse.data) {
            set({ isLoading: false, user: null });
            return {
                isSuccess: false,
                errorMessage: "Login succeeded but session could not be loaded.",
            };
        }
        set({
            user: meResponse.data,
            isLoading: false,
            isInitialized: true,
        });
        return { isSuccess: true, errorMessage: "" };
    },

    register: async (input: RegisterInput): Promise<AuthResult> => {
        set({ isLoading: true });
        const registerResponse = await authService.register(input);
        set({ isLoading: false });
        if (!registerResponse.isSuccess) {
            return {
                isSuccess: false,
                errorMessage: registerResponse.errorMessage,
            };
        }
        return { isSuccess: true, errorMessage: "" };
    },

    logout: async (): Promise<void> => {
        await authService.logout();
        set({
            user: null,
            isInitialized: true,
            isLoading: false,
        });
    },
}));

export default useAuthStore;