import { apiClient } from './client';
import type { DashboardResponse } from '@/types';

export async function getDashboardData(): Promise<DashboardResponse> {
  const response = await apiClient.get<DashboardResponse>('/resume/dashboard/');
  return response.data;
}
