import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Upload,
  Briefcase,
  Mic,
  FileText,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ScoreRing, ScoreBar } from '@/components/ScoreRing';
import { LoadingState } from '@/components/LoadingState';
import type { DashboardResponse, ResumeProcessResponse, ResumeAnalysis } from '@/types';
import { getDashboardData } from '@/api/dashboard';
import { getJobMatchHistory } from '@/api/jobMatching';
import { getMockInterviews } from '@/api/mockInterview';
import { classifyError } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import type { SavedJobMatch, SavedMockInterview } from '@/types';

// Safely extract a string array from unknown data
function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string');
  }
  if (typeof data === 'string') return [data];
  return [];
}

// Extract the score from various possible field names
function extractScore(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  const candidates = ['score', 'ats_score', 'overall_score', 'overall', 'ats_compatibility'];
  for (const key of candidates) {
    const val = data[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function getResultObject(
  value: unknown,
  dataKey: 'analysis_data' | 'score_data'
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const nested = record[dataKey];
  return nested && typeof nested === 'object'
    ? nested as Record<string, unknown>
    : record;
}

export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState<ResumeProcessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyPanel, setHistoryPanel] = useState<'resumes' | 'analyses' | 'matches' | 'mock' | null>(null);
  const [jobMatches, setJobMatches] = useState<SavedJobMatch[]>([]);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [jobMatchesError, setJobMatchesError] = useState<string | null>(null);
  const [selectedJobMatchId, setSelectedJobMatchId] = useState<number | null>(null);
  const [mockInterviews, setMockInterviews] = useState<SavedMockInterview[]>([]);
  const [mockInterviewsLoading, setMockInterviewsLoading] = useState(false);
  const [mockInterviewsError, setMockInterviewsError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as {
      resumeId?: number;
      analysisData?: ResumeProcessResponse;
    } | null;
    let active = true;

    if (state?.analysisData) {
      setAnalysisData(state.analysisData);
      setResumeId(state.resumeId || state.analysisData.resume_id || null);
    }

    void getDashboardData()
      .then((data) => {
        if (!active) return;
        setDashboardData(data);
        const latestAnalyzedResume = data.resumes.find(
          (resume) => resume.analysis_result
        );
        if (latestAnalyzedResume) {
          setResumeId(latestAnalyzedResume.id);
          setAnalysisData({
            resume_id: latestAnalyzedResume.id,
            analysis_result: latestAnalyzedResume.analysis_result || undefined,
            score_result: latestAnalyzedResume.score_result || undefined,
          });
        } else if (!state?.analysisData) {
          setAnalysisData(null);
          setResumeId(null);
        }
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(classifyError(error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.state]);

  useEffect(() => {
    if (historyPanel !== 'matches' || jobMatches.length > 0) return;
    let active = true;
    setJobMatchesLoading(true);
    void getJobMatchHistory()
      .then((matches) => {
        if (!active) return;
        setJobMatches(matches);
        setSelectedJobMatchId(matches[0]?.job_match_id || null);
      })
      .catch((error: unknown) => {
        if (active) setJobMatchesError(classifyError(error).message);
      })
      .finally(() => {
        if (active) setJobMatchesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [historyPanel, jobMatches.length]);

  useEffect(() => {
    if (historyPanel !== 'mock' || mockInterviews.length > 0) return;
    let active = true;
    setMockInterviewsLoading(true);
    void getMockInterviews()
      .then((response) => {
        if (!active) return;
        setMockInterviews(response.interviews);
        setMockInterviewsError(null);
      })
      .catch((error: unknown) => {
        if (active) setMockInterviewsError(classifyError(error).message);
      })
      .finally(() => {
        if (active) setMockInterviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [historyPanel, mockInterviews.length]);

  const toggleHistoryPanel = (panel: 'resumes' | 'analyses' | 'matches' | 'mock') => {
    setHistoryPanel((current) => current === panel ? null : panel);
  };

  const selectAnalysis = (resume: DashboardResponse['resumes'][number]) => {
    setResumeId(resume.id);
    setAnalysisData({
      resume_id: resume.id,
      analysis_result: resume.analysis_result || undefined,
      score_result: resume.score_result || undefined,
    });
  };

  const responseData = analysisData as Record<string, unknown> | null;
  const analysis: ResumeAnalysis | null =
    getResultObject(responseData?.analysis_result, 'analysis_data') as ResumeAnalysis ||
    getResultObject(responseData?.analysis, 'analysis_data') as ResumeAnalysis ||
    null;
  const scoreData = getResultObject(responseData?.score_result, 'score_data') || undefined;

  const score = extractScore(scoreData) ??
    extractScore(analysis as Record<string, unknown> | undefined) ??
    extractScore(responseData || undefined);

  const strengths = extractStringArray((analysis as Record<string, unknown>)?.strengths);
  const weaknesses = extractStringArray((analysis as Record<string, unknown>)?.weaknesses);
  const improvementAreas = extractStringArray((analysis as Record<string, unknown>)?.improvement_areas);
  const skills = extractStringArray((analysis as Record<string, unknown>)?.skills);
  const achievements = extractStringArray((analysis as Record<string, unknown>)?.achievements);
  const missingKeywords = extractStringArray((analysis as Record<string, unknown>)?.missing_keywords);
  const summary = (analysis as Record<string, unknown>)?.summary as string | undefined;

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload New Resume',
      desc: 'Upload a new resume for AI analysis',
      to: '/upload',
      color: 'bg-brand-50 text-brand-600',
    },
    {
      icon: Briefcase,
      title: 'Job Matching',
      desc: 'Match your resume against a job description',
      to: '/job-match',
      color: 'bg-accent-50 text-accent-600',
    },
    {
      icon: Mic,
      title: 'Mock Interview',
      desc: 'Practice interviews with AI feedback',
      to: '/mock-interview',
      color: 'bg-warning-50 text-warning-600',
    },
  ];

  return (
    <DashboardLayout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      {loading ? (
        <LoadingState message="Loading your dashboard..." />
      ) : loadError ? (
        <div className="card p-8 text-center">
          <h2 className="text-base font-semibold text-navy-900">Unable to load your dashboard</h2>
          <p className="mt-2 text-sm text-navy-500">{loadError}</p>
        </div>
      ) : !analysisData ? (
        <div className="animate-fade-in space-y-6">
          <section className="relative overflow-hidden rounded-2xl bg-navy-950 px-6 py-8 sm:px-8 sm:py-10 text-white shadow-elevated">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Welcome back{user?.first_name ? `, ${user.first_name}` : ''}.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Manage your resumes and prepare for your next career opportunity with focused,
                  AI-powered guidance.
                </p>
              </div>
              <Link to="/upload" className="btn bg-white text-navy-900 hover:bg-brand-50 shadow-none whitespace-nowrap">
                <Plus className="w-4 h-4" /> Upload resume
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Overview</h2>
                <p className="text-xs text-navy-400 mt-1">Your activity at a glance</p>
              </div>
              <Activity className="w-5 h-5 text-brand-500" />
            </div>
            <DashboardStats counts={dashboardData?.counts} activePanel={historyPanel} onToggle={toggleHistoryPanel} />
            <HistoryPanels
              panel={historyPanel}
              resumes={dashboardData?.resumes || []}
              jobMatches={jobMatches}
              jobMatchesLoading={jobMatchesLoading}
              jobMatchesError={jobMatchesError}
              selectedJobMatchId={selectedJobMatchId}
              mockInterviews={mockInterviews}
              mockInterviewsLoading={mockInterviewsLoading}
              mockInterviewsError={mockInterviewsError}
              onSelectAnalysis={selectAnalysis}
              onSelectJobMatch={setSelectedJobMatchId}
            />
          </section>

          <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
            <section className="card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-navy-900">Recent activity</h2>
                  <p className="text-xs text-navy-400 mt-1">Your latest resume and preparation activity</p>
                </div>
                <Clock className="w-5 h-5 text-slate-300" />
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-navy-800">No activity yet</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-navy-400">
                  Upload a resume to start building your personalized career activity feed.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-navy-900 mb-3">Quick actions</h2>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.to} to={action.to} className="card flex items-center gap-4 p-4 hover:border-brand-200 hover:shadow-card transition-all group">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.color}`}><Icon className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-navy-900">{action.title}</h3>
                        <p className="mt-0.5 truncate text-xs text-navy-400">{action.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          <DashboardStats counts={dashboardData?.counts} activePanel={historyPanel} onToggle={toggleHistoryPanel} />
          <HistoryPanels
            panel={historyPanel}
            resumes={dashboardData?.resumes || []}
            jobMatches={jobMatches}
            jobMatchesLoading={jobMatchesLoading}
            jobMatchesError={jobMatchesError}
            selectedJobMatchId={selectedJobMatchId}
            mockInterviews={mockInterviews}
            mockInterviewsLoading={mockInterviewsLoading}
            mockInterviewsError={mockInterviewsError}
            onSelectAnalysis={selectAnalysis}
            onSelectJobMatch={setSelectedJobMatchId}
          />
          {/* Analysis summary */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success-500" />
              <h2 className="text-lg font-bold text-navy-900">Analysis Results</h2>
              {resumeId && (
                <span className="ml-auto badge bg-brand-50 text-brand-700">
                  Resume ID: {resumeId}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Score ring */}
              <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50">
                {score !== null ? (
                  <ScoreRing score={score} label="ATS Score" sublabel="AI Resume Analysis" />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-navy-200 mx-auto mb-2" />
                    <p className="text-sm text-navy-400">No score available</p>
                  </div>
                )}
              </div>

              {/* Key insights */}
              <div className="md:col-span-2 space-y-4">
                {summary && (
                  <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                    <p className="text-sm text-navy-700 leading-relaxed">{summary}</p>
                  </div>
                )}

                {strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-success-600" />
                      <h4 className="text-sm font-semibold text-navy-900">Strengths</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((s, i) => (
                        <span key={i} className="badge bg-success-50 text-success-700">
                          <CheckCircle className="w-3 h-3" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {weaknesses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-warning-600" />
                      <h4 className="text-sm font-semibold text-navy-900">Areas for Improvement</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weaknesses.map((w, i) => (
                        <span key={i} className="badge bg-warning-50 text-warning-700">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  Detected Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="badge bg-slate-100 text-navy-700 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements, improvement areas & missing keywords */}
          {(achievements.length > 0 || improvementAreas.length > 0 || missingKeywords.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6">
              {achievements.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                    Achievements
                  </h3>
                  <ul className="space-y-2">
                    {achievements.map((ach, i) => (
                      <li key={i} className="text-sm text-navy-600 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success-500 mt-2 flex-shrink-0" />
                        {ach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {improvementAreas.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-warning-600" />
                    Improvement Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {improvementAreas.map((area, i) => (
                      <li key={i} className="text-sm text-navy-600 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning-500 mt-2 flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {missingKeywords.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-error-600" />
                    Missing Keywords
                  </h3>
                  <p className="text-xs text-navy-400 mb-3">
                    Consider adding these keywords to improve ATS compatibility:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((kw, i) => (
                      <span key={i} className="badge bg-error-50 text-error-700">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score breakdown bars (if sub-scores exist) */}
          {analysis && typeof analysis === 'object' && (
            <ScoreBreakdown analysis={analysis as Record<string, unknown>} />
          )}

          {/* Next steps */}
          <div className="card-elevated p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Next Steps</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to={resumeId ? '/job-match' : '/upload'}
                state={resumeId ? { resumeId } : undefined}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Match a Job</p>
                    <p className="text-xs text-navy-400">Compare against a job description</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-brand-600 transition-colors" />
              </Link>
              <Link
                to="/mock-interview"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Practice Interview</p>
                    <p className="text-xs text-navy-400">AI mock interview with feedback</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-brand-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function DashboardStats({
  counts,
  activePanel,
  onToggle,
}: {
  counts?: DashboardResponse['counts'];
  activePanel: 'resumes' | 'analyses' | 'matches' | 'mock' | null;
  onToggle: (panel: 'resumes' | 'analyses' | 'matches' | 'mock') => void;
}) {
  const stats = [
    { label: 'Total resumes', value: counts?.resumes ?? 0, icon: FileText, color: 'bg-brand-50 text-brand-600', panel: 'resumes' as const },
    { label: 'Resume analyses', value: counts?.analyses ?? 0, icon: BarChart3, color: 'bg-violet-50 text-violet-600', panel: 'analyses' as const },
    { label: 'Job matches', value: counts?.job_matches ?? 0, icon: Briefcase, color: 'bg-emerald-50 text-emerald-600', panel: 'matches' as const },
    { label: 'Mock interviews', value: counts?.mock_interviews ?? 0, icon: Mic, color: 'bg-amber-50 text-amber-600', panel: 'mock' as const },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const content = (
          <>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="mt-5 text-2xl font-bold text-navy-900">{stat.value}</p>
            <p className="mt-1 text-xs text-navy-400">{stat.label}</p>
            {stat.panel && (
              <p className="mt-3 text-[11px] font-semibold text-accent-700 underline underline-offset-2">
                {activePanel === stat.panel ? 'Hide history' : 'View history'}
              </p>
            )}
          </>
        );
        return (
          <button
            key={stat.label}
            type="button"
            onClick={() => onToggle(stat.panel)}
            className={`card p-4 sm:p-5 text-left transition-all hover:border-brand-200 hover:shadow-card ${
              activePanel === stat.panel ? 'border-brand-300 ring-2 ring-brand-100' : ''
            }`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function HistoryPanels({
  panel,
  resumes,
  jobMatches,
  jobMatchesLoading,
  jobMatchesError,
  selectedJobMatchId,
  mockInterviews,
  mockInterviewsLoading,
  mockInterviewsError,
  onSelectAnalysis,
  onSelectJobMatch,
}: {
  panel: 'resumes' | 'analyses' | 'matches' | 'mock' | null;
  resumes: DashboardResponse['resumes'];
  jobMatches: SavedJobMatch[];
  jobMatchesLoading: boolean;
  jobMatchesError: string | null;
  selectedJobMatchId: number | null;
  mockInterviews: SavedMockInterview[];
  mockInterviewsLoading: boolean;
  mockInterviewsError: string | null;
  onSelectAnalysis: (resume: DashboardResponse['resumes'][number]) => void;
  onSelectJobMatch: (id: number) => void;
}) {
  if (!panel) return null;

  if (panel === 'resumes') {
    return (
      <div className="card p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Resume history</h2>
            <p className="text-xs text-navy-400 mt-1">All resumes uploaded to your account.</p>
          </div>
          <FileText className="w-5 h-5 text-brand-500" />
        </div>
        {resumes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-navy-400">
            No resumes uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {resumes.map((resume) => (
              <button
                key={resume.id}
                type="button"
                onClick={() => onSelectAnalysis(resume)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-brand-200 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy-900">{resume.file_name}</span>
                  <span className="text-xs font-semibold text-brand-700">{resume.status || 'Uploaded'}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400">
                  <span>Resume #{resume.id}</span>
                  <span>{resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'Date unavailable'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (panel === 'mock') {
    return (
      <div className="card p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Mock interview history</h2>
            <p className="text-xs text-navy-400 mt-1">Resume your saved interviews or review completed ones.</p>
          </div>
          <Mic className="w-5 h-5 text-amber-500" />
        </div>
        {mockInterviewsLoading ? (
          <LoadingState message="Loading mock interview history..." className="py-6" />
        ) : mockInterviewsError ? (
          <p className="rounded-lg bg-error-50 p-4 text-sm text-error-700">{mockInterviewsError}</p>
        ) : mockInterviews.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-navy-400">
            No mock interviews yet.
          </p>
        ) : (
          <div className="space-y-2">
            {mockInterviews.map((interview) => (
              <Link
                key={interview.mock_interview_id}
                to="/mock-interview"
                state={{
                  resumeId: interview.resume_id,
                  interviewPlanId: interview.interview_plan_id,
                  interviewId: interview.mock_interview_id,
                }}
                className="block w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-brand-200 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy-900">Interview #{interview.mock_interview_id}</span>
                  <span className="text-xs font-semibold text-brand-700 capitalize">{interview.status}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400">
                  <span>Resume #{interview.resume_id}</span>
                  <span>{interview.created_at ? new Date(interview.created_at).toLocaleDateString() : 'Date unavailable'}</span>
                  <span>{interview.current_question_number}/{interview.total_questions} questions</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (panel === 'analyses') {
    const analyses = resumes.filter((resume) => resume.analysis_result);
    return (
      <div className="card p-5 sm:p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Resume analysis history</h2>
            <p className="text-xs text-navy-400 mt-1">Select a saved analysis to view its complete results below.</p>
          </div>
          <BarChart3 className="w-5 h-5 text-violet-500" />
        </div>
        {analyses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-navy-400">
            No saved resume analyses yet.
          </p>
        ) : (
          <div className="space-y-2">
            {analyses.map((resume) => {
              const score = extractScore(
                getResultObject(resume.score_result, 'score_data') || undefined
              );
              return (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => onSelectAnalysis(resume)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-brand-200 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy-900">Resume #{resume.id}</span>
                    <span className="text-sm font-semibold text-brand-700">
                      {score === null ? 'Score unavailable' : `ATS ${score}`}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400">
                    <span>{resume.file_name}</span>
                    <span>{resume.analysis_date ? new Date(resume.analysis_date).toLocaleDateString() : 'Date unavailable'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const selectedMatch = jobMatches.find((match) => match.job_match_id === selectedJobMatchId);
  const selectedData = (selectedMatch?.match_data || {}) as Record<string, unknown>;
  const matchedSkills = extractStringArray(selectedData.matched_skills);
  const missingSkills = extractStringArray(selectedData.missing_skills);
  const recommendations = extractStringArray(selectedData.recommendations);

  return (
    <div className="card p-5 sm:p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-navy-900">Job matching history</h2>
          <p className="text-xs text-navy-400 mt-1">Select a saved match to view its complete results.</p>
        </div>
        <Briefcase className="w-5 h-5 text-emerald-500" />
      </div>
      {jobMatchesLoading ? (
        <LoadingState message="Loading saved job matches..." className="py-6" />
      ) : jobMatchesError ? (
        <p className="rounded-lg bg-error-50 p-4 text-sm text-error-700">{jobMatchesError}</p>
      ) : jobMatches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-navy-400">
          No saved job matches yet.
        </p>
      ) : (
        <div className="space-y-2">
          {jobMatches.map((match) => {
            const score = extractScore(match.match_data);
            return (
              <button
                key={match.job_match_id}
                type="button"
                onClick={() => onSelectJobMatch(match.job_match_id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedJobMatchId === match.job_match_id
                    ? 'border-brand-300 bg-brand-50/50'
                    : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy-900">{match.job_title}</span>
                  <span className="text-sm font-semibold text-brand-700">
                    {score === null ? 'Score unavailable' : `Match ${score}`}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400">
                  <span>Resume #{match.resume_id}</span>
                  <span>{new Date(match.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selectedMatch && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-3">Selected match details</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <HistoryList title="Matched skills" items={matchedSkills} />
            <HistoryList title="Missing skills" items={missingSkills} />
            <HistoryList title="Recommendations" items={recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-navy-700 mb-2">{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-1 text-xs text-navy-500">
          {items.map((item, index) => <li key={index}>• {item}</li>)}
        </ul>
      ) : (
        <p className="text-xs text-navy-400">No data available.</p>
      )}
    </div>
  );
}

function ScoreBreakdown({ analysis }: { analysis: Record<string, unknown> }) {
  const subScores: { label: string; value: number }[] = [];

  const scoreFields: Record<string, string> = {
    formatting_score: 'Formatting',
    keyword_score: 'Keyword Optimization',
    content_score: 'Content Quality',
    structure_score: 'Structure',
    impact_score: 'Impact',
    experience_score: 'Experience',
    education_score: 'Education',
    skills_score: 'Skills',
  };

  for (const [field, label] of Object.entries(scoreFields)) {
    const val = analysis[field];
    if (typeof val === 'number' && val >= 0 && val <= 100) {
      subScores.push({ label, value: val });
    }
  }

  if (subScores.length === 0) return null;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-600" />
        Score Breakdown
      </h3>
      <div className="space-y-4">
        {subScores.map((ss) => (
          <ScoreBar key={ss.label} label={ss.label} value={ss.value} />
        ))}
      </div>
    </div>
  );
}
