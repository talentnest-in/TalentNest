import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import type { PostComment } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';

interface CommentThreadProps {
  comment: PostComment;
  postId: string;
}

export function CommentThread({ comment, postId }: CommentThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [avatarError, setAvatarError] = useState<Record<string, boolean>>({});

  const deleteComment = useMutation({
    mutationFn: () => postService.deleteComment(postId, comment.id),
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  });

  const submitReply = useMutation({
    mutationFn: () => postService.addComment(postId, { content: replyContent, parentId: comment.id }),
    onSuccess: () => {
      setIsReplying(false);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  });

  return (
    <div className="mb-4">
      {/* Main Comment */}
      <div className="flex gap-3">
        {comment.author?.avatar && !avatarError[comment.author.id] ? (
          <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" onError={() => setAvatarError(prev => ({ ...prev, [comment.author!.id]: true }))} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-1">
            {comment.author?.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex-1">
          <div className="bg-surface border border-border rounded-2xl p-3 rounded-tl-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-text text-sm">{comment.author?.name}</span>
              <span className="text-xs text-text-muted">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-text whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 px-2">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-medium text-text-muted hover:text-primary transition-colors"
            >
              Reply
            </button>
            {user?.id === comment.authorId && (
              <button 
                onClick={() => deleteComment.mutate()}
                className="text-xs font-medium text-text-muted hover:text-danger transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="flex gap-3 mt-3 ml-11">
          <div className="flex-1">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-text focus:border-primary outline-none min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
              <Button size="sm" onClick={() => submitReply.mutate()} disabled={!replyContent.trim() || submitReply.isPending}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-11 space-y-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-3">
              <div className="flex-shrink-0 text-border">
                <CornerDownRight className="w-5 h-5 mt-1" />
              </div>
              {reply.author?.avatar ? (
                <img src={reply.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                  {reply.author?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1">
                <div className="bg-surface border border-border rounded-xl p-3 rounded-tl-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text text-sm">{reply.author?.name}</span>
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap">{reply.content}</p>
                </div>
                {user?.id === reply.authorId && (
                  <div className="mt-1 px-2">
                    <button 
                      onClick={() => postService.deleteComment(postId, reply.id).then(() => queryClient.invalidateQueries({ queryKey: ['post', postId] }))}
                      className="text-xs font-medium text-text-muted hover:text-danger transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
