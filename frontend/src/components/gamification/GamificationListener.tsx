import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function GamificationListener() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    socket.on('gamification:exp_gained', (data: { amount: number; total: number; action: string }) => {
      toast.success(`Gained ${data.amount} EXP!`);
      // Invalidate relevant queries so progress bars update instantly
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-missions'] });
      queryClient.invalidateQueries({ queryKey: ['available-missions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    });

    socket.on('gamification:level_up', (data: { oldLevel: number; newLevel: number; totalExp: number }) => {
      toast.success(`Level Up! You reached level ${data.newLevel} 🎉`, {
        duration: 5000,
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    });

    socket.on('gamification:achievement_unlocked', (data: { achievement: any }) => {
      toast.success(`Achievement Unlocked: ${data.achievement.title} 🏆`, {
        description: data.achievement.description,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    });

    socket.on('gamification:badge_earned', (data: { badge: any }) => {
      toast.success(`Badge Earned: ${data.badge.title} 🏅`, {
        description: data.badge.description,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    });

    socket.on('gamification:mission_complete', (data: { mission: any; reward: number }) => {
      toast.success(`Mission Complete: ${data.mission.title} 🎯`, {
        description: `You earned ${data.reward} bonus EXP!`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['user-missions'] });
      queryClient.invalidateQueries({ queryKey: ['available-missions'] });
    });

    socket.on('gamification:mission_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['user-missions'] });
      queryClient.invalidateQueries({ queryKey: ['available-missions'] });
    });

    return () => {
      socket.off('gamification:exp_gained');
      socket.off('gamification:level_up');
      socket.off('gamification:achievement_unlocked');
      socket.off('gamification:badge_earned');
      socket.off('gamification:mission_complete');
      socket.off('gamification:mission_updated');
    };
  }, [socket, queryClient]);

  return null;
}
