import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Mic,
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { createInterviewPlan } from '@/api/interviewPlanning';
import { getInterviewPlanHistory } from '@/api/interviewPlans';
import { useNotification } from '@/components/NotificationProvider';
import { Spinner } from '@/components/LoadingState';
import type { InterviewPlan, SavedInterviewPlan } from '@/types';

function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) return data.filter((item): item is string => typeof item === 'string');
  if (typeof data === 'string') return [data];
  return [];
}

export function InterviewPlanPage() {
  const location = useLocation();
  const { notify } = useNotification();

  const initialResumeId = (location.state as { resumeId?: number })?.resumeId || null;
  const initialJobMatchId = (location.state as { jobMatchId?: number })?.jobMatchId || null;

  const [resumeId, setResumeId] = useState(initialResumeId?.toString() || '');
  const [jobMatchId, setJobMatchId] = useState(initialJobMatchId?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [history, setHistory] = useState<SavedInterviewPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const selectPlan = (savedPlan: SavedInterviewPlan) => {
    setResumeId(String(savedPlan.resume_id));
    setJobMatchId(String(savedPlan.job_match_id));
    setPlan(savedPlan);
    setPlanId(savedPlan.interview_plan_id);
    setError(null);
  };

  useEffect(() => {
    let active = true;
    void getInterviewPlanHistory()
      .then((plans) => {
        if (!active) return;
        setHistory(plans);
        const requestedResumeId = (location.state as { resumeId?: number } | null)?.resumeId;
        const requestedJobMatchId = (location.state as { jobMatchId?: number } | null)?.jobMatchId;
        const initialPlan = plans.find((savedPlan) =>
          requestedResumeId && requestedJobMatchId
            ? savedPlan.resume_id === requestedResumeId && savedPlan.job_match_id === requestedJobMatchId
            : true
        );
        if (initialPlan) selectPlan(initialPlan);
      })
      .catch((loadError: unknown) => {
        if (active) setHistoryError(loadError instanceof Error ? loadError.message : 'Unable to load saved interview plans.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.state]);

  const handleGenerate = async () => {
    if (!resumeId || !jobMatchId || isNaN(Number(resumeId)) || isNaN(Number(jobMatchId))) {
      notify('error', 'Please enter valid Resume ID and Job Match ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await createInterviewPlan(Number(resumeId), Number(jobMatchId));
      setPlan(res);

      const id = (res as Record<string, unknown>).interview_plan_id as number;
      setPlanId(id || null);
      if (id) {
        const updatedHistory = await getInterviewPlanHistory();
        setHistory(updatedHistory);
        const savedPlan = updatedHistory.find((item) => item.interview_plan_id === id);
        if (savedPlan) selectPlan(savedPlan);
      }
      notify('success', 'Interview plan generated successfully!');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const planData = (plan?.plan_data || {}) as Record<string, unknown>;
  const topics = extractStringArray(planData.focus_areas || planData.topics);
  const focusAreas = extractStringArray(planData.focus_areas);
  const duration = planData.duration as string | undefined;
  const difficulty = (planData.overall_difficulty || planData.difficulty) as string | undefined;

  return (
    <DashboardLayout title="Interview Planning" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Interview Planning' }]}>
      <div className="max-w-3xl mx-auto">
        {/* Info banner */}
        <div className="card p-4 mb-6 bg-brand-50 border-brand-200">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-navy-900">Interview Plan Generator</p>
              <p className="text-xs text-navy-500 mt-1">
                The AI generates a personalized interview plan based on your resume and job match.
                You'll need your Resume ID and Job Match ID (from the Job Matching page).
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-navy-900">Saved interview plans</h2>
              <p className="text-xs text-navy-400 mt-1">Select any previously generated plan.</p>
            </div>
            <ClipboardList className="w-4 h-4 text-brand-500" />
          </div>
          {historyLoading ? (
            <p className="text-sm text-navy-400">Loading saved plans...</p>
          ) : historyError ? (
            <p className="rounded-lg bg-error-50 p-3 text-sm text-error-700">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-navy-400">
              No saved interview plans yet.
            </p>
          ) : (
            <div>
              <label htmlFor="saved-interview-plan" className="label">Interview plan</label>
              <select
                id="saved-interview-plan"
                value={planId?.toString() || ''}
                onChange={(event) => {
                  const savedPlan = history.find(
                    (item) => item.interview_plan_id === Number(event.target.value)
                  );
                  if (savedPlan) selectPlan(savedPlan);
                }}
                className="input"
              >
                <option value="" disabled>Select an interview plan</option>
                {history.map((savedPlan) => (
                  <option key={savedPlan.interview_plan_id} value={savedPlan.interview_plan_id}>
                    Plan #{savedPlan.interview_plan_id} · {savedPlan.job_title} · Resume #{savedPlan.resume_id} · {new Date(savedPlan.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {planId && (
                <p className="mt-2 text-xs text-navy-400">
                  Plan #{planId} selected · Resume #{resumeId} · Job match #{jobMatchId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="card-elevated p-6 mb-6">
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
              <label className="label">Job Match ID</label>
              <input
                type="text"
                value={jobMatchId}
                onChange={(e) => setJobMatchId(e.target.value)}
                className="input"
                placeholder="e.g. 3"
                disabled={!!initialJobMatchId}
              />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Spinner size={18} />
                Generating interview plan...
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" />
                Generate Interview Plan
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {loading && <LoadingState message="AI is creating a personalized interview plan..." />}

        {error != null && <ErrorState error={error} onRetry={handleGenerate} />}

        {plan && !loading && error == null && (
          <div className="space-y-6 animate-slide-up">
            {/* Plan summary */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                Interview Plan
                {planId && <span className="ml-auto badge bg-brand-50 text-brand-700 dark:bg-navy-700 dark:text-slate-100">Plan ID: {planId}</span>}
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {duration && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <Clock className="w-5 h-5 text-navy-400" />
                    <div>
                      <p className="text-xs text-navy-400">Estimated Duration</p>
                      <p className="text-sm font-semibold text-navy-900">{duration}</p>
                    </div>
                  </div>
                )}
                {difficulty && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <Layers className="w-5 h-5 text-navy-400" />
                    <div>
                      <p className="text-xs text-navy-400">Difficulty Level</p>
                      <p className="text-sm font-semibold text-navy-900 capitalize">{difficulty}</p>
                    </div>
                  </div>
                )}
              </div>

              {topics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-navy-900 mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t, i) => (
                      <span key={i} className="badge bg-brand-50 text-brand-700 dark:bg-navy-700 dark:text-slate-100">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {focusAreas.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-navy-900 mb-2">Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((f, i) => (
                      <span key={i} className="badge bg-accent-50 text-accent-700 dark:bg-navy-700 dark:text-slate-100">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Start mock interview */}
            {planId && (
              <div className="card-elevated p-6 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-navy-800 dark:to-navy-900 border-brand-200 dark:border-brand-300/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">Start a Mock Interview</h3>
                    <p className="text-xs text-navy-700 dark:text-slate-300 mt-0.5">
                      Practice with AI-generated questions and get real-time feedback.
                    </p>
                  </div>
                  <Link
                    to="/mock-interview"
                    state={{ resumeId: Number(resumeId), interviewPlanId: planId }}
                    className="btn-primary flex-shrink-0"
                  >
                    Start Interview
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !plan && (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8 text-navy-300" />}
            title="No interview plan yet"
            description="Enter your Resume ID and Job Match ID above, then click Generate to create a personalized interview plan."
            action={
              <Link to="/job-match" className="btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Go to Job Matching
              </Link>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
