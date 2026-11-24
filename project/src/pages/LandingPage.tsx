import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ScanLine,
  Target,
  Mic,
  TrendingUp,
  Shield,
  Brain,
  CheckCircle,
  ArrowRight,
  Zap,
  Award,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PublicLayout } from '@/components/PublicLayout';

export function LandingPage() {
  const { authenticated } = useAuth();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-brand-50/30 to-slate-50">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-40" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #B7C9B1 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Resume Analysis
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-[1.1] tracking-tight">
                Land more interviews with an{' '}
                <span className="text-brand-600">AI-optimized resume</span>
              </h1>
              <p className="mt-6 text-lg text-navy-500 leading-relaxed max-w-xl">
                Upload your resume and get instant ATS scoring, AI-powered analysis,
                job match insights, and personalized mock interview practice — all in
                one platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to={authenticated ? '/upload' : '/register'} className="btn-primary text-base px-7 py-3.5">
                  {authenticated ? 'Upload Your Resume' : 'Get Started Free'}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how-it-works" className="btn-secondary text-base px-7 py-3.5">
                  See How It Works
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-navy-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Instant analysis
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="card-elevated p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error-300" />
                    <div className="w-3 h-3 rounded-full bg-warning-300" />
                    <div className="w-3 h-3 rounded-full bg-success-300" />
                  </div>
                  <span className="text-xs text-navy-400 font-medium">ResumeAI Analysis</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-900">ATS Score</p>
                        <p className="text-xs text-navy-400">Keyword optimization</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-success-600">87</div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Skills Match', score: 92, color: 'bg-success-500' },
                      { label: 'Experience Impact', score: 78, color: 'bg-brand-500' },
                      { label: 'Formatting', score: 95, color: 'bg-success-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-navy-600 font-medium">{item.label}</span>
                          <span className="text-navy-900 font-semibold">{item.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-accent-50 border border-accent-200">
                    <p className="text-xs text-accent-700 font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Tip: Add measurable achievements to boost impact score by 15%
                    </p>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 card-elevated px-4 py-3 rounded-xl animate-pulse-soft hidden sm:block">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning-500" />
                  <div>
                    <p className="text-xs font-bold text-navy-900">3x More</p>
                    <p className="text-xs text-navy-400">Interview callbacks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Resumes Analyzed' },
              { value: '87%', label: 'Average ATS Score Increase' },
              { value: '3x', label: 'More Interview Calls' },
              { value: '500+', label: 'Mock Interviews Completed' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-navy-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">
              Everything you need to land your next role
            </h2>
            <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
              From resume analysis to mock interviews, ResumeAI gives you the tools to
              stand out from the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ScanLine,
                title: 'ATS Resume Scoring',
                desc: 'Get an instant ATS compatibility score with detailed breakdowns of formatting, keywords, and structure.',
                color: 'bg-brand-50 text-brand-600',
              },
              {
                icon: Brain,
                title: 'AI Resume Analysis',
                desc: 'Deep AI analysis of your resume covering education, experience, skills, strengths, and improvement areas.',
                color: 'bg-accent-50 text-accent-600',
              },
              {
                icon: Target,
                title: 'Job Match Analysis',
                desc: 'Compare your resume against any job description to see matching skills, gaps, and recommendations.',
                color: 'bg-warning-50 text-warning-600',
              },
              {
                icon: Mic,
                title: 'Mock Interview Practice',
                desc: 'Practice with AI-generated interview questions tailored to your target role, with real-time feedback.',
                color: 'bg-error-50 text-error-600',
              },
              {
                icon: TrendingUp,
                title: 'Improvement Insights',
                desc: 'Actionable recommendations to strengthen your resume and increase your interview callback rate.',
                color: 'bg-success-50 text-success-600',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                desc: 'Your data is protected with industry-standard authentication and never shared with third parties.',
                color: 'bg-navy-50 text-navy-600',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card p-6 hover:shadow-card transition-all duration-300 hover:-translate-y-1 group">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-navy-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">How it works</h2>
            <p className="mt-4 text-lg text-navy-500">Four simple steps to a stronger resume and interview readiness.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: FileText, step: '01', title: 'Upload Resume', desc: 'Drag and drop your PDF or DOCX resume file.' },
              { icon: ScanLine, step: '02', title: 'AI Analysis', desc: 'Get instant ATS scores and detailed AI insights.' },
              { icon: Target, step: '03', title: 'Match Jobs', desc: 'Compare against job descriptions and see gaps.' },
              { icon: Mic, step: '04', title: 'Practice Interviews', desc: 'AI mock interviews with real-time feedback.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="relative">
                  <div className="card p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-soft">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-bold text-brand-400">{item.step}</span>
                    <h3 className="text-base font-semibold text-navy-900 mt-1 mb-2">{item.title}</h3>
                    <p className="text-sm text-navy-500">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 w-8 h-8 items-center justify-center text-brand-300">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to boost your resume?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Join thousands of job seekers who improved their resumes with AI-powered insights.
          </p>
          <div className="mt-8">
            <Link
              to={authenticated ? '/upload' : '/register'}
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-brand-50 transition-colors shadow-elevated"
            >
              {authenticated ? 'Upload Your Resume' : 'Start Free Now'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'What file formats are supported?', a: 'PDF and DOCX files are supported for resume upload. We recommend PDF for best ATS compatibility.' },
              { q: 'How does the ATS scoring work?', a: 'Our AI engine analyzes your resume for keyword optimization, formatting, structure, and content quality, then generates a score based on what Applicant Tracking Systems look for.' },
              { q: 'Can I practice interviews for any job?', a: 'Yes. After uploading your resume and entering a job description, the AI generates a tailored interview plan and conducts a mock interview with personalized feedback.' },
              { q: 'Is my data secure?', a: 'Your resume data is processed securely and is never shared with third parties. Authentication uses industry-standard JWT tokens.' },
              { q: 'Do I need to install anything?', a: 'No. ResumeAI runs entirely in your browser. Just sign up, upload your resume, and get started.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-navy-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-navy-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 animate-slide-up">
          <p className="text-sm text-navy-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
