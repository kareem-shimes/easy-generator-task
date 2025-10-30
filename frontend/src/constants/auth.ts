/**
 * Authentication related constants
 * Dynamically extracted from OpenAPI schema
 */

import type { paths } from "../types/openapi/auth_service.types";

// Extract all auth endpoint paths from OpenAPI schema
export type AuthEndpointPath = Extract<
  keyof paths,
  `/auth/${string}`
>;

// Extract all user endpoint paths from OpenAPI schema
export type UserEndpointPath = Extract<
  keyof paths,
  `/users/${string}`
>;

// Add /api prefix to OpenAPI paths for actual API calls
type WithApiPrefix<T extends string> = `/api${T}`;

// Storage keys
export const AUTH_TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_KEY = "user_data";

// API endpoints (dynamically typed from OpenAPI schema)
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/signin" as WithApiPrefix<AuthEndpointPath>,
  REGISTER: "/api/auth/signup" as WithApiPrefix<AuthEndpointPath>,
  LOGOUT: "/api/auth/logout" as WithApiPrefix<AuthEndpointPath>,
  REFRESH: "/api/auth/refresh" as WithApiPrefix<AuthEndpointPath>,
} as const;

/**
 * Auth endpoints that should NOT trigger automatic token refresh on 401
 * These are public endpoints or token-related endpoints
 */
export const AUTH_NO_RETRY_ENDPOINTS: readonly string[] = [
  AUTH_ENDPOINTS.LOGIN,
  AUTH_ENDPOINTS.REGISTER,
  AUTH_ENDPOINTS.REFRESH,
] as const;

// User endpoints (dynamically typed from OpenAPI schema)
export const USER_ENDPOINTS = {
  ME: "/api/users/me" as WithApiPrefix<UserEndpointPath>,
} as const;

// Token expiry
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;
