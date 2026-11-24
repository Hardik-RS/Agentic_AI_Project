import { apiClient } from './client';
import type { SavedInterviewPlan } from '@/types';

export async function getInterviewPlanHistory(): Promise<SavedInterviewPlan[]> {
  const response = await apiClient.get<SavedInterviewPlan[]>('/ai/interview-plans/');
  return response.data;
}
