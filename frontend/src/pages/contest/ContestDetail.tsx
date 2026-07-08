import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, Users, CheckCircle, AlertCircle,
  Code, Globe, PenTool, Video, UserPlus, LogOut, Bookmark, BookmarkCheck, Loader2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { contestService } from '@/services/contest.service';
import { Button } from '@/components/ui/Button';
import { WinnerAnnouncementCard } from '@/components/contest/WinnerAnnouncementCard';
import { SubmitEntryModal } from '@/components/contest/SubmitEntryModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/components/ui/Button';

type Tab = 'overview' | 'submissions' | 'participants';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTimeLeft(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return 'Deadline passed';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export function ContestDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['contest', slug],
    queryFn: () => contestService.getBySlug(slug!),
    enabled: !!slug,
  });

  const { data: myStatus, isLoading: myStatusLoading } = useQuery({
    queryKey: ['contest-my-status', contest?.id],
    queryFn: () => contestService.getMySubmission(contest!.id),
    enabled: !!contest && user?.role === 'FREELANCER',
  });

  const isParticipant = myStatus?.isParticipant ?? false;
  const mySubmission = myStatus?.submission;

  const isDeadlinePassed = contest ? new Date() > new Date(contest.submissionDeadline) : false;
  const isOwner = contest?.clientId === user?.id;
  const isPublished = contest?.status === 'PUBLISHED';
  const isClosed = contest?.status === 'CLOSED';

  const joinMutation = useMutation({
    mutationFn: () => contestService.join(contest!.id),
    onSuccess: () => {
      toast.success('Joined contest!');
      queryClient.invalidateQueries({ queryKey: ['contest', slug] });
      queryClient.invalidateQueries({ queryKey: ['contests', 'joined'] });
      queryClient.invalidateQueries({ queryKey: ['contest-my-status', contest?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () => contestService.leave(contest!.id),
    onSuccess: () => {
      toast.success('Left contest');
      queryClient.invalidateQueries({ queryKey: ['contest', slug] });
      queryClient.invalidateQueries({ queryKey: ['contest-my-status', contest?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => contestService.toggleSave(contest!.id),
    onSuccess: (data) => {
      setSaved(data.saved);
      toast.success(data.saved ? 'Saved!' : 'Removed from saved');
    },
  });

  if (contestLoading || (user?.role === 'FREELANCER' && myStatusLoading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contest) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-text-muted">
          Contest not found
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'submissions', label: `Submissions${isClosed ? '' : ''}` },
    { id: 'participants', label: `Participants (${contest._count?.participants ?? 0})` },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-surface">
          <div className="relative h-56 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10">
            {contest.featuredImage && (
              <img src={contest.featuredImage} alt={contest.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-medium text-text-muted bg-border/30 px-2.5 py-1 rounded-full">
                    {contest.category}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    contest.status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-400' :
                    contest.status === 'CLOSED' ? 'bg-gray-500/15 text-gray-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>{contest.status}</span>
                </div>
                <h1 className="text-2xl font-bold text-text">{contest.title}</h1>
                {contest.client && (
                  <p className="text-sm text-text-muted mt-1">by {contest.client.name}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {user?.role === 'FREELANCER' && (
                  <button
                    onClick={() => saveMutation.mutate()}
                    className="p-2.5 bg-background border border-border rounded-xl hover:border-primary transition-colors"
                  >
                    {saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4 text-text-muted" />}
                  </button>
                )}
                {isOwner && (
                  <>
                    <Button size="sm" onClick={() => navigate(`/contests/${contest.id}/submissions`)}>
                      Review Submissions
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/contests/manage`)}>
                      Manage
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-yellow-400">${Number(contest.prizeAmount).toLocaleString()}</p>
                <p className="text-xs text-text-muted mt-0.5">Prize</p>
              </div>
              <div className="bg-background rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text">{contest._count?.participants ?? 0}</p>
                <p className="text-xs text-text-muted mt-0.5">Participants</p>
              </div>
              <div className="bg-background rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${isDeadlinePassed ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatTimeLeft(contest.submissionDeadline)}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Deadline</p>
              </div>
              <div className="bg-background rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text">{contest.viewCount}</p>
                <p className="text-xs text-text-muted mt-0.5">Views</p>
              </div>
            </div>

            {/* Freelancer join/submit buttons */}
            {user?.role === 'FREELANCER' && isPublished && (
              <div className="flex gap-3">
                {!isParticipant ? (
                  <Button
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending || isDeadlinePassed}
                    className="flex items-center gap-2"
                  >
                    {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Join Contest
                  </Button>
                ) : (
                  <>
                    {!isDeadlinePassed && (
                      <Button onClick={() => setSubmitOpen(true)} className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        {mySubmission ? 'Edit Submission' : 'Submit Entry'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => leaveMutation.mutate()}
                      disabled={leaveMutation.isPending || !!mySubmission}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Leave
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* My submission status */}
            {mySubmission && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                mySubmission.status === 'WINNER' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                mySubmission.status === 'SHORTLISTED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                mySubmission.status === 'REJECTED' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                'bg-primary/10 text-primary border border-primary/20'
              }`}>
                <CheckCircle className="w-4 h-4" />
                Your submission: {mySubmission.status}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border/50 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Winner card if closed */}
            {isClosed && contest.winner && <WinnerAnnouncementCard contest={contest} />}

            {/* Description */}
            <div className="bg-surface border border-border/50 rounded-2xl p-6">
              <h2 className="font-bold text-text mb-3">About this Contest</h2>
              <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">{contest.description}</p>
            </div>

            {/* Skills */}
            <div className="bg-surface border border-border/50 rounded-2xl p-6">
              <h2 className="font-bold text-text mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {contest.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Rules */}
            {contest.rules.length > 0 && (
              <div className="bg-surface border border-border/50 rounded-2xl p-6">
                <h2 className="font-bold text-text mb-3">Contest Rules</h2>
                <ul className="space-y-2">
                  {contest.rules.map((rule, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text-muted">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Judging Criteria */}
            {contest.judgingCriteria.length > 0 && (
              <div className="bg-surface border border-border/50 rounded-2xl p-6">
                <h2 className="font-bold text-text mb-3">Judging Criteria</h2>
                <ul className="space-y-2">
                  {contest.judgingCriteria.map((c, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text-muted">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-surface border border-border/50 rounded-2xl p-6">
              <h2 className="font-bold text-text mb-3">Timeline</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Registration Deadline</p>
                  <p className="font-medium text-text text-sm">{formatDate(contest.registrationDeadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Submission Deadline</p>
                  <p className="font-medium text-text text-sm">{formatDate(contest.submissionDeadline)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'participants' && (
          <ParticipantsTab contestId={contest.id} />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsTab contestId={contest.id} isOwner={isOwner} isClosed={isClosed} myUserId={user?.id} />
        )}
      </div>

      {/* Submit Modal */}
      {submitOpen && (
        <SubmitEntryModal
          isOpen={submitOpen}
          onClose={() => setSubmitOpen(false)}
          contestId={contest.id}
          existingSubmission={mySubmission}
        />
      )}
    </DashboardLayout>
  );
}

function ParticipantsTab({ contestId }: { contestId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contest-participants', contestId],
    queryFn: () => contestService.listParticipants(contestId),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  const participants = data ?? [];

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No participants yet</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border/50 rounded-2xl p-6">
      <h3 className="font-bold text-text mb-4">Participants ({participants.length})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background">
            {p.user?.avatar ? (
              <img src={p.user.avatar} alt={p.user.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {p.user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-medium text-text text-sm">{p.user?.name}</p>
              <p className="text-xs text-text-muted">Joined {new Date(p.joinedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionsTab({
  contestId, isOwner, isClosed
}: { contestId: string; isOwner?: boolean; isClosed?: boolean; myUserId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contest-submissions', contestId],
    queryFn: () => contestService.listSubmissions(contestId),
    enabled: !!isOwner,
  });

  if (!isOwner) {
    return (
      <div className="text-center py-12 text-text-muted">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>Only the contest owner can view all submissions</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  const submissions = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text">All Submissions ({submissions.length})</h3>
        {isOwner && !isClosed && (
          <Button size="sm" onClick={() => window.location.href = `/contests/${contestId}/submissions`}>
            Review & Manage
          </Button>
        )}
      </div>
      {submissions.map((s) => (
        <div key={s.id} className="bg-surface border border-border/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {s.participant?.avatar ? (
                <img src={s.participant.avatar} alt={s.participant.name ?? ''} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {s.participant?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-text text-sm">{s.participant?.name}</p>
                <p className="text-xs text-text-muted">{new Date(s.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              s.status === 'WINNER' ? 'bg-yellow-500/15 text-yellow-400' :
              s.status === 'SHORTLISTED' ? 'bg-emerald-500/15 text-emerald-400' :
              s.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
              'bg-primary/10 text-primary'
            }`}>
              {s.status}
            </span>
          </div>
          <p className="text-sm text-text-muted">{s.description}</p>
          {s.imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {s.imageUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="h-20 w-20 object-cover rounded-lg flex-shrink-0" />
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Code className="w-3 h-3" /> GitHub</a>}
            {s.liveUrl && <a href={s.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Globe className="w-3 h-3" /> Live</a>}
            {s.figmaUrl && <a href={s.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><PenTool className="w-3 h-3" /> Figma</a>}
            {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Video className="w-3 h-3" /> Video</a>}
          </div>
        </div>
      ))}
    </div>
  );
}
