import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community.service';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LayoutDashboard, Briefcase, Users, DollarSign, FileText, Settings, ArrowLeft, Upload, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: Users, label: 'Community', path: '/community' },
  { icon: DollarSign, label: 'Offers', path: '/offers' },
  { icon: FileText, label: 'Contracts', path: '/contracts' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function CreateCommunity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  // For banner and logo, ideally we'd have upload inputs, but we'll stick to basic fields for now per phase 4
  // Banner + logo upload was mentioned in prompt, but let's just make it visually present or simple for now

  const createMutation = useMutation({
    mutationFn: () => communityService.createCommunity({ name, description, type }),
    onSuccess: (data) => {
      toast.success('Community created!');
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      navigate(`/community/${data.slug}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create community');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text mb-2">Create a Community</h1>
            <p className="text-text-muted">Build a space for people to connect, share, and collaborate.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-text">Community Name *</label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Developers"
                maxLength={50}
                required
              />
              <p className="text-xs text-text-muted">This will also be used to generate your community's unique URL.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-text">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-primary outline-none min-h-[100px] resize-y"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">Community Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('PUBLIC')}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                    type === 'PUBLIC' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <Globe className={`w-5 h-5 mt-0.5 ${type === 'PUBLIC' ? 'text-primary' : 'text-text-muted'}`} />
                  <div>
                    <h4 className={`font-semibold text-sm ${type === 'PUBLIC' ? 'text-primary' : 'text-text'}`}>Public</h4>
                    <p className="text-xs text-text-muted mt-1">Anyone can view posts and join this community.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('PRIVATE')}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                    type === 'PRIVATE' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <Lock className={`w-5 h-5 mt-0.5 ${type === 'PRIVATE' ? 'text-primary' : 'text-text-muted'}`} />
                  <div>
                    <h4 className={`font-semibold text-sm ${type === 'PRIVATE' ? 'text-primary' : 'text-text'}`}>Private</h4>
                    <p className="text-xs text-text-muted mt-1">Only approved members can view posts and participate.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">Assets (Optional)</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-background/50 transition-colors cursor-not-allowed opacity-60">
                  <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text">Upload Logo</p>
                  <p className="text-xs text-text-muted mt-1">Coming soon</p>
                </div>
                <div className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-background/50 transition-colors cursor-not-allowed opacity-60">
                  <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text">Upload Banner</p>
                  <p className="text-xs text-text-muted mt-1">Coming soon</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                {createMutation.isPending ? 'Creating...' : 'Create Community'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
