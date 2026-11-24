import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Moon, Sun, ChevronDown, UserRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { BrandLogo } from './BrandLogo';

export function Navbar() {
  const { authenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'FAQ', href: '/#faq' },
  ];
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const displayName = fullName || user?.username || 'Account';
  const initials = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-navy-950/95 backdrop-blur border-b border-slate-200 dark:border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="group" onClick={() => setMobileOpen(false)}>
            <BrandLogo />
          </Link>

          {!authenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-navy-600 dark:text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50 dark:hover:bg-navy-800"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-navy-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-brand-600 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {authenticated && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                >
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white shadow-soft">
                    {initials}
                  </span>
                  <span className="hidden lg:block max-w-28 truncate text-sm font-semibold text-navy-800 dark:text-slate-100">
                    {displayName}
                  </span>
                  <ChevronDown className={`hidden sm:block w-4 h-4 text-navy-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-elevated overflow-hidden animate-slide-up">
                    <div className="p-4 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-navy-800 dark:to-navy-900 border-b border-slate-100 dark:border-navy-700">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-base font-bold text-white">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-navy-900 dark:text-white truncate">{displayName}</p>
                          <p className="text-xs text-navy-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                          {user?.username && <p className="text-xs text-brand-600 dark:text-brand-300 truncate mt-0.5">@{user.username}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 hover:text-brand-600 transition-colors"
                      >
                        <UserRound className="w-4 h-4" />
                        View Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!authenticated && (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                <Link to="/register" className="btn-primary text-sm">
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-navy-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-navy-800 animate-slide-up">
            {!authenticated ? (
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-navy-600 dark:text-slate-300 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-navy-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link to="/login" className="btn-secondary w-full mt-2" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link to="/register" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-navy-600 dark:text-slate-300 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-navy-800" onClick={() => setMobileOpen(false)}>
                  Open dashboard
                </Link>
                <Link to="/profile" className="px-3 py-2 text-sm font-medium text-navy-600 dark:text-slate-300 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-navy-800" onClick={() => setMobileOpen(false)}>
                  View profile
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
