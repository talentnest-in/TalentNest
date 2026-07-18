import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  type?: 'levelup' | 'achievement';
}

export function ConfettiEffect({ trigger, type = 'achievement' }: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return;

    if (type === 'levelup') {
      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#F26A21', '#10B981', '#0B1F3A', '#f59e0b'] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#F26A21', '#10B981', '#0B1F3A', '#f59e0b'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 }, shapes: ['star'], colors: ['#F26A21', '#f59e0b', '#fde68a'], scalar: 1.2 });
      }, 300);
    } else {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.1, x: 0.85 }, colors: ['#F26A21', '#0B1F3A', '#f59e0b'] });
    }
  }, [trigger, type]);

  return null;
}
