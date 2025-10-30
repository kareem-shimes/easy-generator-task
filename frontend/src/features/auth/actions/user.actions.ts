"use server";

import { serverHttpClient } from "@/lib/server-http-client";
import { USER_ENDPOINTS } from "@/constants/auth";
import type { GetUserProfileResponse } from "@/types/auth-api";

export async function getCurrentUserAction() {
  try {
    const response = await serverHttpClient.get<GetUserProfileResponse>(
      USER_ENDPOINTS.ME
    );

    return {
      success: response.success,
      user: response.data,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user data";
    return {
      success: false as const,
      error: message,
      user: null,
    };
  }
}
