import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { Button } from '@/components/ui/Button';
import { X, Image, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId?: string;
}

export function CreatePostModal({ isOpen, onClose, communityId }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'TEXT' | 'IMAGE' | 'PDF' | 'LINK'>('TEXT');
  const [linkUrl, setLinkUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async () => {
      let mediaUrls: string[] = [];
      
      if (files.length > 0) {
        setUploading(true);
        // Upload each file and get URLs
        for (const file of files) {
          const url = await postService.uploadMedia(file);
          mediaUrls.push(url);
        }
        setUploading(false);
      }

      return postService.createPost({
        content,
        type,
        mediaUrls,
        linkUrl: type === 'LINK' ? linkUrl : undefined,
        communityId,
      });
    },
    onSuccess: () => {
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: ['communityPosts', communityId] });
      }
      handleClose();
    },
    onError: (error: any) => {
      setUploading(false);
      toast.error(error.message || 'Failed to create post');
    }
  });

  const handleClose = () => {
    setContent('');
    setType('TEXT');
    setLinkUrl('');
    setFiles([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (type === 'IMAGE' && files.length + newFiles.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      if (type === 'PDF' && newFiles.length > 1) {
        toast.error('Only 1 PDF allowed');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Create Post</h2>
          <button onClick={handleClose} className="p-2 hover:bg-border/50 rounded-lg text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <textarea
            placeholder="What do you want to talk about?"
            className="w-full min-h-[120px] bg-transparent resize-none outline-none text-text placeholder:text-text-muted text-lg mb-4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {type === 'LINK' && (
            <input
              type="url"
              placeholder="https://..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text mb-4 focus:border-primary outline-none"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          )}

          {files.length > 0 && (
            <div className="mb-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-background border border-border rounded-lg p-2">
                  <span className="text-sm text-text truncate max-w-[80%]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-text-muted hover:text-danger">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              id="image-upload" 
              className="hidden" 
              multiple 
              accept="image/*"
              onChange={(e) => { setType('IMAGE'); handleFileChange(e); }}
            />
            <label htmlFor="image-upload" className={`p-2 rounded-lg cursor-pointer transition-colors ${type === 'IMAGE' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-border/50 hover:text-text'}`}>
              <Image className="w-5 h-5" />
            </label>

            <input 
              type="file" 
              id="pdf-upload" 
              className="hidden" 
              accept="application/pdf"
              onChange={(e) => { setType('PDF'); handleFileChange(e); }}
            />
            <label htmlFor="pdf-upload" className={`p-2 rounded-lg cursor-pointer transition-colors ${type === 'PDF' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-border/50 hover:text-text'}`}>
              <FileText className="w-5 h-5" />
            </label>

            <button
              onClick={() => setType('LINK')}
              className={`p-2 rounded-lg transition-colors ${type === 'LINK' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-border/50 hover:text-text'}`}
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>

          <Button 
            onClick={() => createPost.mutate()} 
            disabled={!content.trim() || createPost.isPending || uploading || (type === 'LINK' && !linkUrl)}
          >
            {createPost.isPending || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}
