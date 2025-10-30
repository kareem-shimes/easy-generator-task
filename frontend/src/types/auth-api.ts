/**
 * Type-safe Auth API Response Types
 * Extracted from OpenAPI schema for easier consumption
 */

import type { components, operations } from "./openapi/auth_service.types";

// DTO types
export type SignUpDto = components["schemas"]["SignUpDto"];
export type UpdateUserDto = components["schemas"]["UpdateUserDto"];

// Entity types
export type User = components["schemas"]["UserEntity"];

// Auth response type (used for login, signup, refresh)
export type AuthResponse = components["schemas"]["AuthResponseDto"];

// Extract response types from operations
export type SignUpResponse = operations["AuthController_signUp"]["responses"][201]["content"]["application/json"];
export type SignInResponse = operations["AuthController_signIn"]["responses"][200]["content"]["application/json"];
export type RefreshTokenResponse = operations["AuthController_refresh"]["responses"][200]["content"]["application/json"];
export type LogoutResponse = operations["AuthController_logout"]["responses"][200]["content"]["application/json"];
export type GetUserProfileResponse = operations["UsersController_getProfile"]["responses"][200]["content"]["application/json"];
