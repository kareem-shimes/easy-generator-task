"use server";

import { redirect } from "next/navigation";
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
} from "@/validators/auth";
import {
  SignInResponse,
  SignUpResponse,
  LogoutResponse,
} from "@/types/auth-api";
import { AUTH_ENDPOINTS } from "@/constants/auth";
import { AUTH_APP_ROUTES } from "@/constants/routes";
import { serverHttpClient } from "@/lib/server-http-client";

export async function loginAction(data: LoginInput) {
  try {
    // Validate input with Zod
    const validated = loginSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    // Use ServerHttpClient - it automatically handles refresh token from set-cookie
    const response = await serverHttpClient.post<SignInResponse>(
      AUTH_ENDPOINTS.LOGIN,
      {
        email: validated.data.email,
        password: validated.data.password,
      }
    );

    return {
      success: response.success,
      user: response.data?.user,
      message: response.message,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return {
      success: false,
      error: message,
    };
  }
}

export async function registerAction(data: RegisterInput) {
  try {
    const validated = registerSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    // Use ServerHttpClient - it automatically handles refresh token from set-cookie
    const response = await serverHttpClient.post<SignUpResponse>(
      AUTH_ENDPOINTS.REGISTER,
      {
        name: validated.data.name,
        email: validated.data.email,
        password: validated.data.password,
      }
    );

    return {
      success: response.success,
      user: response.data?.user,
      message: response.message,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return {
      success: false,
      error: message,
    };
  }
}

export async function logoutAction() {
  const { cookies } = await import("next/headers");

  try {
    // Call logout endpoint on backend (requires refresh_token cookie)
    await serverHttpClient.post<LogoutResponse>(AUTH_ENDPOINTS.LOGOUT);

    // Clear authentication cookies
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  } catch (error: unknown) {
    // Log error but still proceed with logout
    console.error("Logout error:", error);

    // Clear cookies even if backend call fails
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  }

  // Redirect to login after logout
  redirect(AUTH_APP_ROUTES.LOGIN);
}
