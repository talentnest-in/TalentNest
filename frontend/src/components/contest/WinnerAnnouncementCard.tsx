import { Trophy, Medal, ExternalLink, Code, Globe, PenTool } from 'lucide-react';
import type { Contest } from '@/types';

interface WinnerAnnouncementCardProps {
  contest: Contest;
}

export function WinnerAnnouncementCard({ contest }: WinnerAnnouncementCardProps) {
  if (!contest.winner) return null;

  const winnerSubmission = contest.submissions?.find(
    (s) => s.participantId === contest.winnerId && s.status === 'WINNER'
  );
  const runnerUpSubmission = contest.submissions?.find(
    (s) => s.participantId === contest.runnerUpId && s.status === 'RUNNER_UP'
  );

  return (
    <div className="bg-gradient-to-br from-yellow-500/10 via-primary/5 to-purple-500/10 border border-yellow-500/30 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-bold text-text text-lg">Contest Winners</h3>
          <p className="text-xs text-text-muted">
            Prize of ${Number(contest.prizeAmount).toLocaleString()} awarded
          </p>
        </div>
        <span className="ml-auto text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full">
          CLOSED
        </span>
      </div>

      {/* Winner */}
      <div className="bg-surface border border-yellow-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-3 flex-1">
            {contest.winner.avatar ? (
              <img src={contest.winner.avatar} alt={contest.winner.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {contest.winner.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-text">{contest.winner.name}</p>
              <p className="text-xs text-yellow-400 font-medium">🏆 Winner · ${Number(contest.prizeAmount).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Winner submission links */}
        {winnerSubmission && (
          <div className="flex flex-wrap gap-2 pt-1">
            {winnerSubmission.githubUrl && (
              <a href={winnerSubmission.githubUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                <Code className="w-3 h-3" /> GitHub
              </a>
            )}
            {winnerSubmission.liveUrl && (
              <a href={winnerSubmission.liveUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                <Globe className="w-3 h-3" /> Live Demo
              </a>
            )}
            {winnerSubmission.figmaUrl && (
              <a href={winnerSubmission.figmaUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                <PenTool className="w-3 h-3" /> Figma
              </a>
            )}
            {winnerSubmission.imageUrls.length > 0 && (
              <a href={winnerSubmission.imageUrls[0]} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                <ExternalLink className="w-3 h-3" /> Preview
              </a>
            )}
          </div>
        )}
      </div>

      {/* Runner Up */}
      {contest.runnerUp && (
        <div className="bg-surface border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center shrink-0">
              <Medal className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 flex-1">
              {contest.runnerUp.avatar ? (
                <img src={contest.runnerUp.avatar} alt={contest.runnerUp.name ?? ''} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 font-bold">
                  {contest.runnerUp.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-text">{contest.runnerUp.name}</p>
                <p className="text-xs text-gray-400 font-medium">🥈 Runner-up</p>
              </div>
            </div>
          </div>
          {runnerUpSubmission && (
            <div className="flex flex-wrap gap-2 pt-3">
              {runnerUpSubmission.githubUrl && (
                <a href={runnerUpSubmission.githubUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                  <Code className="w-3 h-3" /> GitHub
                </a>
              )}
              {runnerUpSubmission.liveUrl && (
                <a href={runnerUpSubmission.liveUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors text-text-muted hover:text-text">
                  <Globe className="w-3 h-3" /> Live Demo
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
