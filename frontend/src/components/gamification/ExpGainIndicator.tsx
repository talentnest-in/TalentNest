import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpGainIndicatorProps {
  amount: number;
  description: string;
  onClose: () => void;
}

export function ExpGainIndicator({ amount, description, onClose }: ExpGainIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-surface border border-border rounded-xl shadow-lg p-4 flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"
            >
              <TrendingUp className="h-5 w-5 text-accent" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{description}</p>
              <p className="text-lg font-bold text-accent">+{amount} EXP</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
