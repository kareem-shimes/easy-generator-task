/**
 * Application route paths
 */

// Public routes
export const PUBLIC_ROUTES = {
  ABOUT: "/about",
  CONTACT: "/contact",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  FAQ: "/faq",
} as const;

// Auth routes (already in auth.ts but consolidated here for clarity)
export const AUTH_APP_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
} as const;

// Protected routes
export const PROTECTED_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;
