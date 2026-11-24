// Core API types

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  access_token?: string;
  refresh_token?: string;
  token?: string;
  user?: User;
  [key: string]: unknown;
}

// Resume types
export interface Resume {
  id: number;
  file_name?: string;
  filename?: string;
  file?: string;
  status?: string;
  uploaded_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ResumeUploadResponse {
  id?: number;
  resume_id?: number;
  status?: string;
  file_name?: string;
  filename?: string;
  [key: string]: unknown;
}

// Analysis types — all fields optional since backend shape may vary
export interface ResumeAnalysis {
  resume_id?: number;
  score?: number;
  ats_score?: number;
  overall_score?: number;
  education?: unknown;
  experience?: unknown;
  skills?: string[] | unknown;
  strengths?: string[] | unknown;
  weaknesses?: string[] | unknown;
  achievements?: string[] | unknown;
  improvement_areas?: string[] | unknown;
  missing_keywords?: string[] | unknown;
  formatting?: unknown;
  contact_info?: unknown;
  summary?: string;
  [key: string]: unknown;
}

export interface ResumeProcessResponse {
  resume_id?: number;
  status?: string;
  parser_result_id?: number;
  analysis_result_id?: number;
  score_result_id?: number;
  parser_created?: boolean;
  analysis_created?: boolean;
  score_created?: boolean;
  message?: string;
  error?: string;
  analysis?: ResumeAnalysis;
  parsed_data?: unknown;
  parser_result?: Record<string, unknown>;
  analysis_result?: ResumeAnalysis;
  score_result?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DashboardResume {
  id: number;
  file_name: string;
  status?: string;
  uploaded_at?: string;
  analysis_date?: string;
  analysis_result?: ResumeAnalysis | null;
  score_result?: Record<string, unknown> | null;
}

export interface DashboardResponse {
  counts: {
    resumes: number;
    analyses: number;
    job_matches: number;
    mock_interviews: number;
  };
  resumes: DashboardResume[];
}

// Job matching types
export interface JobMatchRequest {
  job_title: string;
  job_description: string;
  [key: string]: unknown;
}

export interface JobMatchResult {
  id?: number;
  job_match_id?: number;
  match_data?: Record<string, unknown>;
  match_score?: number;
  overall_match?: number;
  match_percentage?: number;
  overall_match_score?: number;
  skill_match_score?: number;
  experience_match_score?: number;
  education_match_score?: number;
  matched_skills?: string[] | unknown;
  matching_skills?: string[] | unknown;
  missing_skills?: string[] | unknown;
  matched_keywords?: string[] | unknown;
  missing_keywords?: string[] | unknown;
  strengths?: string[] | unknown;
  gaps?: string[] | unknown;
  recommendations?: string[] | unknown;
  keyword_matches?: unknown;
  [key: string]: unknown;
}

export interface SavedJobMatch extends JobMatchResult {
  id: number;
  job_match_id: number;
  resume_id: number;
  job_title: string;
  job_description: string;
  created_at: string;
}

// Interview planning types
export interface InterviewPlan {
  id?: number;
  interview_plan_id?: number;
  plan_id?: number;
  plan_data?: Record<string, unknown>;
  questions?: InterviewQuestion[] | unknown;
  topics?: string[] | unknown;
  focus_areas?: string[] | unknown;
  duration?: string;
  difficulty?: string;
  [key: string]: unknown;
}

export interface SavedInterviewPlan extends InterviewPlan {
  id: number;
  interview_plan_id: number;
  resume_id: number;
  job_match_id: number;
  job_title: string;
  created_at: string;
}

export interface InterviewQuestion {
  question?: string;
  question_text?: string;
  text?: string;
  topic?: string;
  category?: string;
  difficulty?: string;
  [key: string]: unknown;
}

// Mock interview types
export interface MockInterviewStartRequest {
  interview_plan_id: number;
  [key: string]: unknown;
}

export interface MockInterview {
  id?: number;
  mock_interview_id?: number;
  interview_id?: number;
  resume_id?: number;
  interview_plan_id?: number;
  status?: string;
  completed?: boolean;
  current_question?: number;
  current_question_number?: number;
  question?: string;
  total_questions?: number;
  [key: string]: unknown;
}

export interface SavedMockInterview {
  mock_interview_id: number;
  resume_id: number;
  interview_plan_id: number;
  status: string;
  current_question_number: number;
  total_questions: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface InterviewQuestionResponse {
  question_number?: number;
  question?: string;
  question_text?: string;
  text?: string;
  topic?: string;
  category?: string;
  [key: string]: unknown;
}

export interface AnswerEvaluation {
  score?: number;
  rating?: number;
  correctness_score?: number;
  relevance_score?: number;
  technical_depth_score?: number;
  clarity_score?: number;
  completeness_score?: number;
  communication_score?: number;
  overall_score?: number;
  feedback?: string;
  evaluation?: string;
  strengths?: string[] | unknown;
  improvements?: string[] | unknown;
  missing_points?: string[] | unknown;
  improvement_suggestions?: string[] | unknown;
  ideal_answer?: string;
  [key: string]: unknown;
}

export interface AnswerResponse {
  evaluation?: AnswerEvaluation;
  score?: number;
  feedback?: string;
  completed?: boolean;
  next_question?: InterviewQuestionResponse | string | null;
  question_number?: number;
  [key: string]: unknown;
}

export interface InterviewResultQuestion {
  question_number: number;
  question_text: string;
  category?: string | null;
  difficulty?: string | null;
}

export interface InterviewResultAnswer {
  question_number: number;
  question_text: string;
  answer_text?: string | null;
  evaluation?: AnswerEvaluation | null;
  score?: number | null;
  feedback?: string | null;
  answered_at?: string | null;
}

export interface InterviewFeedback {
  overall_score?: number;
  technical_score?: number;
  communication_score?: number;
  answer_quality_score?: number;
  relevance_score?: number;
  strengths?: string[] | unknown;
  weaknesses?: string[] | unknown;
  repeated_mistakes?: string[] | unknown;
  improvement_areas?: string[] | unknown;
  recommendations?: string[] | unknown;
  final_feedback?: string;
  [key: string]: unknown;
}

export interface InterviewResult {
  interview_id?: number;
  mock_interview_id?: number;
  resume_id?: number;
  interview_plan_id?: number;
  status?: string;
  current_question_number?: number;
  started_at?: string | null;
  completed_at?: string | null;
  total_questions?: number;
  overall_score?: number;
  total_score?: number;
  questions?: InterviewResultQuestion[];
  answers?: InterviewResultAnswer[];
  final_feedback?: InterviewFeedback | string | null;
  feedback?: string;
  summary?: string;
  completed?: boolean;
  results?: unknown;
  question_results?: unknown;
  [key: string]: unknown;
}

export interface MockInterviewHistoryResponse {
  interviews: SavedMockInterview[];
}

// API error
export interface ApiErrorData {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
