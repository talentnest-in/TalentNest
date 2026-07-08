import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, Loader2, Trash2, Edit2, DollarSign, Lock, ShieldCheck } from 'lucide-react';
import { workspaceService, type Milestone } from '@/services/workspace.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WorkspaceMilestonesProps {
  contractId: string;
}

export function WorkspaceMilestones({ contractId }: WorkspaceMilestonesProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: '',
  });

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones', contractId],
    queryFn: () => workspaceService.getMilestones(contractId),
    enabled: !!contractId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; dueDate?: string; amount: number }) =>
      workspaceService.createMilestone(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', contractId] });
      setIsCreating(false);
      setFormData({ title: '', description: '', dueDate: '', amount: '' });
      toast.success('Milestone created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) =>
      workspaceService.updateMilestone(contractId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', contractId] });
      setEditingId(null);
      toast.success('Milestone updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspaceService.deleteMilestone(contractId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', contractId] });
      toast.success('Milestone deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fundMutation = useMutation({
    mutationFn: (id: string) => workspaceService.fundMilestone(contractId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', contractId] });
      toast.success('Funds deposited into escrow successfully!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => workspaceService.releaseMilestone(contractId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', contractId] });
      toast.success('Funds released to freelancer successfully!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-text-muted/10 text-text-muted';
      case 'IN_PROGRESS':
        return 'bg-accent/10 text-accent';
      case 'COMPLETED':
        return 'bg-success/10 text-success';
      case 'BLOCKED':
        return 'bg-error/10 text-error';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckSquare className="w-4 h-4" />;
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      createMutation.mutate({
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        amount: Number(formData.amount) || 0,
      });
    }
  };

  const handleUpdate = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      updateMutation.mutate({
        id,
        data: {
          title: formData.title,
          description: formData.description || null,
          dueDate: formData.dueDate || null,
          amount: Number(formData.amount) || 0,
        },
      });
    }
  };

  const handleStatusChange = (id: string, status: Milestone['status']) => {
    updateMutation.mutate({
      id,
      data: { status },
    });
  };

  const startEditing = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '',
      amount: milestone.amount ? String(milestone.amount) : '0',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Milestones</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isCreating && (
          <div className="mb-6 bg-background border border-border rounded-lg p-4">
            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Milestone title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-text-muted">$</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Amount (optional)"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ title: '', description: '', dueDate: '', amount: '' });
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!milestones || milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <CheckSquare className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No Milestones</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
              No milestones have been created yet. Add a milestone to track project progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === milestone.id ? (
                  <form onSubmit={(e) => handleUpdate(milestone.id, e)}>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      autoFocus
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={2}
                    />
                    <div className="flex gap-3 mb-3">
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-text-muted">$</span>
                        </div>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="px-3 py-1 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({ title: '', description: '', dueDate: '', amount: '' });
                        }}
                        className="px-3 py-1 border border-border rounded-lg text-sm hover:bg-background transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-text">{milestone.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(milestone.status)}`}>
                            {getStatusIcon(milestone.status)}
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-text-muted mb-2">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-xs text-text-muted">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {milestone.amount > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="font-semibold text-text">${milestone.amount}</span>
                            {milestone.isPaid ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Paid
                              </span>
                            ) : milestone.isFunded ? (
                              <span className="flex items-center gap-1 text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" /> In Escrow
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-text-muted bg-text-muted/10 px-2 py-0.5 rounded-full">
                                Unfunded
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          {!milestone.isPaid && (
                            <>
                              <button
                                onClick={() => startEditing(milestone)}
                                className="p-1 hover:bg-background rounded transition-colors text-text-muted hover:text-text"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(milestone.id)}
                                className="p-1 hover:bg-background rounded transition-colors text-text-muted hover:text-error"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                        {user?.role === 'CLIENT' && milestone.amount > 0 && !milestone.isPaid && (
                          <div className="mt-2">
                            {!milestone.isFunded ? (
                              <button
                                onClick={() => fundMutation.mutate(milestone.id)}
                                disabled={fundMutation.isPending}
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                {fundMutation.isPending ? 'Funding...' : 'Fund Escrow'}
                              </button>
                            ) : (
                              <button
                                onClick={() => releaseMutation.mutate(milestone.id)}
                                disabled={releaseMutation.isPending}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {releaseMutation.isPending ? 'Releasing...' : 'Release Payment'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3">
                      {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(milestone.id, status)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            milestone.status === status
                              ? 'bg-accent text-white'
                              : 'bg-background text-text-muted hover:bg-background/80'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
