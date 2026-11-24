import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Spinner } from '@/components/LoadingState';
import { classifyError } from '@/api/client';
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetOtp,
} from '@/api/auth';
import { useNotification } from '@/components/NotificationProvider';

type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [step, setStep] = useState<Step>('email');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (step === 'email') {
        await requestPasswordReset(username, email);
        setStep('otp');
      } else if (step === 'otp') {
        const token = await verifyPasswordResetOtp(email, otp);
        setResetToken(token);
        setStep('password');
      } else {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        if (newPassword.length < 8) {
          setError('Password must be at least 8 characters long.');
          return;
        }
        await completePasswordReset(email, resetToken, newPassword);
        notify('success', 'Password reset successfully. Please log in.');
        navigate('/login', { replace: true });
      }
    } catch (resetError) {
      setError(classifyError(resetError).message);
    } finally {
      setLoading(false);
    }
  };

  const title = step === 'email' ? 'Forgot password?' : step === 'otp' ? 'Verify your email' : 'Set a new password';
  const description = step === 'email'
    ? 'Enter your username and registered email address to receive a verification code.'
    : step === 'otp'
      ? 'Enter the 6-digit OTP sent to your email address.'
      : 'Choose a new password for your ResumeAI account.';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 relative overflow-hidden">
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2 w-fit"><BrandLogo inverse /></Link>
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">Reset your password securely.</h1>
            <p className="text-navy-200 text-lg leading-relaxed max-w-md">
              Verify your email with a one-time code and regain access to your dashboard.
            </p>
          </div>
          <p className="text-xs text-navy-400">© 2026 ResumeAI. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Link to="/" className="flex items-center gap-2 w-fit"><BrandLogo /></Link></div>
          <div className="card-elevated p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">{title}</h2>
            <p className="text-sm text-navy-500 mb-6">{description}</p>
            {error && <div className="mb-4 p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'email' && (
                <>
                  <div>
                    <label className="label" htmlFor="reset-username">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                      <input id="reset-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} className="input pl-10" autoComplete="username" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="reset-email">Registered email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                      <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input pl-10" autoComplete="email" required />
                    </div>
                  </div>
                </>
              )}
              {step === 'otp' && (
                <div>
                  <label className="label" htmlFor="reset-otp">Verification code</label>
                  <input id="reset-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="input tracking-[0.35em]" autoComplete="one-time-code" required />
                </div>
              )}
              {step === 'password' && (
                <>
                  <div>
                    <label className="label" htmlFor="reset-new-password">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                      <input id="reset-new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input pl-10" autoComplete="new-password" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="reset-confirm-password">Confirm new password</label>
                    <input id="reset-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input" autoComplete="new-password" required />
                  </div>
                </>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
                {loading ? <><Spinner size={18} /> Processing...</> : <>{step === 'password' ? 'Reset password' : 'Continue'}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
