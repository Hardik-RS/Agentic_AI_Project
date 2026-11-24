import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/components/NotificationProvider';
import { classifyError } from '@/api/client';
import { Spinner } from '@/components/LoadingState';
import { BrandLogo } from '@/components/BrandLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { notify } = useNotification();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { tokens } = await login(username, password);
      if (tokens) {
        refreshUser();
        notify('success', 'Welcome back! You are now logged in.');
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login succeeded but no access token was returned. Please check your backend response format.');
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
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 relative overflow-hidden">
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
              Welcome back to your interview advantage.
            </h1>
            <p className="text-navy-200 text-lg leading-relaxed max-w-md">
              Continue improving your resume, matching with jobs, and practicing
              interviews with AI-powered insights.
            </p>
            <div className="mt-8 space-y-3">
              {['ATS scoring', 'AI resume analysis', 'Mock interview practice'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-brand-300" />
                  </div>
                  <span className="text-sm text-navy-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-navy-400">© 2026 ResumeAI. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <BrandLogo />
            </Link>
          </div>

          <div className="card-elevated p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Log in</h2>
            <p className="text-sm text-navy-500 mb-6">
              Enter your credentials to access your dashboard.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    required
                    className="input pl-10"
                    placeholder="johndoe"
                    autoComplete="username"
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    required
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3"
              >
                {loading ? (
                  <>
                    <Spinner size={18} />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
                Sign up
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-navy-400">
            <Link to="/" className="hover:text-navy-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
