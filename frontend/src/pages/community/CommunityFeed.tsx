import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PostCard } from '@/components/community/PostCard';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { Button } from '@/components/ui/Button';
import { Edit3, Users } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

export function CommunityFeed() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'newest' | 'popular'>('newest');

  const { 
    data: postsData, 
    isLoading, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['posts', filter],
    queryFn: ({ pageParam = 1 }) => postService.getPosts({ filter, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });

  const posts = postsData?.pages.flatMap(page => page.data) || [];

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('post:liked', () => refetch());
    socket.on('post:commented', () => refetch());

    return () => {
      socket.off('post:liked');
      socket.off('post:commented');
    };
  }, [socket, refetch]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        
        {/* Main Feed */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-text">Community</h1>
              <p className="text-sm text-text-muted">Connect, share, and learn with peers.</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Write Post</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6 border-b border-border">
            <button
              onClick={() => setFilter('newest')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                filter === 'newest' ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              Newest
              {filter === 'newest' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                filter === 'popular' ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              Popular
              {filter === 'popular' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-48 animate-pulse" />
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-surface border border-border rounded-2xl">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-1">No posts yet</h3>
                <p className="text-text-muted">Be the first to share something with the community.</p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
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
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <CommunitySidebar />
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </DashboardLayout>
  );
}
