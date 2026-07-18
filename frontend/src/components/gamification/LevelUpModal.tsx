import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from './ConfettiEffect';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

const LEVEL_PERKS: Record<number, string> = {
  5: 'Unlock "Rising Star" badge eligibility',
  10: 'Profile boosted in search results',
  20: 'Access to exclusive contests',
  50: 'Platform commission reduced by 1%',
};

export function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [count, setCount] = useState(newLevel - 1);

  useEffect(() => {
    const t1 = setTimeout(() => setShowConfetti(true), 200);
    const t2 = setTimeout(() => {
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev >= newLevel) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 80);
      return () => clearInterval(interval);
    }, 400);
    const t3 = setTimeout(() => { setIsVisible(false); setTimeout(onClose, 300); }, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose, newLevel]);

  const perk = LEVEL_PERKS[newLevel];
  const close = () => { setIsVisible(false); setTimeout(onClose, 300); };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <ConfettiEffect trigger={showConfetti} type="levelup" />
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={close}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ duration: 0.4, type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto bg-surface border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
            >
              {/* Subtle accent glow at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-accent rounded-t-2xl" />

              <button onClick={close} className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors">
                <X className="h-5 w-5" />
              </button>

              <div className="text-center pt-2">
                {/* Trophy */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                  className="inline-flex items-center justify-center relative mb-6"
                >
                  <div className="h-24 w-24 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                      <Trophy className="h-12 w-12 text-accent" />
                    </motion.div>
                  </div>
                  <motion.div animate={{ opacity: [0.5, 1, 0.5], rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </motion.div>
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute -bottom-1 -left-1">
                    <Zap className="h-5 w-5 text-accent" />
                  </motion.div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">
                  Level Up!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring', damping: 15 }}
                  className="text-7xl font-black text-primary mb-2"
                >
                  {count}
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-text-muted text-sm mb-6">
                  Congratulations! You've leveled up!
                </motion.p>

                {perk && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 text-left"
                  >
                    <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Milestone Unlocked
                    </p>
                    <p className="text-sm text-text">{perk}</p>
                  </motion.div>
                )}

                {!perk && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="bg-background rounded-xl p-4 mb-6 border border-border"
                  >
                    <p className="text-sm text-text-muted">Keep earning EXP to unlock special perks at levels 5, 10, 20, and 50!</p>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={close}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-accent/20"
                >
                  Keep Going! 🚀
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
