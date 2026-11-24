import type { ResumeProcessResponse } from '@/types';

const LATEST_RESUME_RESULT_KEY = 'resumeai_latest_resume_result';

export interface StoredResumeResult {
  resumeId: number;
  result: ResumeProcessResponse;
}

export function saveLatestResumeResult(resumeId: number, result: ResumeProcessResponse): void {
  localStorage.setItem(
    LATEST_RESUME_RESULT_KEY,
    JSON.stringify({ resumeId, result } satisfies StoredResumeResult)
  );
}

export function getLatestResumeResult(): StoredResumeResult | null {
  const raw = localStorage.getItem(LATEST_RESUME_RESULT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredResumeResult;
    return typeof parsed.resumeId === 'number' && parsed.result != null ? parsed : null;
  } catch {
    return null;
  }
}
