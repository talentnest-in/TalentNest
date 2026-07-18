import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

interface BadgeEarnedCardProps {
  badge: { title: string; description: string; tier: string; icon: string; imageUrl: string | null; };
  earnedAt: string;
}

const TIER_CONFIG = {
  BRONZE: { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'bg-amber-50 text-amber-600', label: '🥉 Bronze', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
  SILVER: { badge: 'bg-gray-50 text-gray-600 border-gray-200', icon: 'bg-gray-50 text-gray-500', label: '🥈 Silver', hover: 'hover:border-gray-300 hover:shadow-gray-100' },
  GOLD: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: 'bg-yellow-50 text-yellow-600', label: '🥇 Gold', hover: 'hover:border-yellow-300 hover:shadow-yellow-100' },
  PLATINUM: { badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'bg-purple-50 text-purple-600', label: '💎 Platinum', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
  DIAMOND: { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: 'bg-cyan-50 text-cyan-600', label: '🔷 Diamond', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' },
};

export function BadgeEarnedCard({ badge, earnedAt }: BadgeEarnedCardProps) {
  const config = TIER_CONFIG[badge.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.BRONZE;
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rx = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -6;
    const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 6;
    setTilt({ x: rx, y: ry });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      className={`bg-surface border border-border rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all duration-200 ${config.hover}`}
    >
      <div className="flex items-start gap-4">
        <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 border border-border text-2xl ${config.icon}`}>
          {badge.icon || (badge.imageUrl ? (
            <img src={badge.imageUrl} alt={badge.title} className="h-10 w-10 object-contain" />
          ) : (
            <Award className="h-7 w-7" />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${config.badge}`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-text text-sm mb-1">{badge.title}</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-2">{badge.description}</p>
          <p className="text-xs text-text-muted">
            Earned {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
