import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { LogOut, Menu, X, Trophy } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { freelancerNavItems, clientNavItems } from '@/config/navigation';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
}

export function DashboardLayout({ children, navItems: customNavItems }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotifCount, clearUnreadNotifCount } = useSocket();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = customNavItems || (user?.role === 'CLIENT' ? clientNavItems : freelancerNavItems);

  // Fetch user gamification stats
  const { data: stats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats').then(res => res.data),
    enabled: !!user,
  });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleBellClick = () => {
    setIsNotificationOpen((prev) => !prev);
    if (!isNotificationOpen) clearUnreadNotifCount();
  };

  const SidebarContent = () => (
    <>
      <div className="px-2 mb-10 flex items-center justify-between">
        <BrandLogo size="medium" showText showTagline={false} onDark />
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              window.location.pathname === path
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 px-3">
          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-accent">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Level Badge */}
            {stats && (
              <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-full mr-1">
                <Trophy className="h-3 w-3 text-accent" />
                <span className="text-xs font-semibold text-accent">Lvl {stats.level}</span>
              </div>
            )}
            <div className="relative hidden lg:block">
              <NotificationBell
                unreadCount={unreadNotifCount}
                onClick={handleBellClick}
              />
              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>
            <button
              onClick={handleLogout}
              className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200 flex-shrink-0"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-primary text-white px-4 py-6 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary text-white px-4 py-6 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative z-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-surface flex items-center gap-4 px-4 lg:px-8 shrink-0">
          {/* Hamburger Menu (Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text hover:bg-background rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center">
            {/* Search Component */}
            <div className="w-full max-w-xl">
              <GlobalSearch />
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-1">
             <div className="relative">
                <NotificationBell
                  unreadCount={unreadNotifCount}
                  onClick={handleBellClick}
                />
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
