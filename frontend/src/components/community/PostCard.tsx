import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import type { Post } from '@/types';
import { Heart, MessageSquare, Share2, MoreHorizontal, FileText, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  isDetail?: boolean;
  isAdmin?: boolean;
}

export function PostCard({ post, isDetail = false, isAdmin = false }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mediaErrors, setMediaErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Check if user liked post
    if (user && post.likes) {
      setIsLiked(post.likes.some(like => like.userId === user.id));
    }
  }, [post, user]);

  const toggleLike = useMutation({
    mutationFn: () => postService.toggleLike(post.id),
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
      // Invalidate to update other views if needed, but local state handles immediate UI
    },
    onError: () => {
      toast.error('Failed to like post');
    }
  });

  const deletePost = useMutation({
    mutationFn: () => postService.deletePost(post.id),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (post.communityId) {
        queryClient.invalidateQueries({ queryKey: ['communityPosts', post.communityId] });
      }
      if (isDetail) navigate('/community');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  const reportPost = useMutation({
    mutationFn: () => postService.reportPost(post.id, 'Inappropriate content'),
    onSuccess: () => {
      toast.success('Post reported for review');
      setShowOptions(false);
    }
  });

  const pinPost = useMutation({
    mutationFn: () => postService.pinPost(post.id),
    onSuccess: () => {
      toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned');
      setShowOptions(false);
      queryClient.invalidateQueries({ queryKey: ['communityPosts', post.communityId] });
    }
  });

  const hidePost = useMutation({
    mutationFn: () => postService.hidePost(post.id),
    onSuccess: () => {
      toast.success(post.isHidden ? 'Post unhidden' : 'Post hidden');
      setShowOptions(false);
      queryClient.invalidateQueries({ queryKey: ['communityPosts', post.communityId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    toggleLike.mutate();
  };

  const innerContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {post.author?.avatar && !avatarError ? (
            <img src={post.author.avatar} alt={post.author.name || ''} className="w-10 h-10 rounded-full object-cover" onError={() => setAvatarError(true)} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {post.author?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-text text-sm hover:underline cursor-pointer">
              {post.author?.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {post.community && (
                <>
                  <span>•</span>
                  <Link to={`/community/${post.community.slug}`} className="hover:text-primary transition-colors hover:underline" onClick={(e) => e.stopPropagation()}>
                    {post.community.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOptions(!showOptions); }}
            className="p-2 hover:bg-border/50 rounded-full transition-colors text-text-muted"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-10">
                {post.authorId === user?.id || isAdmin ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePost.mutate(); }}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                    >
                      Delete Post
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); pinPost.mutate(); }}
                          className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                        >
                          {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); hidePost.mutate(); }}
                          className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                        >
                          {post.isHidden ? 'Unhide Post' : 'Hide Post'}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); reportPost.mutate(); }}
                    className="w-full text-left px-4 py-2 text-sm text-text flex items-center gap-2 hover:bg-background transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report Post
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-text whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      {post.type === 'IMAGE' && post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className={`grid gap-2 mb-4 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : post.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          {post.mediaUrls.map((url, index) => (
            mediaErrors[index] ? (
              <div key={index} className="rounded-xl w-full h-48 bg-background flex items-center justify-center text-text-muted text-sm">Image failed to load</div>
            ) : (
              <img key={index} src={url} alt="Post attachment" className="rounded-xl w-full h-auto object-cover max-h-96" onError={() => setMediaErrors(prev => ({ ...prev, [index]: true }))} />
            )
          ))}
        </div>
      )}

      {post.type === 'PDF' && post.mediaUrls && post.mediaUrls.length > 0 && (
        <a 
          href={post.mediaUrls[0]} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background mb-4 hover:border-primary/50 transition-colors"
        >
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-text text-sm">PDF Document</p>
            <p className="text-xs text-text-muted">Click to view</p>
          </div>
        </a>
      )}

      {post.type === 'LINK' && post.linkUrl && (
        <a 
          href={post.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block p-4 rounded-xl border border-border bg-background mb-4 hover:border-primary/50 transition-colors truncate text-primary text-sm hover:underline"
        >
          {post.linkUrl}
        </a>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-border/50">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? 'text-danger' : 'text-text-muted hover:text-danger'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount}
        </button>
        
        <Link 
          to={`/community/post/${post.id}`}
          onClick={(e) => { if (isDetail) e.preventDefault(); }}
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          {post._count?.comments || 0}
        </Link>
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`);
            toast.success('Link copied to clipboard');
          }}
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors ml-auto"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </>
  );

  const className = `block bg-surface border border-border rounded-2xl p-5 mb-4 transition-colors ${!isDetail ? 'hover:border-primary/50 cursor-pointer' : ''}`;

  return (
    <div 
      className={className} 
      onClick={() => {
        if (!isDetail) {
          navigate(`/community/post/${post.id}`);
        }
      }}
    >
      {innerContent}
    </div>
  );
}
