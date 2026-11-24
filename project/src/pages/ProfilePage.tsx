import { useEffect, useState, type FormEvent } from 'react';
import { Mail, User as UserIcon, Shield, CalendarDays, RefreshCw, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/context/AuthContext';
import { changePassword } from '@/api/auth';
import { classifyError } from '@/api/client';
import { useNotification } from '@/components/NotificationProvider';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<unknown>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    refreshUser()
      .catch((loadError) => {
        if (active) setError(loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify('success', 'Password changed successfully.');
    } catch (passwordChangeError) {
      setPasswordError(classifyError(passwordChangeError).message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Profile' }]}>
        <LoadingState message="Loading your profile..." />
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout title="My Profile" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Profile' }]}>
        <ErrorState error={error || new Error('Profile data is unavailable.')} onRetry={() => void refreshUser()} />
      </DashboardLayout>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Your profile';
  const initials = (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase();
  const createdAt = typeof user.date_joined === 'string' ? new Date(user.date_joined) : null;
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(createdAt)
    : null;

  return (
    <DashboardLayout title="My Profile" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Profile' }]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="card-elevated overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-navy-800 border-4 border-white dark:border-navy-800 shadow-card flex items-center justify-center text-2xl font-bold text-brand-700">
                {initials}
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white">{fullName}</h2>
                <p className="text-sm text-navy-500 dark:text-slate-400 mt-1">ResumeAI account profile</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Account details</h3>
              <p className="text-sm text-navy-500 dark:text-slate-400 mt-1">Information connected to your authenticated account.</p>
            </div>
            <button type="button" onClick={() => void refreshUser()} className="btn-ghost px-3 py-2" title="Refresh profile">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <Mail className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">Email address</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1 break-all">{user.email}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <UserIcon className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">First name</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1">{user.first_name || 'Not provided'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <UserIcon className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">Last name</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1">{user.last_name || 'Not provided'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <UserIcon className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">Username</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1">{user.username || 'Not provided'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <Shield className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">Account ID</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1">{user.id}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-navy-800/70 p-4">
              <CalendarDays className="w-4 h-4 text-brand-600 mb-3" />
              <p className="text-xs text-navy-400 dark:text-slate-400">Member since</p>
              <p className="text-sm font-semibold text-navy-900 dark:text-white mt-1">{createdLabel || 'Available in your account settings'}</p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-navy-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-600 dark:text-brand-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">Change password</h3>
              <p className="text-sm text-navy-500 dark:text-slate-400 mt-1">Update your account password securely.</p>
            </div>
          </div>
          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">
              {passwordError}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div>
              <label className="label" htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input" autoComplete="current-password" required />
            </div>
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input" autoComplete="new-password" required />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input" autoComplete="new-password" required />
            </div>
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Changing password...' : 'Change password'}
            </button>
          </form>
        </section>

        {Object.entries(user)
          .filter(([key, value]) => !['id', 'email', 'username', 'first_name', 'last_name', 'date_joined', 'password', 'access', 'refresh'].includes(key) && (typeof value === 'string' || typeof value === 'number'))
          .length > 0 && (
            <section className="card p-6">
              <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Additional profile information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(user)
                  .filter(([key, value]) => !['id', 'email', 'username', 'first_name', 'last_name', 'date_joined', 'password', 'access', 'refresh'].includes(key) && (typeof value === 'string' || typeof value === 'number'))
                  .map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-slate-200 dark:border-navy-700 p-3">
                      <p className="text-xs text-navy-400 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-navy-800 dark:text-slate-100 mt-1">{String(value)}</p>
                    </div>
                  ))}
              </div>
            </section>
          )}
      </div>
    </DashboardLayout>
  );
}
