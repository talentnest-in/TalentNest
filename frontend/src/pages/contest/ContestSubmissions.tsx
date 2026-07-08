import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { contestService } from '@/services/contest.service';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { ContestSubmissionStatus } from '@/types';
import { cn } from '@/components/ui/Button';
import {
  Code, Globe, PenTool, Video, FileText, Loader2,
  Trophy, Medal, Star, X, ChevronLeft
} from 'lucide-react';

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WINNER', label: 'Winner' },
];

export function ContestSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [winnerSelection, setWinnerSelection] = useState<{ winnerId: string; runnerUpId?: string } | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['contest-submissions', id, filter],
    queryFn: () => contestService.listSubmissions(id!, filter || undefined),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: string }) =>
      contestService.updateSubmissionStatus(id!, submissionId, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['contest-submissions', id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const winnerMutation = useMutation({
    mutationFn: ({ winnerId, runnerUpId }: { winnerId: string; runnerUpId?: string }) =>
      contestService.selectWinner(id!, winnerId, runnerUpId),
    onSuccess: () => {
      toast.success('Winner selected! Contest closed.');
      queryClient.invalidateQueries({ queryKey: ['contest-submissions', id] });
      navigate('/contests/manage');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<ContestSubmissionStatus, string> = {
    PENDING: 'bg-blue-500/15 text-blue-400',
    SHORTLISTED: 'bg-emerald-500/15 text-emerald-400',
    REJECTED: 'bg-red-500/15 text-red-400',
    WINNER: 'bg-yellow-500/15 text-yellow-400',
    RUNNER_UP: 'bg-gray-500/15 text-gray-400',
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/contests/manage')} className="p-2 hover:bg-surface rounded-xl text-text-muted hover:text-text transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">Contest Submissions</h1>
            <p className="text-sm text-text-muted">{submissions.length} total submissions</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-surface border border-border/50 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                filter === f.value ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Winner Selection Banner */}
        {winnerSelection && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-text text-sm">Winner selected</p>
              <p className="text-xs text-text-muted">{winnerSelection.runnerUpId ? 'Winner + Runner-up selected' : 'Winner selected. Optionally select a runner-up.'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setWinnerSelection(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => winnerMutation.mutate(winnerSelection!)}
                disabled={winnerMutation.isPending}
              >
                {winnerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4 mr-1" />}
                Confirm & Close Contest
              </Button>
            </div>
          </div>
        )}

        {/* Submissions List */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => (
              <div key={s.id} className={cn(
                'bg-surface border rounded-xl p-5 space-y-4 transition-colors',
                s.status === 'WINNER' ? 'border-yellow-500/40' :
                s.status === 'SHORTLISTED' ? 'border-emerald-500/30' :
                'border-border/50'
              )}>
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.participant?.avatar ? (
                      <img src={s.participant.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {s.participant?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-text">{s.participant?.name}</p>
                      <p className="text-xs text-text-muted">{new Date(s.submittedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusColors[s.status])}>
                    {s.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-text-muted">{s.description}</p>

                {/* Images */}
                {s.imageUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {s.imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="" className="h-24 w-24 object-cover rounded-xl flex-shrink-0 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-background border border-border px-2.5 py-1 rounded-full hover:border-primary transition-colors text-text-muted hover:text-primary"><Code className="w-3 h-3" /> GitHub</a>}
                  {s.liveUrl && <a href={s.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-background border border-border px-2.5 py-1 rounded-full hover:border-primary transition-colors text-text-muted hover:text-primary"><Globe className="w-3 h-3" /> Live</a>}
                  {s.figmaUrl && <a href={s.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-background border border-border px-2.5 py-1 rounded-full hover:border-primary transition-colors text-text-muted hover:text-primary"><PenTool className="w-3 h-3" /> Figma</a>}
                  {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-background border border-border px-2.5 py-1 rounded-full hover:border-primary transition-colors text-text-muted hover:text-primary"><Video className="w-3 h-3" /> Video</a>}
                  {s.pdfUrl && <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-background border border-border px-2.5 py-1 rounded-full hover:border-primary transition-colors text-text-muted hover:text-primary"><FileText className="w-3 h-3" /> PDF</a>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/30">
                  {s.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ submissionId: s.id, status: 'SHORTLISTED' })} className="text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                        <Star className="w-3.5 h-3.5 mr-1" /> Shortlist
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ submissionId: s.id, status: 'REJECTED' })} className="text-red-400 border-red-500/20 hover:bg-red-500/10">
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {s.status === 'SHORTLISTED' && (
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ submissionId: s.id, status: 'REJECTED' })} className="text-red-400 border-red-500/20 hover:bg-red-500/10">
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  )}
                  {s.status !== 'WINNER' && (
                    <Button
                      size="sm"
                      onClick={() => setWinnerSelection({ winnerId: s.participantId, runnerUpId: winnerSelection?.winnerId !== s.participantId ? winnerSelection?.winnerId : undefined })}
                      className="text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20"
                    >
                      <Trophy className="w-3.5 h-3.5 mr-1" />
                      {winnerSelection?.winnerId === s.participantId ? '✓ Winner' : 'Select as Winner'}
                    </Button>
                  )}
                  {winnerSelection?.winnerId !== s.participantId && s.status !== 'WINNER' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWinnerSelection((prev) => prev ? { ...prev, runnerUpId: s.participantId } : { winnerId: s.participantId })}
                    >
                      <Medal className="w-3.5 h-3.5 mr-1" />
                      {winnerSelection?.runnerUpId === s.participantId ? '✓ Runner-up' : 'Runner-up'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
