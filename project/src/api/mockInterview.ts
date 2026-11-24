import { apiClient } from './client';
import type {
  MockInterviewStartRequest,
  MockInterview,
  AnswerResponse,
  InterviewResult,
  MockInterviewHistoryResponse,
} from '@/types';

export async function getMockInterviews(): Promise<MockInterviewHistoryResponse> {
  const response = await apiClient.get<MockInterviewHistoryResponse>(
    '/ai/mock-interviews/'
  );
  return response.data;
}

export async function startMockInterview(
  resumeId: number,
  data: MockInterviewStartRequest
): Promise<MockInterview> {
  const response = await apiClient.post<MockInterview>(
    `/ai/resume/${resumeId}/mock-interview/start/`,
    data
  );
  return response.data;
}

export async function getInterviewState(interviewId: number): Promise<MockInterview> {
  const response = await apiClient.get<MockInterview>(
    `/ai/mock-interview/${interviewId}/`
  );
  return response.data;
}

export async function submitAnswer(
  interviewId: number,
  questionNumber: number,
  answerText: string
): Promise<AnswerResponse> {
  const response = await apiClient.post<AnswerResponse>(
    `/ai/mock-interview/${interviewId}/answer/`,
    {
      question_number: questionNumber,
      answer_text: answerText,
    }
  );
  return response.data;
}

export async function completeInterview(interviewId: number): Promise<unknown> {
  const response = await apiClient.post(
    `/ai/mock-interview/${interviewId}/complete/`
  );
  return response.data;
}

export async function getInterviewResult(interviewId: number): Promise<InterviewResult> {
  const response = await apiClient.get<InterviewResult>(
    `/ai/mock-interview/${interviewId}/result/`
  );
  return response.data;
}
