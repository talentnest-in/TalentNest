import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from './ConfettiEffect';

interface AchievementUnlockToastProps {
  achievement: { title: string; description: string; icon: string; expReward: number; };
  onClose: () => void;
}

export function AchievementUnlockToast({ achievement, onClose }: AchievementUnlockToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowConfetti(true), 100);
    const t2 = setTimeout(() => { setIsVisible(false); setTimeout(onClose, 300); }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  const close = () => { setIsVisible(false); setTimeout(onClose, 300); };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <ConfettiEffect trigger={showConfetti} type="achievement" />
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-6 right-6 z-50 max-w-sm"
          >
            <div className="relative bg-surface border border-border rounded-xl shadow-xl p-4 overflow-hidden">
              {/* Accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent/40" />

              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
                transition={{ duration: 6, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 w-full bg-accent rounded-b-xl origin-left"
              />

              <button onClick={close} className="absolute top-3 right-3 text-text-muted hover:text-text transition-colors">
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 pr-4">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={{ boxShadow: ['0 0 0px rgba(242,106,33,0)', '0 0 16px rgba(242,106,33,0.4)', '0 0 0px rgba(242,106,33,0)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl"
                  >
                    {achievement.icon || '🏆'}
                  </motion.div>
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-4 w-4 text-accent" />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-0.5">
                    🎖️ Achievement Unlocked!
                  </p>
                  <h4 className="font-bold text-text text-sm leading-tight mb-1">{achievement.title}</h4>
                  <p className="text-xs text-text-muted leading-tight mb-2">{achievement.description}</p>
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent"
                  >
                    ⚡ +{achievement.expReward} EXP
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
