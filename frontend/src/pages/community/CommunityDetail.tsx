import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { communityService } from '@/services/community.service';
import { postService } from '@/services/post.service';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { ManageCommunityModal } from '@/components/community/ManageCommunityModal';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Calendar, ArrowLeft, LogOut, Settings, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';

export function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'rules'>('posts');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const { data: community, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: () => communityService.getCommunityBySlug(slug!),
    enabled: !!slug,
  });

  const { socket } = useSocket();

  const { 
    data: postsData, 
    isLoading: isPostsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['communityPosts', community?.id],
    queryFn: ({ pageParam = 1 }) => postService.getCommunityPosts(community!.id, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    enabled: !!community?.id,
  });

  const posts = postsData?.pages.flatMap(page => page.data) || [];

  useEffect(() => {
    if (!socket) return;
    
    socket.on('post:liked', () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts', community?.id] });
    });
    socket.on('post:commented', () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts', community?.id] });
    });

    return () => {
      socket.off('post:liked');
      socket.off('post:commented');
    };
  }, [socket, community?.id, queryClient]);

  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['communityMembers', community?.id],
    queryFn: () => communityService.getCommunityMembers(community!.id),
    enabled: !!community?.id && activeTab === 'members',
  });

  const joinMutation = useMutation({
    mutationFn: () => communityService.joinCommunity(community!.id),
    onSuccess: () => {
      toast.success('Joined community successfully!');
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['communityPosts', community?.id] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to join')
  });

  const leaveMutation = useMutation({
    mutationFn: () => communityService.leaveCommunity(community!.id),
    onSuccess: () => {
      toast.success('Left community');
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to leave')
  });

  const promoteMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: 'ADMIN' | 'MEMBER' }) => 
      communityService.promoteMember(community!.id, userId, role),
    onSuccess: () => {
      toast.success('Member role updated');
      queryClient.invalidateQueries({ queryKey: ['communityMembers', community?.id] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update role')
  });

  if (isCommunityLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
          <div className="h-48 bg-border rounded-2xl" />
          <div className="h-20 bg-border rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!community) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-text mb-2">Community Not Found</h2>
          <Button onClick={() => navigate('/community')}>Back to Communities</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isCreator = community.creatorId === user?.id;
  const isMember = community.isMember ?? false;
  
  const currentMember = membersData?.data.find(m => m.user?.id === user?.id);
  const isAdmin = isCreator || currentMember?.role === 'ADMIN';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </button>

        {/* Header */}
        <div className="bg-surface border border-border rounded-3xl overflow-hidden mb-6">
          <div className="h-48 md:h-64 relative bg-primary/10">
            {community.banner ? (
              <img src={community.banner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/30 to-accent/30" />
            )}
          </div>
          
          <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 md:-mt-16 mb-6">
              <div className="flex items-end gap-6">
                <div className="relative">
                  {community.logo ? (
                    <img src={community.logo} alt="Logo" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-surface object-cover bg-background shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-surface bg-primary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                      {community.name.charAt(0)}
                    </div>
                  )}
                  {community.type === 'PRIVATE' && (
                    <div className="absolute -top-2 -right-2 bg-warning text-white p-2 rounded-full shadow-lg" title="Private Community">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                </div>
                
                <div className="mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-text mb-1">{community.name}</h1>
                  <p className="text-sm text-text-muted font-medium">c/{community.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {isCreator ? (
                  <Button variant="outline" className="w-full md:w-auto" onClick={() => setIsManageModalOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                ) : isMember ? (
                  <Button
                    variant="outline"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                    className="w-full md:w-auto gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {leaveMutation.isPending ? 'Leaving...' : 'Leave'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {joinMutation.isPending ? 'Joining...' : 'Join Community'}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-text max-w-3xl mb-6">
              {community.description || 'Welcome to our community!'}
            </p>

            <div className="flex items-center gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span><strong className="text-text">{community._count?.members || 0}</strong> Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(community.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-border mb-6">
          {(['posts', 'members', 'rules'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-colors relative capitalize ${
                activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-1 text-left bg-background border border-border hover:border-primary/50 transition-colors rounded-full px-4 py-2.5 text-text-muted text-sm"
                  >
                    Create a post in {community.name}...
                  </button>
                </div>

                {isPostsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1,2].map(i => <div key={i} className="h-48 bg-surface rounded-2xl border border-border" />)}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-surface border border-border rounded-2xl">
                    <p className="text-text-muted">No posts yet. Be the first!</p>
                  </div>
                ) : (
                  <>
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} isAdmin={isAdmin} />
                    ))}
                    
                    {hasNextPage && (
                      <div className="pt-4 flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => fetchNextPage()} 
                          disabled={isFetchingNextPage}
                        >
                          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {isMembersLoading ? (
                  <div className="p-6 text-center text-text-muted">Loading members...</div>
                ) : (
                  <div className="divide-y divide-border">
                    {membersData?.data.map(member => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {member.user?.avatar ? (
                            <img src={member.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                              {member.user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-text">{member.user?.name} {community.creatorId === member.userId && <span className="text-xs ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">Creator</span>}</p>
                            <p className="text-xs text-text-muted capitalize">{member.role.toLowerCase()}</p>
                          </div>
                        </div>
                        {isCreator && member.userId !== user?.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => promoteMutation.mutate({ userId: member.userId, role: member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN' })}
                            disabled={promoteMutation.isPending}
                          >
                            {member.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-text mb-4">Community Rules</h3>
                {community.rules && community.rules.length > 0 ? (
                  <ol className="space-y-4 list-decimal list-inside text-text">
                    {community.rules.map((rule, idx) => (
                      <li key={idx} className="pl-2 pb-4 border-b border-border/50 last:border-0 last:pb-0">{rule}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-text-muted text-center py-8">No specific rules set for this community.</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div className="bg-surface border border-border rounded-2xl p-5">
               <h3 className="font-semibold text-text mb-3">About {community.name}</h3>
               <p className="text-sm text-text-muted mb-4">{community.description}</p>
               <div className="space-y-2 text-sm text-text">
                 <div className="flex justify-between">
                   <span className="text-text-muted">Visibility</span>
                   <span className="capitalize">{community.type.toLowerCase()}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-text-muted">Members</span>
                   <span>{community._count?.members || 0}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        communityId={community.id}
      />
      <ManageCommunityModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        community={community}
      />
    </DashboardLayout>
  );
}
