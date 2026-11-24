import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Mic,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ScoreRing } from '@/components/ScoreRing';
import { getJobMatchHistory, jobMatch } from '@/api/jobMatching';
import { useNotification } from '@/components/NotificationProvider';
import { Spinner } from '@/components/LoadingState';
import type { JobMatchResult, SavedJobMatch } from '@/types';

function extractStringArray(data: unknown): string[] {
  if (Array.isArray(data)) return data.filter((item): item is string => typeof item === 'string');
  if (typeof data === 'string') return [data];
  return [];
}

function extractScore(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  for (const key of [
    'overall_match_score',
    'match_score',
    'overall_match',
    'match_percentage',
    'score',
  ]) {
    const val = data[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

export function JobMatchPage() {
  const location = useLocation();
  const { notify } = useNotification();

  const [resumeId, setResumeId] = useState<string>(
    String((location.state as { resumeId?: number })?.resumeId || '')
  );
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [resultResumeId, setResultResumeId] = useState<number | null>(null);
  const [resultJobMatchId, setResultJobMatchId] = useState<number | null>(null);
  const [history, setHistory] = useState<SavedJobMatch[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const selectSavedMatch = (savedMatch: SavedJobMatch) => {
    setResumeId(String(savedMatch.resume_id));
    setJobTitle(savedMatch.job_title);
    setJobDescription(savedMatch.job_description);
    setResult(savedMatch);
    setResultResumeId(savedMatch.resume_id);
    setResultJobMatchId(savedMatch.job_match_id);
    setError(null);
  };

  useEffect(() => {
    let active = true;
    void getJobMatchHistory()
      .then((matches) => {
        if (!active) return;
        setHistory(matches);
        const requestedResumeId = (location.state as { resumeId?: number } | null)?.resumeId;
        const initialMatch = requestedResumeId
          ? matches.find((match) => match.resume_id === requestedResumeId)
          : matches[0];
        if (initialMatch) selectSavedMatch(initialMatch);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resumeId || isNaN(Number(resumeId))) {
      notify('error', 'Please enter a valid Resume ID. You can find this on your dashboard after uploading.');
      return;
    }
    if (!jobTitle.trim() || !jobDescription.trim()) {
      notify('error', 'Please provide both a job title and job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await jobMatch(Number(resumeId), {
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim(),
      });
      const responseMatchData = (res.match_data || {}) as Record<string, unknown>;
      const rawScore = responseMatchData.overall_match_score;
      const numericScore = typeof rawScore === 'number'
        ? rawScore
        : typeof rawScore === 'string'
          ? Number(rawScore)
          : NaN;
      if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error('The job matching service returned an invalid match score. Please try again.');
      }

      setResult(res);
      setHistory((previous) => [
        {
          ...res,
          id: res.job_match_id || 0,
          job_match_id: res.job_match_id || 0,
          resume_id: Number(resumeId),
          job_title: jobTitle.trim(),
          job_description: jobDescription.trim(),
          match_data: res.match_data || {},
          created_at: new Date().toISOString(),
        },
        ...previous.filter((match) => match.job_match_id !== res.job_match_id),
      ]);
      setResultResumeId(Number(resumeId));

      // Extract job match ID from various possible field names
      const jmId = (res as Record<string, unknown>).job_match_id as number;
      setResultJobMatchId(jmId || null);

      notify('success', 'Job match analysis complete!');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const matchData = (result?.match_data || {}) as Record<string, unknown>;
  const matchScore = extractScore(matchData);
  const matchingSkills = extractStringArray(matchData.matched_skills || matchData.matching_skills);
  const missingSkills = extractStringArray(matchData.missing_skills);
  const strengths = extractStringArray(matchData.strengths);
  const gaps = extractStringArray(matchData.gaps);
  const recommendations = extractStringArray(matchData.recommendations);

  return (
    <DashboardLayout title="Job Matching" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Job Matching' }]}>
      <div className="max-w-3xl mx-auto">
        {/* Info banner */}
        <div className="card p-4 mb-6 bg-accent-50 border-accent-200">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-navy-900">Job Match Analysis</p>
              <p className="text-xs text-navy-500 mt-1">
                Enter your resume ID and a job description to see how well your resume matches
                the job requirements. The AI will identify matching skills, missing skills,
                and provide recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-elevated p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="label">Resume ID</label>
              <input
                type="text"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                required
                className="input"
                placeholder="Enter your resume ID (from the dashboard)"
              />
              <p className="text-xs text-navy-400 mt-1.5">
                You can find this ID on your dashboard after uploading a resume.
              </p>
            </div>

            <div>
              <label className="label">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="input"
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div>
              <label className="label">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={8}
                className="input resize-y scrollbar-thin"
                placeholder="Paste the full job description here..."
              />
              <p className="text-xs text-navy-400 mt-1.5">
                Include the complete job description for the most accurate match analysis.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Spinner size={18} />
                  Analyzing match...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Analyze Match
                </>
              )}
            </button>
          </div>
        </form>

        <section className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-navy-900">Previous matches</h2>
              <p className="text-xs text-navy-400 mt-1">Saved analyses from your account</p>
            </div>
            <Briefcase className="w-4 h-4 text-navy-300" />
          </div>
          {historyLoading ? (
            <p className="text-sm text-navy-400">Loading saved matches...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-navy-400">No saved job matches yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((savedMatch) => (
                <button
                  key={savedMatch.job_match_id}
                  type="button"
                  onClick={() => selectSavedMatch(savedMatch)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    resultJobMatchId === savedMatch.job_match_id
                      ? 'border-brand-300 bg-brand-50/50'
                      : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-navy-900 truncate">{savedMatch.job_title}</span>
                    <span className="text-xs text-navy-400 whitespace-nowrap">Resume #{savedMatch.resume_id}</span>
                  </div>
                  <p className="text-xs text-navy-400 mt-1">
                    {new Date(savedMatch.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        {loading && <LoadingState message="AI is comparing your resume to the job description..." />}

        {error != null && <ErrorState error={error} onRetry={() => { setError(null); handleSubmit({ preventDefault() {} } as FormEvent); }} />}

        {result && !loading && error == null && (
          <div className="space-y-6 animate-slide-up">
            {/* Match score */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Match Results
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex justify-center">
                  {matchScore !== null ? (
                    <ScoreRing score={matchScore} size={140} label="Match Score" />
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-navy-200 mx-auto mb-2" />
                      <p className="text-sm text-navy-400">No score returned</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-4">
                  {matchingSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-success-600" />
                        <h4 className="text-sm font-semibold text-navy-900">Matching Skills ({matchingSkills.length})</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchingSkills.map((s, i) => (
                          <span key={i} className="badge bg-success-50 text-success-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {missingSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-error-600" />
                        <h4 className="text-sm font-semibold text-navy-900">Missing Skills ({missingSkills.length})</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingSkills.map((s, i) => (
                          <span key={i} className="badge bg-error-50 text-error-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(strengths.length > 0 || gaps.length > 0) && (
              <div className="card p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {strengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-brand-600" />
                        <h4 className="text-sm font-semibold text-navy-900">Strengths</h4>
                      </div>
                      <div className="space-y-2">
                        {strengths.map((strength, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-700">
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {gaps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-warning-600" />
                        <h4 className="text-sm font-semibold text-navy-900">Gaps</h4>
                      </div>
                      <div className="space-y-2">
                        {gaps.map((gap, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-700">
                            {gap}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-navy-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional data from response */}
            {matchData.keyword_matches != null && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-navy-900 mb-3">Keyword Analysis</h3>
                <pre className="text-xs text-navy-500 bg-slate-50 p-4 rounded-lg overflow-auto scrollbar-thin">
                  {JSON.stringify(matchData.keyword_matches, null, 2)}
                </pre>
              </div>
            )}

            {/* Next step: Interview planning */}
            {resultResumeId && resultJobMatchId && (
              <div className="card-elevated p-6 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-navy-800 dark:to-navy-900 border-brand-200 dark:border-brand-300/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-brand-900 dark:text-white">Ready for interview prep?</h3>
                    <p className="text-xs text-navy-700 dark:text-slate-300 mt-0.5">
                      Generate a personalized interview plan based on this job match.
                    </p>
                  </div>
                  <Link
                    to="/interview-plan"
                    state={{ resumeId: resultResumeId, jobMatchId: resultJobMatchId }}
                    className="btn-primary flex-shrink-0"
                  >
                    Create Plan
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !result && (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-navy-300" />}
            title="No match analysis yet"
            description="Enter your resume ID and a job description above to see how well you match."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
