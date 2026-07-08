import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PostCard } from '@/components/community/PostCard';
import { CommentThread } from '@/components/community/CommentThread';
import { ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/Button';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [commentContent, setCommentContent] = useState('');

  const { data: post, isLoading, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postService.getPostById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('access_token') },
    });

    socket.emit('join_post', { postId: id });

    socket.on('post:liked', () => refetch());
    socket.on('post:commented', () => refetch());
    socket.on('post:reply', () => refetch());

    return () => {
      socket.emit('leave_post', { postId: id });
      socket.disconnect();
    };
  }, [id, refetch]);

  const handleAddComment = async () => {
    if (!commentContent.trim() || !id) return;
    try {
      await postService.addComment(id, { content: commentContent });
      setCommentContent('');
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-64 bg-surface rounded-2xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-text mb-2">Post Not Found</h2>
          <Button onClick={() => navigate('/community')}>Back to Community</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Group top-level comments
  const topLevelComments = post.comments?.filter(c => !c.parentId) || [];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <PostCard post={post} isDetail />

        <div className="mt-8">
          <h3 className="font-semibold text-text mb-4">Comments ({post._count?.comments || 0})</h3>
          
          {/* Add Comment */}
          <div className="flex gap-4 mb-8">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-primary outline-none min-h-[80px] resize-none"
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!commentContent.trim()}
              className="self-end"
            >
              Post
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {topLevelComments.length === 0 ? (
              <p className="text-text-muted text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              topLevelComments.map(comment => (
                <CommentThread key={comment.id} comment={comment} postId={post.id} />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
