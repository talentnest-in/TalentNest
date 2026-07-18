import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Zap, Plus, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const TIER_CFG: Record<string, string> = {
  BRONZE: 'bg-orange-900/20 text-orange-400 border-orange-500/20',
  SILVER: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
  GOLD: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PLATINUM: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  LEGEND: 'bg-accent/10 text-accent border-accent/20',
};

const MISSION_TYPE_CFG: Record<string, string> = {
  DAILY: 'bg-success/10 text-success border-success/20',
  WEEKLY: 'bg-accent/10 text-accent border-accent/20',
  MONTHLY: 'bg-error/10 text-error border-error/20',
};

type Badge = {
  id: string; key: string; title: string; description: string;
  icon: string; tier: string; category: string;
};

type Mission = {
  id: string; key: string; title: string; description: string;
  type: string; action: string; targetCount: number; expReward: number;
  isActive: boolean;
};

const emptyBadge = { key: '', title: '', description: '', icon: '🏆', tier: 'BRONZE', category: '' };
const emptyMission = { key: '', title: '', description: '', type: 'DAILY', action: '', targetCount: 1, expReward: 10, isActive: true };

export function AdminGamification() {
  const [activeTab, setActiveTab] = useState<'badges' | 'missions'>('badges');
  const [badgeForm, setBadgeForm] = useState<typeof emptyBadge | null>(null);
  const [missionForm, setMissionForm] = useState<typeof emptyMission | null>(null);
  const queryClient = useQueryClient();

  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => (await api.get('/admin/gamification/badges')).data as Badge[],
  });

  const { data: missions = [], isLoading: loadingMissions } = useQuery({
    queryKey: ['admin-missions'],
    queryFn: async () => (await api.get('/admin/gamification/missions')).data as Mission[],
  });

  const saveBadgeMutation = useMutation({
    mutationFn: (data: typeof emptyBadge) => api.post('/admin/gamification/badges', data),
    onSuccess: () => { toast.success('Badge saved!'); setBadgeForm(null); queryClient.invalidateQueries({ queryKey: ['admin-badges'] }); },
    onError: () => toast.error('Failed to save badge'),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/gamification/badges/${id}`),
    onSuccess: () => { toast.success('Badge deleted'); queryClient.invalidateQueries({ queryKey: ['admin-badges'] }); },
  });

  const saveMissionMutation = useMutation({
    mutationFn: (data: typeof emptyMission) => api.post('/admin/gamification/missions', data),
    onSuccess: () => { toast.success('Mission saved!'); setMissionForm(null); queryClient.invalidateQueries({ queryKey: ['admin-missions'] }); },
    onError: () => toast.error('Failed to save mission'),
  });

  const deleteMissionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/gamification/missions/${id}`),
    onSuccess: () => { toast.success('Mission deleted'); queryClient.invalidateQueries({ queryKey: ['admin-missions'] }); },
  });

  const tabs = [
    { id: 'badges', label: 'Badges', icon: Trophy },
    { id: 'missions', label: 'Missions', icon: Zap },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Gamification</h1>
          <p className="text-text-muted mt-1">Create and manage badges, missions, and EXP rewards</p>
        </div>
        {activeTab === 'badges' && (
          <Button onClick={() => setBadgeForm(emptyBadge)}>
            <Plus className="w-4 h-4 mr-2" /> New Badge
          </Button>
        )}
        {activeTab === 'missions' && (
          <Button onClick={() => setMissionForm(emptyMission)}>
            <Plus className="w-4 h-4 mr-2" /> New Mission
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl border border-border/50 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-accent text-white shadow-md shadow-accent/20'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Badge Create Form */}
      {badgeForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-accent/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Create New Badge</h3>
            <button onClick={() => setBadgeForm(null)} className="text-text-muted hover:text-text"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Icon (Emoji)</label>
              <input value={badgeForm.icon} onChange={e => setBadgeForm({...badgeForm, icon: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Unique Key</label>
              <input value={badgeForm.key} onChange={e => setBadgeForm({...badgeForm, key: e.target.value.toUpperCase()})}
                placeholder="e.g., FIRST_CONTRACT"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title</label>
              <input value={badgeForm.title} onChange={e => setBadgeForm({...badgeForm, title: e.target.value})}
                placeholder="e.g., First Contract"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Category</label>
              <input value={badgeForm.category} onChange={e => setBadgeForm({...badgeForm, category: e.target.value})}
                placeholder="e.g., FREELANCING"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Tier</label>
              <select value={badgeForm.tier} onChange={e => setBadgeForm({...badgeForm, tier: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text">
                {['BRONZE','SILVER','GOLD','PLATINUM','LEGEND'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <input value={badgeForm.description} onChange={e => setBadgeForm({...badgeForm, description: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setBadgeForm(null)}>Cancel</Button>
            <Button onClick={() => saveBadgeMutation.mutate(badgeForm)} disabled={saveBadgeMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> Create Badge
            </Button>
          </div>
        </motion.div>
      )}

      {/* Badges Grid */}
      {activeTab === 'badges' && (
        <div>
          {loadingBadges ? (
            <div className="py-16 text-center text-text-muted">Loading badges...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, idx) => (
                <motion.div key={badge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-surface border border-border/50 rounded-xl p-5 hover:border-accent/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-3">{badge.icon}</div>
                    <button onClick={() => { if (confirm('Delete badge?')) deleteBadgeMutation.mutate(badge.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold text-text">{badge.title}</p>
                  <p className="text-xs text-text-muted mt-1 mb-3 line-clamp-2">{badge.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_CFG[badge.tier] || ''}`}>
                      {badge.tier}
                    </span>
                    <span className="text-[10px] text-text-muted px-2 py-0.5 border border-border/50 rounded-full">
                      {badge.category}
                    </span>
                  </div>
                </motion.div>
              ))}
              {badges.length === 0 && !badgeForm && (
                <div className="col-span-3 py-16 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-text-muted opacity-20 mb-3" />
                  <p className="text-text-muted">No badges yet. Click "New Badge" to create one!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mission Create Form */}
      {missionForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-accent/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Create New Mission</h3>
            <button onClick={() => setMissionForm(null)} className="text-text-muted hover:text-text"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Key</label>
              <input value={missionForm.key} onChange={e => setMissionForm({...missionForm, key: e.target.value.toUpperCase()})}
                placeholder="e.g., APPLY_3_JOBS"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Type</label>
              <select value={missionForm.type} onChange={e => setMissionForm({...missionForm, type: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text">
                {['DAILY','WEEKLY','MONTHLY'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Title</label>
              <input value={missionForm.title} onChange={e => setMissionForm({...missionForm, title: e.target.value})}
                placeholder="e.g., Apply to 3 Jobs"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Action</label>
              <input value={missionForm.action} onChange={e => setMissionForm({...missionForm, action: e.target.value})}
                placeholder="e.g., apply_job"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Target Count</label>
              <input type="number" value={missionForm.targetCount} onChange={e => setMissionForm({...missionForm, targetCount: +e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">EXP Reward</label>
              <input type="number" value={missionForm.expReward} onChange={e => setMissionForm({...missionForm, expReward: +e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <input value={missionForm.description} onChange={e => setMissionForm({...missionForm, description: e.target.value})}
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setMissionForm(null)}>Cancel</Button>
            <Button onClick={() => saveMissionMutation.mutate(missionForm)} disabled={saveMissionMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> Create Mission
            </Button>
          </div>
        </motion.div>
      )}

      {/* Missions List */}
      {activeTab === 'missions' && (
        <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
          {loadingMissions ? (
            <div className="py-16 text-center text-text-muted">Loading missions...</div>
          ) : (
            <div className="divide-y divide-border/30">
              {missions.map((mission, idx) => (
                <motion.div key={mission.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-5 flex items-center justify-between hover:bg-background/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${MISSION_TYPE_CFG[mission.type]}`}>
                      {mission.type}
                    </div>
                    <div>
                      <p className="font-medium text-text">{mission.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{mission.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">+{mission.expReward} EXP</p>
                      <p className="text-xs text-text-muted">Target: {mission.targetCount}x</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${mission.isActive ? 'bg-success' : 'bg-text-muted'}`} title={mission.isActive ? 'Active' : 'Inactive'} />
                    <button onClick={() => { if (confirm('Delete mission?')) deleteMissionMutation.mutate(mission.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {missions.length === 0 && !missionForm && (
                <div className="py-16 text-center">
                  <Zap className="w-12 h-12 mx-auto text-text-muted opacity-20 mb-3" />
                  <p className="text-text-muted">No missions yet. Click "New Mission" to create one!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
