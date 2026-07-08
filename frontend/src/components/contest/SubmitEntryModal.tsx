import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { contestService, type SubmitEntryPayload } from '@/services/contest.service';
import {
  Upload, Code, Globe, PenTool, Video, FileText, ImageIcon, X, Loader2, Link2
} from 'lucide-react';

interface SubmitEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  existingSubmission?: {
    description: string;
    imageUrls: string[];
    pdfUrl?: string | null;
    zipUrl?: string | null;
    githubUrl?: string | null;
    liveUrl?: string | null;
    figmaUrl?: string | null;
    videoUrl?: string | null;
  } | null;
}

export function SubmitEntryModal({ isOpen, onClose, contestId, existingSubmission }: SubmitEntryModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!existingSubmission;

  const [description, setDescription] = useState(existingSubmission?.description ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(existingSubmission?.imageUrls ?? []);
  const [pdfUrl, setPdfUrl] = useState(existingSubmission?.pdfUrl ?? '');
  const [zipUrl, setZipUrl] = useState(existingSubmission?.zipUrl ?? '');
  const [githubUrl, setGithubUrl] = useState(existingSubmission?.githubUrl ?? '');
  const [liveUrl, setLiveUrl] = useState(existingSubmission?.liveUrl ?? '');
  const [figmaUrl, setFigmaUrl] = useState(existingSubmission?.figmaUrl ?? '');
  const [videoUrl, setVideoUrl] = useState(existingSubmission?.videoUrl ?? '');
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitEntryPayload) =>
      isEdit
        ? contestService.updateSubmission(contestId, payload)
        : contestService.submit(contestId, payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Submission updated!' : 'Entry submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
      queryClient.invalidateQueries({ queryKey: ['my-submission', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contests', 'joined'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit entry'),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageUrls.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => contestService.uploadImage(f)));
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please write a description');
      return;
    }
    submitMutation.mutate({
      description: description.trim(),
      imageUrls,
      pdfUrl: pdfUrl.trim() || null,
      zipUrl: zipUrl.trim() || null,
      githubUrl: githubUrl.trim() || null,
      liveUrl: liveUrl.trim() || null,
      figmaUrl: figmaUrl.trim() || null,
      videoUrl: videoUrl.trim() || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Submission' : 'Submit Your Entry'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your entry, approach, and key features..."
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        {/* Images (max 5) */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Images (max 5)</span>
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {imageUrls.length < 5 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </button>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </div>

        {/* URL Inputs */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text">Links & Files</p>
          {[
            { icon: Code, label: 'GitHub URL', value: githubUrl, setter: setGithubUrl, placeholder: 'https://github.com/...' },
            { icon: Globe, label: 'Live Demo URL', value: liveUrl, setter: setLiveUrl, placeholder: 'https://your-project.com' },
            { icon: PenTool, label: 'Figma URL', value: figmaUrl, setter: setFigmaUrl, placeholder: 'https://figma.com/...' },
            { icon: Video, label: 'Video URL', value: videoUrl, setter: setVideoUrl, placeholder: 'https://youtube.com/watch?v=...' },
            { icon: FileText, label: 'PDF URL', value: pdfUrl, setter: setPdfUrl, placeholder: 'https://drive.google.com/...' },
            { icon: Link2, label: 'ZIP / Archive URL', value: zipUrl, setter: setZipUrl, placeholder: 'https://drive.google.com/...' },
          ].map(({ icon: Icon, label, value, setter, placeholder }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="url"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitMutation.isPending || uploading}>
            {submitMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : isEdit ? 'Update Submission' : 'Submit Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
