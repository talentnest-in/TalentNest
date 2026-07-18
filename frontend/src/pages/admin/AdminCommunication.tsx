import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Send, Users, Briefcase, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const TARGET_ROLES = [
  { value: 'ALL', label: 'All Users', icon: Users, desc: 'Send to every registered user on the platform' },
  { value: 'FREELANCER', label: 'Freelancers Only', icon: Briefcase, desc: 'Target only users with the Freelancer role' },
  { value: 'CLIENT', label: 'Clients Only', icon: Building2, desc: 'Target only users with the Client role' },
];

export function AdminCommunication() {
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'ALL' });
  const [sent, setSent] = useState<{ count: number } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: async () => api.post('/admin/communication/broadcast', form),
    onSuccess: (res) => {
      setSent({ count: res.data?.message?.match(/\d+/)?.[0] || '?' });
      toast.success('Broadcast sent successfully!');
      setForm({ title: '', message: '', targetRole: 'ALL' });
    },
    onError: () => toast.error('Failed to send broadcast'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error('Title and message are required');
    }
    if (!confirm(`Send this notification to all ${form.targetRole === 'ALL' ? 'users' : form.targetRole.toLowerCase() + 's'}?`)) return;
    broadcastMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text">Mass Communication</h1>
        <p className="text-text-muted mt-1">Send in-app notifications to users by role</p>
      </div>

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-success shrink-0" />
          <p className="text-sm text-success font-medium">
            Broadcast successfully delivered to {sent.count} users!
          </p>
          <button onClick={() => setSent(null)} className="ml-auto text-success/60 hover:text-success text-lg">✕</button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Audience */}
        <div className="bg-surface border border-border/50 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text mb-4">1. Select Target Audience</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TARGET_ROLES.map(role => (
              <button
                key={role.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, targetRole: role.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.targetRole === role.value
                    ? 'border-accent bg-accent/10'
                    : 'border-border/50 hover:border-border hover:bg-background/50'
                }`}
              >
                <role.icon className={`w-5 h-5 mb-2 ${form.targetRole === role.value ? 'text-accent' : 'text-text-muted'}`} />
                <p className={`text-sm font-semibold ${form.targetRole === role.value ? 'text-accent' : 'text-text'}`}>
                  {role.label}
                </p>
                <p className="text-xs text-text-muted mt-1">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message Composition */}
        <div className="bg-surface border border-border/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text">2. Compose Notification</h2>

          <div>
            <label className="text-xs text-text-muted block mb-1.5">Notification Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., 🎉 New Feature Available!"
              maxLength={80}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{form.title.length}/80</p>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1.5">Message Body</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write the full notification message here..."
              rows={5}
              maxLength={500}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{form.message.length}/500</p>
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.message) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-surface border border-border/50 rounded-2xl p-6"
          >
            <h2 className="text-sm font-semibold text-text mb-4">3. Preview</h2>
            <div className="bg-background border border-border/50 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{form.title || 'Notification Title'}</p>
                <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{form.message || 'Your message will appear here.'}</p>
                <p className="text-xs text-text-muted mt-2">Just now · TalentNest</p>
              </div>
            </div>
          </motion.div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={broadcastMutation.isPending || !form.title || !form.message}
        >
          {broadcastMutation.isPending ? (
            'Sending...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Send Broadcast
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
