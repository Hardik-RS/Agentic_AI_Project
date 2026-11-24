import { apiClient } from './client';
import type {
  ResumeUploadResponse,
  ResumeProcessResponse,
} from '@/types';

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append('resume_file', file);

  const response = await apiClient.post<ResumeUploadResponse>('/resume/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function processResume(resumeId: number): Promise<ResumeProcessResponse> {
  const response = await apiClient.post<ResumeProcessResponse>(
    `/ai/resume-process/${resumeId}/`
  );
  return response.data;
}
