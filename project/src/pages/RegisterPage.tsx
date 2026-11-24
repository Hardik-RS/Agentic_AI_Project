import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { register } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/components/NotificationProvider';
import { classifyError } from '@/api/client';
import { Spinner } from '@/components/LoadingState';
import { BrandLogo } from '@/components/BrandLogo';

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { notify } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { tokens } = await register(email, password, username || undefined, firstName || undefined, lastName || undefined);
      if (tokens) {
        refreshUser();
        notify('success', 'Account created successfully! Welcome to ResumeAI.');
        navigate('/dashboard', { replace: true });
      } else {
        // Registration succeeded but no tokens returned — redirect to login
        notify('info', 'Account created. Please log in.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const classified = classifyError(err);
      setError(classified.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <BrandLogo />
            </Link>
          </div>

          <div className="card-elevated p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Create your account</h2>
            <p className="text-sm text-navy-500 mb-6">
              Start optimizing your resume with AI-powered insights.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input pl-10"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="input pl-10"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2 text-xs">
                        <Check className={`w-3.5 h-3.5 ${check.valid ? 'text-success-500' : 'text-slate-300'}`} />
                        <span className={check.valid ? 'text-navy-600' : 'text-navy-300'}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3"
              >
                {loading ? (
                  <>
                    <Spinner size={18} />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
                Log in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-navy-400">
            <Link to="/" className="hover:text-navy-600">← Back to home</Link>
          </p>
        </div>
      </div>

      {/* Right panel - brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 relative overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <BrandLogo inverse />
          </Link>
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Start landing more interviews today.
            </h1>
            <p className="text-brand-100 text-lg leading-relaxed max-w-md">
              Join thousands of job seekers using AI to optimize their resumes,
              match with jobs, and practice interviews.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Free to get started',
                'Instant ATS scoring',
                'AI mock interview practice',
                'Personalized improvement tips',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-brand-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-brand-200">© 2026 ResumeAI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
