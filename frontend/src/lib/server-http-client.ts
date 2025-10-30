import { AUTH_ENDPOINTS, AUTH_NO_RETRY_ENDPOINTS } from "@/constants/auth";
import { cookies } from "next/headers";

/**
 * Server-side HTTP Client with Interceptor Support
 * For use in Next.js Server Actions and Server Components
 */

// Type definitions
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: HeadersInit;
}

export interface RequestInterceptor {
  onFulfilled?: (
    config: RequestInit & { url: string }
  ) => (RequestInit & { url: string }) | Promise<RequestInit & { url: string }>;
  onRejected?: (error: unknown) => never;
}

export interface ResponseInterceptor {
  onFulfilled?: (response: Response) => Response | Promise<Response>;
  onRejected?: (error: unknown) => never;
}

export class ServerHttpClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: HeadersInit;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: HttpClientConfig = {}) {
    this.baseURL =
      config.baseURL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = config.headers || {
      "Content-Type": "application/json",
    };
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get access token from cookies
   */
  private async getAccessToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("access_token")?.value;
  }

  /**
   * Get refresh token from cookies
   */
  private async getRefreshToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("refresh_token")?.value;
  }

  /**
   * Set access token in cookies
   */
  private async setAccessToken(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    });
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(
    config: RequestInit & { url: string }
  ): Promise<RequestInit & { url: string }> {
    let finalConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          finalConfig = await interceptor.onFulfilled(finalConfig);
        } catch (error) {
          if (interceptor.onRejected) {
            throw interceptor.onRejected(error);
          }
          throw error;
        }
      }
    }

    return finalConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let finalResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          finalResponse = await interceptor.onFulfilled(finalResponse);
        } catch (error) {
          if (interceptor.onRejected) {
            throw interceptor.onRejected(error);
          }
          throw error;
        }
      }
    }

    return finalResponse;
  }

  /**
   * Make fetch request with interceptors
   */
  private async fetchWithInterceptors(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Validate URL parameter
    if (!url) {
      throw new Error("URL is required");
    }

    // Prepare initial config
    let config: RequestInit & { url: string } = {
      ...options,
      url: url.startsWith("http") ? url : `${this.baseURL}${url}`,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: "include" as RequestCredentials,
    };

    // Add auth token
    const token = await this.getAccessToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add refresh token to Cookie header for server-to-server requests
    const refreshToken = await this.getRefreshToken();
    if (refreshToken) {
      const existingCookie = (config.headers as Record<string, string>)["Cookie"] || "";
      const cookieValue = existingCookie
        ? `${existingCookie}; refresh_token=${refreshToken}`
        : `refresh_token=${refreshToken}`;
      config.headers = {
        ...config.headers,
        Cookie: cookieValue,
      };
    }

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Make request
      const response = await fetch(config.url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      return await this.applyResponseInterceptors(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Apply error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          throw interceptor.onRejected(error);
        }
      }

      throw error;
    }
  }

  /**
   * Check if URL is an auth endpoint that shouldn't trigger token refresh
   * Uses OpenAPI-derived constants for type safety
   */
  private isAuthEndpoint(url: string): boolean {
    return AUTH_NO_RETRY_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  }

  /**
   * Set refresh token in cookies
   */
  private async setRefreshToken(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  /**
   * Extract and store refresh token from set-cookie header
   */
  private async extractAndStoreRefreshToken(response: Response): Promise<void> {
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const refreshTokenMatch = setCookieHeader.match(/refresh_token=([^;]+)/);
      if (refreshTokenMatch) {
        await this.setRefreshToken(refreshTokenMatch[1]);
      }
    }
  }

  /**
   * Handle 401 errors with token refresh
   */
  private async handleUnauthorized(
    originalUrl: string,
    originalOptions: RequestInit
  ): Promise<Response> {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Attempt to refresh token - backend reads refresh_token from Cookie header
    const refreshResponse = await fetch(
      `${this.baseURL}${AUTH_ENDPOINTS.REFRESH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward refresh_token cookie to backend
          Cookie: `refresh_token=${refreshToken}`,
        },
        credentials: "include" as RequestCredentials,
      }
    );

    if (!refreshResponse.ok) {
      throw new Error("Token refresh failed");
    }

    const { access_token } = await refreshResponse.json();
    await this.setAccessToken(access_token);

    // Extract and set new refresh_token from Set-Cookie header
    await this.extractAndStoreRefreshToken(refreshResponse);

    // Retry original request with new token
    return this.fetchWithInterceptors(originalUrl, originalOptions);
  }

  /**
   * Handle response with error handling and token refresh
   */
  private async handleResponse<T>(
    response: Response,
    url: string,
    options: RequestInit
  ): Promise<T> {
    // Extract and store refresh token from set-cookie header if present
    await this.extractAndStoreRefreshToken(response);

    // Handle 401 (skip token refresh for auth endpoints)
    if (response.status === 401 && !this.isAuthEndpoint(url)) {
      const retryResponse = await this.handleUnauthorized(url, options);
      return retryResponse.json();
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(error.message || "Request failed");
    }

    // Parse response body
    const data = await response.json();

    // Extract and store access token from response body if present
    // This is common for login/register responses
    if (data && typeof data === "object" && "data" in data) {
      const responseData = data.data as Record<string, unknown>;
      if (responseData && "access_token" in responseData) {
        const accessToken = responseData.access_token;
        if (typeof accessToken === "string") {
          await this.setAccessToken(accessToken);
        }
      }
    }

    return data;
  }

  /**
   * GET request
   */
  public async get<T = unknown>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions = { ...options, method: "GET" };
    const response = await this.fetchWithInterceptors(url, requestOptions);
    return this.handleResponse<T>(response, url, requestOptions);
  }

  /**
   * POST request
   */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions = {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    };
    const response = await this.fetchWithInterceptors(url, requestOptions);
    return this.handleResponse<T>(response, url, requestOptions);
  }

  /**
   * PUT request
   */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions = {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    };
    const response = await this.fetchWithInterceptors(url, requestOptions);
    return this.handleResponse<T>(response, url, requestOptions);
  }

  /**
   * PATCH request
   */
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions = {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    };
    const response = await this.fetchWithInterceptors(url, requestOptions);
    return this.handleResponse<T>(response, url, requestOptions);
  }

  /**
   * DELETE request
   */
  public async delete<T = unknown>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions = { ...options, method: "DELETE" };
    const response = await this.fetchWithInterceptors(url, requestOptions);
    return this.handleResponse<T>(response, url, requestOptions);
  }
}

// Create singleton instance
export const serverHttpClient = new ServerHttpClient();

// Add development logging interceptors
if (process.env.NODE_ENV === "development") {
  serverHttpClient.addRequestInterceptor({
    onFulfilled: async (config) => {
      console.log(`[Server HTTP] ${config.method || "GET"} ${config.url}`);
      return config;
    },
  });

  serverHttpClient.addResponseInterceptor({
    onFulfilled: async (response) => {
      console.log(`[Server HTTP] Response ${response.status} ${response.url}`);
      return response;
    },
    onRejected: (error: unknown): never => {
      console.error("[Server HTTP] Error:", error);
      throw error;
    },
  });
}
