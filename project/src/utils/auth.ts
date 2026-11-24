import type {
  AuthTokens,
  User,
  Resume,
  ResumeAnalysis,
  ResumeProcessResponse,
  JobMatchRequest,
  JobMatchResult,
  InterviewPlan,
  MockInterviewStartRequest,
  MockInterview,
  AnswerResponse,
  InterviewResult,
} from '@/types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'resumeai_access_token';
const REFRESH_TOKEN_KEY = 'resumeai_refresh_token';
const USER_KEY = 'resumeai_user';
const LATEST_RESUME_RESULT_KEY = 'resumeai_latest_resume_result';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LATEST_RESUME_RESULT_KEY);
}

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function extractTokens(data: Record<string, unknown>): AuthTokens | null {
  const access =
    (data.access as string) ||
    (data.access_token as string) ||
    (data.token as string) ||
    null;
  const refresh =
    (data.refresh as string) ||
    (data.refresh_token as string) ||
    null;
  if (access) {
    return { access, refresh: refresh || '' };
  }
  return null;
}

// Helper to safely parse response data — extracts tokens, user, IDs etc.
export function parseAuthResponse(data: Record<string, unknown>): {
  tokens: AuthTokens | null;
  user: User | null;
} {
  const tokens = extractTokens(data);
  const user = (data.user as User) || null;
  return { tokens, user };
}

// Re-export types for convenience
export type {
  AuthTokens,
  User,
  Resume,
  ResumeAnalysis,
  ResumeProcessResponse,
  JobMatchRequest,
  JobMatchResult,
  InterviewPlan,
  MockInterviewStartRequest,
  MockInterview,
  AnswerResponse,
  InterviewResult,
};
