import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Brain,
  RotateCcw,
  Keyboard,
  Radio,
  CalendarDays,
  ChevronDown,
  ListChecks,
  Lightbulb,
  Target,
  ThumbsUp,
  AlertTriangle,
  History,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ScoreRing } from '@/components/ScoreRing';
import {
  startMockInterview,
  submitAnswer,
  completeInterview,
  getInterviewResult,
  getInterviewState,
  getMockInterviews,
} from '@/api/mockInterview';
import { classifyError } from '@/api/client';
import { useNotification } from '@/components/NotificationProvider';
import { useAuth } from '@/context/AuthContext';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import type {
  AnswerResponse,
  InterviewResult,
  InterviewQuestionResponse,
  MockInterview,
  InterviewFeedback,
  InterviewResultAnswer,
  InterviewResultQuestion,
  SavedMockInterview,
} from '@/types';

interface QAEntry {
  questionNumber: number;
  question: string;
  answer: string;
  evaluation?: AnswerResponse['evaluation'];
  score?: number;
  feedback?: string;
}

interface ResultQuestion extends InterviewResultQuestion {
  answer?: InterviewResultAnswer;
}

type Phase = 'idle' | 'starting' | 'in-progress' | 'completing' | 'completed';

function getQuestionText(q: InterviewQuestionResponse | null | undefined): string {
  if (!q) return '';
  return q.question || q.question_text || q.text || '';
}

function getQuestionNumber(q: InterviewQuestionResponse | null | undefined): number | null {
  if (!q) return null;
  return q.question_number ?? null;
}

function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) return data.filter((item): item is string => typeof item === 'string');
  if (typeof data === 'string') return [data];
  return [];
}

function getFeedbackText(data: unknown): string | null {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  for (const key of ['feedback', 'overall_feedback', 'summary', 'message']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return null;
}

function getStringList(data: unknown): string[] {
  return extractStringArray(data).filter((item) => item.trim().length > 0);
}

function scoreToPercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value <= 10 ? value * 10 : value));
}

function formatResultDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatInterviewStatus(status: string | undefined): string {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

function getResultQuestions(result: InterviewResult): ResultQuestion[] {
  const questions = result.questions || [];
  const answers = result.answers || [];
  const answerByNumber = new Map(answers.map((answer) => [answer.question_number, answer]));
  const totalQuestions = Math.max(
    result.total_questions || 0,
    questions.length,
    ...answers.map((answer) => answer.question_number),
  );

  if (totalQuestions === 0) {
    return answers.map((answer) => ({ question_number: answer.question_number, question_text: answer.question_text, answer }));
  }

  return Array.from({ length: totalQuestions }, (_, index) => {
    const questionNumber = index + 1;
    const question = questions.find((item) => item.question_number === questionNumber);
    return {
      question_number: questionNumber,
      question_text: question?.question_text || answerByNumber.get(questionNumber)?.question_text || '',
      category: question?.category,
      difficulty: question?.difficulty,
      answer: answerByNumber.get(questionNumber),
    };
  });
}

function scoreTone(score: number | null): string {
  if (score === null) return 'text-navy-400';
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-brand-600';
  if (score >= 40) return 'text-warning-600';
  return 'text-error-600';
}

function scoreBarTone(score: number | null): string {
  if (score === null) return 'bg-slate-200';
  if (score >= 80) return 'bg-success-500';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-warning-500';
  return 'bg-error-500';
}

export function MockInterviewPage() {
  const location = useLocation();
  const { notify } = useNotification();
  const { user, authenticated, loading: authLoading } = useAuth();

  const initialResumeId = (location.state as { resumeId?: number })?.resumeId || null;
  const initialPlanId = (location.state as { interviewPlanId?: number })?.interviewPlanId || null;
  const initialInterviewId = (location.state as { interviewId?: number })?.interviewId || null;

  const [resumeId, setResumeId] = useState(initialResumeId?.toString() || '');
  const [planId, setPlanId] = useState(initialPlanId?.toString() || '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<unknown>(null);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionResponse | null>(null);
  const [currentQNum, setCurrentQNum] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerResponse | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [savedInterviews, setSavedInterviews] = useState<SavedMockInterview[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<unknown>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Speech hooks
  const { isListening, isSupported: speechSupported, startListening, stopListening } =
    useSpeechRecognition((transcript) => {
      setInterimTranscript(transcript);
      setAnswer(transcript);
    });
  const { speak, stopSpeaking, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const currentQuestionText = getQuestionText(currentQuestion);
  const selectionStorageKey = user ? `resumeai:mock-interview:selected:${user.id}` : null;

  const restoreInterview = useCallback(async (saved: SavedMockInterview) => {
    setRestoring(true);
    setHistoryError(null);
    setError(null);
    setSelectedInterviewId(saved.mock_interview_id);
    setInterviewId(saved.mock_interview_id);
    setResumeId(String(saved.resume_id));
    setPlanId(String(saved.interview_plan_id));
    setTotalQuestions(saved.total_questions || null);
    setAnswer('');
    setInterimTranscript('');
    setLastEvaluation(null);
    setExpandedQuestion(null);

    try {
      const restoredResult = await getInterviewResult(saved.mock_interview_id);
      const restoredAnswers = restoredResult.answers || [];
      setResult(restoredResult);
      setQaHistory(restoredAnswers.map((savedAnswer) => ({
        questionNumber: savedAnswer.question_number,
        question: savedAnswer.question_text,
        answer: savedAnswer.answer_text || '',
        evaluation: savedAnswer.evaluation || undefined,
        score: savedAnswer.score ?? savedAnswer.evaluation?.overall_score,
        feedback: savedAnswer.feedback || undefined,
      })));

      const restoredStatus = restoredResult.status || saved.status;
      if (restoredStatus === 'IN_PROGRESS') {
        const state = await getInterviewState(saved.mock_interview_id);
        const questionNumber = state.current_question_number
          || restoredResult.current_question_number
          || saved.current_question_number
          || 1;
        const fallbackQuestion = restoredResult.questions?.find(
          (question) => question.question_number === questionNumber,
        );
        setCurrentQNum(questionNumber);
        setCurrentQuestion(state.question
          ? { question_number: questionNumber, question: state.question }
          : fallbackQuestion
            ? { question_number: questionNumber, question: fallbackQuestion.question_text }
            : null);
        setPhase('in-progress');
      } else {
        setCurrentQuestion(null);
        setCurrentQNum(restoredResult.current_question_number || saved.current_question_number || 1);
        setPhase('completed');
      }

      if (selectionStorageKey) {
        window.localStorage.setItem(selectionStorageKey, String(saved.mock_interview_id));
      }
    } catch (restoreError) {
      setError(restoreError);
      setPhase('idle');
      setHistoryError(restoreError);
      notify('error', classifyError(restoreError).message);
    } finally {
      setRestoring(false);
    }
  }, [notify, selectionStorageKey]);

  const loadSavedInterviews = useCallback(async (restoreSelection = true) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getMockInterviews();
      const records = response.interviews || [];
      setSavedInterviews(records);

      if (restoreSelection && records.length > 0) {
        const storedId = selectionStorageKey
          ? Number(window.localStorage.getItem(selectionStorageKey))
          : null;
        const preferredId = initialInterviewId || (storedId && Number.isFinite(storedId) ? storedId : null);
        const preferredInterview = records.find(
          (record) => record.mock_interview_id === preferredId,
        );
        if (preferredInterview) {
          await restoreInterview(preferredInterview);
        }
      }
    } catch (historyLoadError) {
      setHistoryError(historyLoadError);
    } finally {
      setHistoryLoading(false);
    }
  }, [initialInterviewId, restoreInterview, selectionStorageKey]);

  useEffect(() => {
    if (!authLoading && authenticated) {
      void loadSavedInterviews();
    }
  }, [authLoading, authenticated, loadSavedInterviews]);

  // Auto-speak question when it arrives
  useEffect(() => {
    if (currentQuestionText && phase === 'in-progress') {
      // Don't auto-speak; let the user trigger it
    }
  }, [currentQuestionText, phase]);

  const handleStart = async () => {
    if (!resumeId || !planId || isNaN(Number(resumeId)) || isNaN(Number(planId))) {
      notify('error', 'Please enter valid Resume ID and Interview Plan ID.');
      return;
    }

    setPhase('starting');
    setError(null);
    setQaHistory([]);
    setResult(null);
    setExpandedQuestion(null);
    setSelectedInterviewId(null);
    if (selectionStorageKey) {
      window.localStorage.removeItem(selectionStorageKey);
    }

    try {
      const res = await startMockInterview(Number(resumeId), {
        interview_plan_id: Number(planId),
      });

      const id = (res as MockInterview).mock_interview_id;
      if (!id) {
        setError(new Error('Interview started but no interview ID was returned by the server.'));
        setPhase('idle');
        return;
      }

      setInterviewId(id);
      setSelectedInterviewId(id);
      if (selectionStorageKey) {
        window.localStorage.setItem(selectionStorageKey, String(id));
      }
      setTotalQuestions((res as Record<string, unknown>).total_questions as number || null);

      // Extract first question from response
      const response = res as MockInterview;
      const qData = typeof response.question === 'string'
        ? {
            question_number: response.current_question_number || 1,
            question: response.question,
          }
        : null;

      if (qData) {
        setCurrentQuestion(qData);
        const qNum = getQuestionNumber(qData);
        setCurrentQNum(qNum || 1);
        setPhase('in-progress');
        await loadSavedInterviews(false);
        notify('success', 'Interview started! Answer the questions to proceed.');
      } else {
        // No question in start response — interview might be complete already
        if ((res as Record<string, unknown>).completed) {
          setPhase('completed');
          notify('info', 'Interview already completed.');
          await fetchResult(id);
          await loadSavedInterviews(false);
        } else {
          setError(new Error('Interview started but no question was returned by the server.'));
          setPhase('idle');
        }
      }
    } catch (err) {
      setError(err);
      setPhase('idle');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interviewId || !answer.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    stopListening();
    stopSpeaking();

    const questionText = currentQuestionText;
    const qNum = currentQNum;
    const userAnswer = answer.trim();

    try {
      const res = await submitAnswer(interviewId, qNum, userAnswer);

      // Save to history
      setQaHistory((prev) => [
        ...prev,
        {
          questionNumber: qNum,
          question: questionText,
          answer: userAnswer,
          evaluation: res.evaluation,
          score: res.score ?? res.evaluation?.score,
          feedback: res.feedback ?? res.evaluation?.feedback,
        },
      ]);

      setLastEvaluation(res);
      setAnswer('');
      setInterimTranscript('');

      const isCompleted = res.completed;
      const nextQ = typeof res.next_question === 'string'
        ? { question_number: qNum + 1, question: res.next_question }
        : res.next_question;

      if (isCompleted) {
        // Interview is done
        setPhase('completed');
        notify('success', 'Interview completed! Fetching your results...');

        // Try to fetch results
        await fetchResult(interviewId);
        await loadSavedInterviews(false);
      } else if (nextQ) {
        // Move to next question
        setCurrentQuestion(nextQ);
        const nextQNum = getQuestionNumber(nextQ);
        setCurrentQNum(nextQNum || qNum + 1);
        await loadSavedInterviews(false);
        notify('success', 'Answer submitted! Next question loaded.');
      } else {
        setError(new Error('Answer submitted but no next question was returned by the server.'));
      }
    } catch (err) {
      setError(err);
      notify('error', classifyError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!interviewId) return;
    setPhase('completing');
    setError(null);

    try {
      await completeInterview(interviewId);
      setPhase('completed');
      notify('success', 'Interview completed. Fetching results...');
      await fetchResult(interviewId);
      await loadSavedInterviews(false);
    } catch (err) {
      setError(err);
      setPhase('in-progress');
      notify('error', classifyError(err).message);
    }
  };

  const fetchResult = async (id: number) => {
    try {
      const res = await getInterviewResult(id);
      setResult(res);
    } catch (err) {
      // Result endpoint may not exist or may not be ready
      setError(err);
    }
  };

  const handleSpeakQuestion = () => {
    if (currentQuestionText) {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        speak(currentQuestionText);
      }
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setAnswer('');
      setInterimTranscript('');
      startListening();
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setInterviewId(null);
    setCurrentQuestion(null);
    setAnswer('');
    setQaHistory([]);
    setResult(null);
    setLastEvaluation(null);
    setExpandedQuestion(null);
    setSelectedInterviewId(null);
    if (selectionStorageKey) {
      window.localStorage.removeItem(selectionStorageKey);
    }
    setError(null);
    setInterimTranscript('');
  };

  const handleSavedInterviewChange = async (value: string) => {
    if (!value) {
      handleReset();
      return;
    }

    const saved = savedInterviews.find(
      (interview) => interview.mock_interview_id === Number(value),
    );
    if (saved) {
      await restoreInterview(saved);
    }
  };

  const finalFeedbackData: InterviewFeedback | null = result?.final_feedback && typeof result.final_feedback === 'object'
    ? result.final_feedback
    : null;
  const overallScore = scoreToPercent(
    result?.overall_score ?? result?.total_score ?? finalFeedbackData?.overall_score,
  );
  const finalFeedback = getFeedbackText(
    result?.final_feedback ?? result?.feedback ?? result?.summary,
  );

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && phase === 'in-progress' && answer.trim() && !submitting) {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answer, phase, submitting, handleSubmitAnswer]);

  const resultQuestions = result ? getResultQuestions(result) : [];
  const finalStrengths = getStringList(finalFeedbackData?.strengths);
  const finalWeaknesses = getStringList(finalFeedbackData?.weaknesses);
  const improvementAreas = getStringList(finalFeedbackData?.improvement_areas);
  const recommendations = getStringList(finalFeedbackData?.recommendations);
  const completedDate = formatResultDate(result?.completed_at || result?.started_at);
  const overallMetrics = [
    { label: 'Communication', value: scoreToPercent(finalFeedbackData?.communication_score) },
    { label: 'Technical', value: scoreToPercent(finalFeedbackData?.technical_score) },
    { label: 'Answer quality', value: scoreToPercent(finalFeedbackData?.answer_quality_score) },
    { label: 'Relevance', value: scoreToPercent(finalFeedbackData?.relevance_score) },
  ].filter((metric) => metric.value !== null);

  return (
    <DashboardLayout title="Mock Interview" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Mock Interview' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="card-elevated p-4 sm:p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-navy-900">Saved Interviews</h2>
              <p className="text-xs text-navy-500 mt-1">
                Resume an in-progress interview or review a completed interview.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadSavedInterviews(false)}
              className="p-2 rounded-lg text-navy-400 hover:bg-slate-100 hover:text-brand-600 transition-colors"
              title="Refresh saved interviews"
              aria-label="Refresh saved interviews"
              disabled={historyLoading}
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {historyError && savedInterviews.length === 0 ? (
            <ErrorState error={historyError} onRetry={() => void loadSavedInterviews(false)} title="Could not load saved interviews" />
          ) : historyLoading && savedInterviews.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-navy-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              Loading saved interviews...
            </div>
          ) : savedInterviews.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-navy-500">
              No saved interviews yet. Start an interview below to create your first record.
            </div>
          ) : (
            <div>
              <label htmlFor="saved-interview" className="label">Select an interview</label>
              <select
                id="saved-interview"
                value={selectedInterviewId || ''}
                onChange={(event) => void handleSavedInterviewChange(event.target.value)}
                className="input"
                disabled={restoring}
              >
                <option value="">Start a new interview</option>
                {savedInterviews.map((saved) => {
                  const date = formatResultDate(saved.completed_at || saved.started_at || saved.created_at);
                  const status = formatInterviewStatus(saved.status);
                  return (
                    <option key={saved.mock_interview_id} value={saved.mock_interview_id}>
                      Interview #{saved.mock_interview_id} · Resume #{saved.resume_id} · Plan #{saved.interview_plan_id} · {date || 'Date unavailable'} · {status}
                    </option>
                  );
                })}
              </select>
              {restoring && (
                <div className="flex items-center gap-2 text-xs text-navy-500 mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  Restoring interview state...
                </div>
              )}
              {historyError != null && (
                <p className="text-xs text-error-600 mt-2">
                  Saved interview list could not be refreshed. Your current interview remains available.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Idle: Setup form */}
        {phase === 'idle' && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-4 bg-brand-50 border-brand-200">
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Mock Interview Room</p>
                  <p className="text-xs text-navy-500 mt-1">
                    Practice with AI-generated questions based on your resume and target job.
                    The AI will evaluate each answer and provide feedback. You can type answers
                    or use voice recognition (where supported).
                  </p>
                </div>
              </div>
            </div>

            <div className="card-elevated p-6">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Resume ID</label>
                  <input
                    type="text"
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                    className="input"
                    placeholder="e.g. 5"
                    disabled={!!initialResumeId}
                  />
                </div>
                <div>
                  <label className="label">Interview Plan ID</label>
                  <input
                    type="text"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="input"
                    placeholder="e.g. 2"
                    disabled={!!initialPlanId}
                  />
                </div>
              </div>

              {/* Voice availability indicators */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  speechSupported ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-navy-400'
                }`}>
                  <Radio className="w-3.5 h-3.5" />
                  Speech Recognition: {speechSupported ? 'Available' : 'Not supported in this browser'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  ttsSupported ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-navy-400'
                }`}>
                  <Volume2 className="w-3.5 h-3.5" />
                  Text-to-Speech: {ttsSupported ? 'Available' : 'Not supported'}
                </div>
              </div>

              <button onClick={handleStart} className="btn-primary w-full">
                <Mic className="w-4 h-4" />
                Start Mock Interview
              </button>
            </div>

            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-navy-300" />}
              title="No active interview"
              description="Enter your IDs above and click Start to begin a mock interview. You can get these from the Interview Planning page."
              action={
                <Link to="/interview-plan" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" />
                  Go to Interview Planning
                </Link>
              }
            />
          </div>
        )}

        {/* Starting */}
        {phase === 'starting' && (
          <LoadingState message="Starting your mock interview..." />
        )}

        {/* Completing */}
        {phase === 'completing' && (
          <LoadingState message="Completing interview and generating results..." />
        )}

        {/* Error during setup */}
        {error != null && phase === 'idle' && (
          <div className="mt-6">
            <ErrorState error={error} onRetry={handleStart} />
          </div>
        )}

        {/* In-progress */}
        {phase === 'in-progress' && (
          <div className="animate-fade-in space-y-6">
            {/* Progress header */}
            <div className="card-elevated p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
                  <span className="text-sm font-semibold text-navy-900">Interview in Progress</span>
                </div>
                <span className="text-sm text-navy-400">
                  Q{currentQNum}{totalQuestions ? ` of ${totalQuestions}` : ''}
                </span>
              </div>
              {totalQuestions && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${(qaHistory.length / totalQuestions) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Error display (non-blocking) */}
            {error != null && (
              <div className="p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">
                {classifyError(error).message}
              </div>
            )}

            {/* Current question */}
            <div className="card-elevated p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-700">{currentQNum}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-navy-400 font-medium mb-1">Question {currentQNum}</p>
                  <p className="text-base text-navy-900 font-medium leading-relaxed">
                    {currentQuestionText || 'Loading question...'}
                  </p>
                  {currentQuestion?.topic && (
                    <span className="inline-block mt-2 badge bg-brand-50 text-brand-700">
                      {currentQuestion.topic}
                    </span>
                  )}
                </div>
                {ttsSupported && currentQuestionText && (
                  <button
                    onClick={handleSpeakQuestion}
                    className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
                      isSpeaking
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-slate-100 text-navy-400 hover:bg-slate-200'
                    }`}
                    title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Answer input */}
              <div className="mt-4">
                <label className="label flex items-center justify-between">
                  <span>Your Answer</span>
                  {speechSupported && (
                    <button
                      onClick={handleToggleListening}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all ${
                        isListening
                          ? 'bg-error-500 text-white animate-pulse'
                          : 'bg-slate-100 text-navy-500 hover:bg-slate-200'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          Stop recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          Speak answer
                        </>
                      )}
                    </button>
                  )}
                </label>
                <textarea
                  ref={answerRef}
                  value={isListening && interimTranscript ? interimTranscript : answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="input resize-y scrollbar-thin"
                  placeholder={isListening ? 'Listening... speak your answer' : 'Type your answer here... (Ctrl+Enter to submit)'}
                  disabled={submitting}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-navy-400">
                    <Keyboard className="w-3.5 h-3.5" />
                    Press Ctrl+Enter to submit
                  </div>
                  <div className="flex gap-2">
                    {qaHistory.length > 0 && (
                      <button
                        onClick={handleCompleteEarly}
                        disabled={submitting}
                        className="btn-ghost text-xs"
                      >
                        End interview early
                      </button>
                    )}
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!answer.trim() || submitting}
                      className="btn-primary"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Last evaluation feedback */}
            {lastEvaluation && !!(lastEvaluation.evaluation || lastEvaluation.feedback || lastEvaluation.score !== undefined) && (
              <div className="card p-6 animate-slide-up">
                <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent-600" />
                  AI Evaluation of Your Last Answer
                </h4>
                {lastEvaluation.score !== undefined && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl font-bold text-brand-600">
                      {lastEvaluation.score}
                    </div>
                    <div className="text-xs text-navy-400">
                      Score out of 100
                    </div>
                  </div>
                )}
                {lastEvaluation.evaluation?.feedback || lastEvaluation.feedback ? (
                  <p className="text-sm text-navy-600 leading-relaxed mb-3">
                    {lastEvaluation.evaluation?.feedback || lastEvaluation.feedback}
                  </p>
                ) : null}
                {lastEvaluation.evaluation?.strengths != null && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-success-700 mb-1">Strengths:</p>
                    <ul className="space-y-1">
                      {extractStringArray(lastEvaluation.evaluation.strengths).map((s, i) => (
                        <li key={i} className="text-xs text-navy-600 flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lastEvaluation.evaluation?.improvements != null && (
                  <div>
                    <p className="text-xs font-semibold text-warning-700 mb-1">Areas to Improve:</p>
                    <ul className="space-y-1">
                      {extractStringArray(lastEvaluation.evaluation.improvements).map((s, i) => (
                        <li key={i} className="text-xs text-navy-600 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-warning-500 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Q&A History */}
            {qaHistory.length > 0 && (
              <div className="card p-6">
                <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-navy-400" />
                  Previous Questions ({qaHistory.length})
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin">
                  {qaHistory.map((qa, i) => (
                    <div key={i} className="border-l-2 border-brand-200 pl-4">
                      <p className="text-xs font-semibold text-navy-400 mb-1">Q{qa.questionNumber}</p>
                      <p className="text-sm text-navy-900 font-medium mb-1">{qa.question}</p>
                      <p className="text-xs text-navy-500 italic mb-1">Your answer: {qa.answer}</p>
                      {qa.score !== undefined && (
                        <span className="badge bg-brand-50 text-brand-700 text-xs">
                          Score: {qa.score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed: Results */}
        {phase === 'completed' && (
          <div className="animate-fade-in space-y-6">
            <div className="card-elevated p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 mb-1">Interview Complete</h2>
              <p className="text-sm text-navy-500">
                {interviewId && <span>Interview ID: {interviewId}</span>}
              </p>
            </div>

            {error != null && !result && (
              <ErrorState
                error={error}
                title="Could not fetch results"
                onRetry={() => interviewId && fetchResult(interviewId)}
              />
            )}

            {result && (
              <div className="space-y-6">
                <div className="card-elevated p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="badge bg-success-50 text-success-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {formatInterviewStatus(result.status || 'COMPLETED')}
                        </span>
                        {completedDate && (
                          <span className="badge bg-slate-100 text-navy-500">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {completedDate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-1">
                        AI Performance Report
                      </p>
                      <h3 className="text-2xl font-bold text-navy-900">Your interview results</h3>
                      <p className="text-sm text-navy-500 mt-2">
                        Review your answers, AI evaluation, and practical next steps.
                      </p>
                    </div>
                    {overallScore !== null ? (
                      <ScoreRing score={overallScore} size={150} strokeWidth={11} label="Overall score" sublabel="out of 100" />
                    ) : (
                      <div className="w-36 h-36 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center mx-auto lg:mx-0">
                        <span className="text-sm font-semibold text-navy-500">Not available</span>
                        <span className="text-xs text-navy-400 mt-1">Overall score</span>
                      </div>
                    )}
                  </div>
                  {overallMetrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
                      {overallMetrics.map((metric) => (
                        <div key={metric.label} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-navy-500">{metric.label}</p>
                          <p className={`text-xl font-bold mt-1 ${scoreTone(metric.value)}`}>{Math.round(metric.value as number)}</p>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                            <div className={`h-full rounded-full ${scoreBarTone(metric.value)}`} style={{ width: `${metric.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Detailed review</p>
                      <h3 className="text-lg font-bold text-navy-900 mt-1">Question-wise evaluation</h3>
                    </div>
                    <span className="badge bg-brand-50 text-brand-700">
                      <ListChecks className="w-3.5 h-3.5" />
                      {resultQuestions.length} questions
                    </span>
                  </div>
                  {resultQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {resultQuestions.map((question) => {
                        const answer = question.answer;
                        const evaluation = answer?.evaluation;
                        const questionScore = scoreToPercent(answer?.score ?? evaluation?.overall_score);
                        const isUnanswered = !answer || !answer.answer_text?.trim();
                        const isExpanded = expandedQuestion === question.question_number;
                        const evaluationFeedback = getFeedbackText(evaluation) || answer?.feedback || null;
                        const strengths = getStringList(evaluation?.strengths);
                        const weaknesses = getStringList(evaluation?.missing_points);
                        const suggestions = getStringList(evaluation?.improvement_suggestions);
                        const metricScores = [
                          { label: 'Correctness', value: scoreToPercent(evaluation?.correctness_score) },
                          { label: 'Relevance', value: scoreToPercent(evaluation?.relevance_score) },
                          { label: 'Technical depth', value: scoreToPercent(evaluation?.technical_depth_score) },
                          { label: 'Communication', value: scoreToPercent(evaluation?.communication_score) },
                        ].filter((metric) => metric.value !== null);

                        return (
                          <div key={question.question_number} className="card overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedQuestion(isExpanded ? null : question.question_number)}
                              className="w-full flex items-center gap-3 text-left p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                              aria-expanded={isExpanded}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isUnanswered ? 'bg-warning-50 text-warning-600' : 'bg-brand-50 text-brand-700'
                              }`}>
                                {isUnanswered ? <AlertTriangle className="w-4 h-4" /> : <span className="text-sm font-bold">{question.question_number}</span>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-navy-400">Question {question.question_number}</span>
                                  {isUnanswered ? (
                                    <span className="badge bg-warning-50 text-warning-700">Unanswered</span>
                                  ) : questionScore !== null ? (
                                    <span className={`badge ${questionScore >= 60 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
                                      Score {Math.round(questionScore)}/100
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm font-semibold text-navy-900 truncate">
                                  {question.question_text || `Question ${question.question_number}`}
                                </p>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-navy-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="border-t border-slate-100 p-4 sm:p-5 space-y-5 bg-white">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-2">Question</p>
                                  <p className="text-sm text-navy-800 leading-relaxed">
                                    {question.question_text || `Question ${question.question_number} text was not returned.`}
                                  </p>
                                </div>
                                {question.category || question.difficulty ? (
                                  <div className="flex flex-wrap gap-2">
                                    {question.category && <span className="badge bg-brand-50 text-brand-700">{question.category}</span>}
                                    {question.difficulty && <span className="badge bg-slate-100 text-navy-500">{question.difficulty}</span>}
                                  </div>
                                ) : null}
                                {isUnanswered ? (
                                  <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
                                    <p className="text-sm font-semibold text-warning-700">No answer submitted</p>
                                    <p className="text-sm text-warning-700/80 mt-1">This question was not evaluated because the interview ended before an answer was recorded.</p>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-2">Your answer</p>
                                      <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap rounded-lg bg-slate-50 p-4">{answer?.answer_text}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                      {questionScore !== null && (
                                        <div className="rounded-lg bg-brand-50 px-4 py-3">
                                          <p className="text-xs text-brand-700">Individual score</p>
                                          <p className={`text-2xl font-bold ${scoreTone(questionScore)}`}>{Math.round(questionScore)}<span className="text-sm font-medium text-navy-400">/100</span></p>
                                        </div>
                                      )}
                                      {evaluationFeedback && (
                                        <div className="flex-1 min-w-[220px]">
                                          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-1">AI evaluation</p>
                                          <p className="text-sm text-navy-700 leading-relaxed">{evaluationFeedback}</p>
                                        </div>
                                      )}
                                    </div>
                                    {metricScores.length > 0 && (
                                      <div className="grid grid-cols-2 gap-3">
                                        {metricScores.map((metric) => (
                                          <div key={metric.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                              <span className="text-navy-500">{metric.label}</span>
                                              <span className={`font-semibold ${scoreTone(metric.value)}`}>{Math.round(metric.value as number)}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div className={`h-full rounded-full ${scoreBarTone(metric.value)}`} style={{ width: `${metric.value}%` }} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="grid md:grid-cols-3 gap-4">
                                      {strengths.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-success-700 mb-2 flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5" />Strengths</p>
                                          <ul className="space-y-1.5">{strengths.map((item, index) => <li key={index} className="text-xs text-navy-600 flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                                        </div>
                                      )}
                                      {weaknesses.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-warning-700 mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Missing points</p>
                                          <ul className="space-y-1.5">{weaknesses.map((item, index) => <li key={index} className="text-xs text-navy-600 flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                                        </div>
                                      )}
                                      {suggestions.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" />Suggestions</p>
                                          <ul className="space-y-1.5">{suggestions.map((item, index) => <li key={index} className="text-xs text-navy-600 flex gap-2"><ArrowRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                                        </div>
                                      )}
                                    </div>
                                    {typeof evaluation?.ideal_answer === 'string' && evaluation.ideal_answer.trim() && (
                                      <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">Ideal answer</p>
                                        <p className="text-sm text-navy-700 leading-relaxed">{evaluation.ideal_answer}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="card p-5 text-sm text-navy-500">Question-level results were not returned for this interview.</div>
                  )}
                </section>

                {(finalFeedback || finalStrengths.length > 0 || finalWeaknesses.length > 0 || improvementAreas.length > 0 || recommendations.length > 0) && (
                  <section>
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">AI coaching summary</p>
                      <h3 className="text-lg font-bold text-navy-900 mt-1">Overall feedback</h3>
                    </div>
                    <div className="card p-5 sm:p-6 space-y-5">
                      {finalFeedback && (
                        <div className="rounded-lg bg-brand-50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-brand-600" />
                            <p className="text-sm font-semibold text-navy-900">Personalized assessment</p>
                          </div>
                          <p className="text-sm text-navy-700 leading-relaxed">{finalFeedback}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-3 gap-5">
                        {finalStrengths.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-success-700 mb-2 flex items-center gap-2"><ThumbsUp className="w-4 h-4" />Final strengths</p>
                            <ul className="space-y-2">{finalStrengths.map((item, index) => <li key={index} className="text-sm text-navy-600 flex gap-2"><CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                          </div>
                        )}
                        {finalWeaknesses.length > 0 || improvementAreas.length > 0 ? (
                          <div>
                            <p className="text-sm font-semibold text-warning-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Areas for improvement</p>
                            <ul className="space-y-2">{[...finalWeaknesses, ...improvementAreas].map((item, index) => <li key={index} className="text-sm text-navy-600 flex gap-2"><Target className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                          </div>
                        ) : null}
                        {recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-brand-700 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" />Recommendations</p>
                            <ul className="space-y-2">{recommendations.map((item, index) => <li key={index} className="text-sm text-navy-600 flex gap-2"><ArrowRight className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleReset} className="btn-secondary flex-1">
                <RotateCcw className="w-4 h-4" />
                Start New Interview
              </button>
              <Link to="/dashboard" className="btn-primary flex-1">
                Back to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
