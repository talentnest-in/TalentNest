import { useQuery } from '@tanstack/react-query';
import { TrendingUp, User, Briefcase, Users, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';

export function Communications() {
  const { user } = useAuth();

  const navItems = [
    { icon: TrendingUp, label: 'Dashboard', path: '/freelancer-dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Briefcase, label: 'Find Jobs', path: '/find-jobs' },
    { icon: Users, label: 'Applications', path: '/applications' },
    { icon: DollarSign, label: 'Offers', path: '/freelancer/offers' },
    { icon: FileText, label: 'Contracts', path: '/contracts' },
    { icon: MessageSquare, label: 'Messages', path: '/communications' },
  ];

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  });

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-text">Messages</h1>
          <p className="text-text-muted mt-1">Communicate with your clients and freelancers</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <MessageSquare className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <ConversationList conversations={conversations || []} currentUserId={user?.id || ''} />
        )}
      </div>
    </DashboardLayout>
  );
}
