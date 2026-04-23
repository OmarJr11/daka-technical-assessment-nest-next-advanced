type AuthUser = {
    id: number;
    username: string;
};

type ServiceResult<TData> = {
    isSuccess: boolean;
    data: TData | null;
    errorMessage: string;
};

type ApiErrorResponse = {
    message?: string | string[];
};

type AuthResponse = {
    accessToken: string;
    user: AuthUser;
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

type LogoutResponse = {
    message: string;
};
  
const API_BASE_URL: string =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  
/**
 * Sends an HTTP request to auth endpoints.
 * @param {string} endpoint - API endpoint path
 * @param {"GET" | "POST"} method - HTTP method
 * @param {unknown} payload - Request body payload
 * @param {string} defaultErrorMessage - Default error message
 * @returns {Promise<ServiceResult<TResponse>>} Normalized response
 */
async function sendAuthRequest<TResponse>(
    endpoint: string,
    method: "GET" | "POST",
    payload: unknown,
    defaultErrorMessage: string,
): Promise<ServiceResult<TResponse>> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: payload ? JSON.stringify(payload) : undefined,
        });
    } catch {
        return {
            isSuccess: false,
            data: null,
            errorMessage: "Cannot reach the server. Please try again.",
        };
    }
    if (!response.ok) {
        const errorBody: ApiErrorResponse = (await response
        .json()
        .catch(() => ({ message: defaultErrorMessage }))) as ApiErrorResponse;
        const errorMessage: string = Array.isArray(errorBody.message)
            ? errorBody.message.join(", ")
            : (errorBody.message ?? defaultErrorMessage);
        return { isSuccess: false, data: null, errorMessage };
    }
    const data: TResponse = (await response.json()) as TResponse;
    return { isSuccess: true, data, errorMessage: "" };
}

/**
 * Handles auth API requests.
 */
const authService = {
    /**
     * Logs in a user.
     * @param {LoginInput} input - Login credentials
     * @returns {Promise<ServiceResult<AuthResponse>>} Login result
     */
    login(input: LoginInput): Promise<ServiceResult<AuthResponse>> {
        return sendAuthRequest<AuthResponse>(
            "/auth/login",
            "POST",
            input,
            "Login failed. Please try again.",
        );
    },

    /**
     * Registers a user.
     * @param {RegisterInput} input - Register payload
     * @returns {Promise<ServiceResult<AuthUser>>} Register result
     */
    register(input: RegisterInput): Promise<ServiceResult<AuthUser>> {
        return sendAuthRequest<AuthUser>(
                "/auth/register",
                "POST",
                input,
                "Registration failed. Please try again.",
            );
    },

    /**
     * Gets current authenticated user from session cookie.
     * @returns {Promise<ServiceResult<AuthUser>>} Current user result
     */
    me(): Promise<ServiceResult<AuthUser>> {
        return sendAuthRequest<AuthUser>(
            "/auth/me",
            "GET",
            null,
            "Session is not valid.",
        );
    },

    /**
     * Logs out the current user and clears auth cookie.
     * @returns {Promise<ServiceResult<LogoutResponse>>} Logout result
     */
    logout(): Promise<ServiceResult<LogoutResponse>> {
        return sendAuthRequest<LogoutResponse>(
            "/auth/logout",
            "POST",
            null,
            "Logout failed. Please try again.",
        );
    },
};

export default authService;