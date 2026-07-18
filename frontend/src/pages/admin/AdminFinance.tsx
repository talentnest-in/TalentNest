import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DollarSign, AlertTriangle, CheckCircle, XCircle, Clock, User, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const STATUS_CFG: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-warning/10 text-warning border-warning/20', icon: <Clock className="w-3 h-3" /> },
  APPROVED: { color: 'bg-success/10 text-success border-success/20', icon: <CheckCircle className="w-3 h-3" /> },
  REJECTED: { color: 'bg-error/10 text-error border-error/20', icon: <XCircle className="w-3 h-3" /> },
  DISPUTED: { color: 'bg-error/10 text-error border-error/20', icon: <AlertTriangle className="w-3 h-3" /> },
};

export function AdminFinance() {
  const [activeTab, setActiveTab] = useState<'disputes' | 'payouts'>('payouts');
  const queryClient = useQueryClient();

  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => (await api.get('/admin/finance/payouts')).data,
    enabled: activeTab === 'payouts',
  });

  const { data: disputes = [], isLoading: loadingDisputes } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => (await api.get('/admin/finance/disputes')).data,
    enabled: activeTab === 'disputes',
  });

  const payoutMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.post(`/admin/finance/payouts/${id}/approve`, { status }),
    onSuccess: () => {
      toast.success('Payout status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
    onError: () => toast.error('Failed to update payout'),
  });

  const tabs = [
    { id: 'payouts', label: 'Payout Requests', icon: DollarSign },
    { id: 'disputes', label: 'Disputed Contracts', icon: AlertTriangle },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Finance & Disputes</h1>
        <p className="text-text-muted mt-1">Manage freelancer payout requests and resolve contract disputes</p>
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

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
          {loadingPayouts ? (
            <div className="py-16 text-center text-text-muted">Loading payout requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-background/50">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-6 py-3">Freelancer</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Requested</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wide px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {payouts.map((payout: any, idx: number) => {
                    const cfg = STATUS_CFG[payout.status] || STATUS_CFG['PENDING'];
                    return (
                      <motion.tr
                        key={payout.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-background/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                              {payout.user?.name?.[0] || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text">{payout.user?.name}</p>
                              <p className="text-xs text-text-muted">{payout.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-lg font-bold text-success">${payout.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                            {cfg.icon} {payout.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-text-muted">{new Date(payout.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {payout.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" onClick={() => payoutMutation.mutate({ id: payout.id, status: 'APPROVED' })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-error border-error/30 hover:bg-error/10"
                                onClick={() => payoutMutation.mutate({ id: payout.id, status: 'REJECTED' })}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {payouts.length === 0 && (
                <div className="py-16 text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-text-muted opacity-20 mb-3" />
                  <p className="text-text-muted">No payout requests yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {loadingDisputes ? (
            <div className="py-16 text-center text-text-muted">Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className="bg-surface border border-border/50 rounded-2xl py-16 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success opacity-40 mb-3" />
              <p className="text-text font-medium">No disputed contracts!</p>
              <p className="text-text-muted text-sm mt-1">All contracts are running smoothly.</p>
            </div>
          ) : (
            disputes.map((contract: any, idx: number) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-surface border border-error/20 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
                        <AlertTriangle className="w-3 h-3" /> DISPUTED
                      </span>
                      <span className="text-xs text-text-muted">#{contract.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-text mb-4">{contract.title}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Client</p>
                          <p className="text-sm font-medium text-text">{contract.client?.name}</p>
                          <p className="text-xs text-text-muted">{contract.client?.email}</p>
                        </div>
                      </div>
                      <div className="bg-background rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Freelancer</p>
                          <p className="text-sm font-medium text-text">{contract.freelancer?.name}</p>
                          <p className="text-xs text-text-muted">{contract.freelancer?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-text">${contract.agreedBudget?.toFixed(2)}</p>
                    <p className="text-xs text-text-muted">Agreed Budget</p>
                    <p className="text-xs text-text-muted mt-2">
                      Since {new Date(contract.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
