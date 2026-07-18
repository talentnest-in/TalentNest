import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Shield, Bell, Menu, X, Users, BarChart2, Settings, DollarSign, Trophy, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Moderation', href: '/admin/moderation', icon: Shield },
    { name: 'Finance', href: '/admin/finance', icon: DollarSign },
    { name: 'Gamification', href: '/admin/gamification', icon: Trophy },
    { name: 'Broadcast', href: '/admin/communication', icon: MessageSquarePlus },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-border/50 transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-accent/10 text-accent font-medium' 
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text'} transition-colors`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-hover">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">Administrator</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-3" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 sm:px-6 bg-surface border-b border-border/50 shrink-0 z-20">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-bold text-text">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-muted hover:text-text transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <button onClick={toggleMobileMenu} className="p-2 text-text-muted hover:text-text transition-colors">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-background/80 backdrop-blur-md border-b border-border/50 shrink-0 z-10 sticky top-0">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-muted hover:text-accent transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-surface shadow-2xl z-40 lg:hidden flex flex-col"
              >
                <div className="h-16 flex items-center justify-between px-6 border-b border-border/50">
                  <span className="text-lg font-semibold text-text">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-muted hover:text-text transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${isActive ? 'bg-accent/10 text-accent font-medium' : 'text-text-muted hover:bg-surface-hover hover:text-text'}
                        `}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-base">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-border/50">
                  <Button variant="outline" className="w-full" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
