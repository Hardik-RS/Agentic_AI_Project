import { apiClient } from './client';
import type { JobMatchRequest, JobMatchResult, SavedJobMatch } from '@/types';

export async function jobMatch(
  resumeId: number,
  data: JobMatchRequest
): Promise<JobMatchResult> {
  const response = await apiClient.post<JobMatchResult>(
    `/ai/resume/${resumeId}/job-match/`,
    data
  );
  return response.data;
}

export async function getJobMatchHistory(): Promise<SavedJobMatch[]> {
  const response = await apiClient.get<SavedJobMatch[]>('/ai/job-matches/');
  return response.data;
}
