import type { FreelancerProfile } from '@/types';
import { motion } from 'framer-motion';

interface ProfileProgressCardProps {
  profile: FreelancerProfile | null;
}

export function ProfileProgressCard({ profile }: ProfileProgressCardProps) {
  const calculateProgress = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.title && profile.bio) score += 20;
    if (profile.skills.length > 0) score += 20;
    if (profile.experiences.length > 0) score += 20;
    if (profile.educations.length > 0) score += 20;
    if (profile.resumeUrl) score += 20;
    return score;
  };

  const progress = calculateProgress();

  return (
    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold text-text mb-2">Profile Completion</h3>
      <div className="w-full bg-background rounded-full h-2.5 mb-4 overflow-hidden border border-border">
        <motion.div
          className="bg-accent h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-sm text-text-muted">
        Your profile is <span className="font-semibold text-text">{progress}%</span> complete.
        {progress < 100 && ' Complete it to attract more clients!'}
      </p>
    </div>
  );
}
