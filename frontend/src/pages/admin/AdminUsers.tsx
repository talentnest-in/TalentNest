import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Shield, Briefcase, Building2, Trash2, UserCog, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  FREELANCER: { label: 'Freelancer', color: 'bg-accent/10 text-accent border-accent/20', icon: <Briefcase className="w-3 h-3" /> },
  CLIENT: { label: 'Client', color: 'bg-success/10 text-success border-success/20', icon: <Building2 className="w-3 h-3" /> },
  ADMIN: { label: 'Admin', color: 'bg-error/10 text-error border-error/20', icon: <Shield className="w-3 h-3" /> },
};

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      return res.data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.patch(`/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast.success('Role updated');
      setChangingRoleFor(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, isSuspended }: { userId: string; isSuspended: boolean }) => {
      if (isSuspended) {
        await api.post(`/admin/users/${userId}/unsuspend`);
      } else {
        const reason = prompt('Enter reason for suspension:');
        if (!reason) throw new Error('Reason required');
        await api.post(`/admin/users/${userId}/suspend`, { reason });
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isSuspended ? 'User unsuspended' : 'User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      if (err.message !== 'Reason required') toast.error('Failed to update suspension status');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">User Management</h1>
        <p className="text-text-muted mt-1">View, manage, and control all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              className="w-full bg-surface border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select
          className="bg-surface border border-border/50 rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="FREELANCER">Freelancers</option>
          <option value="CLIENT">Clients</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-text-muted">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-background/50">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Level</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Contracts</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3">Joined</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data?.users?.map((user: any, idx: number) => {
                  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG['FREELANCER'];
                  const contracts = (user._count?.freelancerContracts || 0) + (user._count?.clientContracts || 0);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-background/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0 overflow-hidden">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text flex items-center gap-2">
                              {user.name || 'Unnamed'}
                              {user.isSuspended && (
                                <span className="text-[10px] font-bold bg-error/10 text-error px-1.5 py-0.5 rounded-md" title={user.suspensionReason}>
                                  SUSPENDED
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-text-muted truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {changingRoleFor === user.id ? (
                          <div className="flex items-center gap-1">
                            {['FREELANCER', 'CLIENT', 'ADMIN'].map(r => (
                              <button
                                key={r}
                                onClick={() => updateRoleMutation.mutate({ userId: user.id, role: r })}
                                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${ROLE_CONFIG[r].color} hover:opacity-80`}
                              >
                                {r}
                              </button>
                            ))}
                            <button onClick={() => setChangingRoleFor(null)} className="text-text-muted hover:text-text ml-1 text-xs">✕</button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleCfg.color}`}>
                            {roleCfg.icon} {roleCfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-accent">Lv.{user.level}</span>
                          <span className="text-xs text-text-muted">{user.exp} EXP</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-text">{contracts}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-text-muted">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setChangingRoleFor(user.id)}
                            className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Change Role"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => suspendMutation.mutate({ userId: user.id, isSuspended: user.isSuspended })}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isSuspended 
                                ? 'text-success hover:bg-success/10' 
                                : 'text-text-muted hover:text-error hover:bg-error/10'
                            }`}
                            title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                          >
                            {user.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${user.name}? This cannot be undone.`)) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {data?.users?.length === 0 && (
              <div className="py-12 text-center text-text-muted">No users found</div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-text px-2">{page} / {data.pages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data.pages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
