import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Briefcase,
  ClipboardList,
  Mic,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Resume', icon: Upload },
  { to: '/job-match', label: 'Job Matching', icon: Briefcase },
  { to: '/interview-plan', label: 'Interview Planning', icon: ClipboardList },
  { to: '/mock-interview', label: 'Mock Interview', icon: Mic },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: { label: string; to?: string }[];
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-navy-900 border-r border-navy-800 sticky top-16 self-start h-[calc(100vh-4rem)]">
          <div className="p-5 border-b border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-sm font-semibold text-navy-950 shadow-soft">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-100 truncate">
                  {user?.username || user?.first_name || 'User'}
                </p>
                <p className="text-xs text-brand-300 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-brand-500 text-navy-950 shadow-sm'
                      : 'text-brand-100 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-navy-800">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-100 hover:bg-error-500/15 hover:text-error-300 transition-all"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-navy-900 flex flex-col animate-slide-up shadow-elevated">
              <div className="p-4 border-b border-navy-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-100">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-brand-300 hover:bg-navy-800 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive(link.to)
                          ? 'bg-brand-500 text-navy-950'
                          : 'text-brand-100 hover:bg-navy-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-100 hover:bg-error-500/15 hover:text-error-300 transition-all"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between bg-navy-900 border-b border-navy-800 px-4 py-3 sticky top-16 z-30">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-brand-100 hover:bg-navy-800 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-brand-100">{title || 'Dashboard'}</span>
            <div className="w-9" />
          </div>

          {/* Page header */}
          {(title || breadcrumbs) && (
            <div className="hidden md:block bg-white border-b border-slate-200 px-8 py-4">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-navy-400 mb-1">
                  {breadcrumbs.map((bc, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {bc.to ? (
                        <Link to={bc.to} className="hover:text-brand-600 transition-colors">{bc.label}</Link>
                      ) : (
                        <span>{bc.label}</span>
                      )}
                      {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
                    </span>
                  ))}
                </div>
              )}
              {title && <h1 className="text-xl font-bold text-navy-900">{title}</h1>}
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

