import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { savedJobService } from '@/services/saved-job.service';
import { Button } from '@/components/ui/Button';

interface SaveButtonProps {
  jobId: string;
  isSaved?: boolean;
  size?: 'sm' | 'md';
}

export function SaveButton({ jobId, isSaved = false, size = 'md' }: SaveButtonProps) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => savedJobService.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => savedJobService.removeSavedJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const isLoading = saveMutation.isPending || unsaveMutation.isPending;

  if (size === 'sm') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-colors ${
          isSaved
            ? 'bg-accent/10 text-accent hover:bg-accent/20'
            : 'bg-background border border-border text-text-muted hover:border-accent hover:text-accent'
        }`}
        title={isSaved ? 'Remove from saved' : 'Save job'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isSaved ? 'accent' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  );
}
