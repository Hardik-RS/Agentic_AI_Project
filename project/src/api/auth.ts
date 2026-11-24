import { apiClient } from './client';
import type { AuthResponse, User } from '@/types';
import {
  setTokens,
  saveUser,
  clearTokens,
  getStoredUser,
  getAccessToken,
  parseAuthResponse,
} from '@/utils/auth';

export async function register(
  email: string,
  password: string,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<{ user: User | null; tokens: boolean }> {
  const payload: Record<string, string> = {
    email,
    password,
  };
  if (username) payload.username = username;
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;

  const response = await apiClient.post<AuthResponse>('/auth/register/', payload);
  const data = response.data as Record<string, unknown>;
  const { tokens, user } = parseAuthResponse(data);

  if (tokens) {
    setTokens(tokens.access, tokens.refresh);
    if (user) saveUser(user);
  }

  return { user: user || null, tokens: !!tokens };
}

export async function login(
  username: string,
  password: string
): Promise<{ user: User | null; tokens: boolean }> {
  const response = await apiClient.post<AuthResponse>('/auth/login/', {
    username,
    password,
  });
  const data = response.data as Record<string, unknown>;
  const { tokens, user } = parseAuthResponse(data);

  if (tokens) {
    setTokens(tokens.access, tokens.refresh);
    if (user) saveUser(user);
  }

  return { user: user || null, tokens: !!tokens };
}

export async function getProfile(): Promise<User> {
  const response = await apiClient.get<User>('/auth/profile/');
  const user = response.data as User;
  saveUser(user);
  return user;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.post('/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
}

export async function requestPasswordReset(
  username: string,
  email: string
): Promise<void> {
  await apiClient.post('/auth/password-reset/request/', { username, email });
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<string> {
  const response = await apiClient.post<{ reset_token: string }>(
    '/auth/password-reset/verify/',
    { email, otp }
  );
  return response.data.reset_token;
}

export async function completePasswordReset(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<void> {
  await apiClient.post('/auth/password-reset/complete/', {
    email,
    reset_token: resetToken,
    new_password: newPassword,
  });
}

export function logout(): void {
  clearTokens();
}

export function getCurrentUser(): User | null {
  return getStoredUser();
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
