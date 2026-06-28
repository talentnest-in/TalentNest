import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-primary text-white px-4 py-6">
        <div className="px-2 mb-10">
          <BrandLogo size="medium" showText showTagline={false} />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                window.location.pathname === path
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white transition-colors"
              title="Log out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
