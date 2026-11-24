import { apiClient } from './client';
import type { InterviewPlan } from '@/types';

export async function createInterviewPlan(
  resumeId: number,
  jobMatchId: number
): Promise<InterviewPlan> {
  const response = await apiClient.post<InterviewPlan>(
    `/ai/resume/${resumeId}/job-match/${jobMatchId}/interview-plan/`
  );
  return response.data;
}
