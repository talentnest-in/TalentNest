import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { safeArray } from '@/lib/safeArray';
import { api } from '@/lib/api';

type SettingType = 'string' | 'number' | 'boolean' | 'json';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  description: string | null;
}

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Setting>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/admin/settings')).data as Setting[],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Setting>) => api.post('/admin/settings', data),
    onSuccess: () => {
      toast.success('Setting saved');
      setEditingKey(null);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => toast.error('Failed to save setting'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => api.delete(`/admin/settings/${key}`),
    onSuccess: () => {
      toast.success('Setting deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  const handleEdit = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditForm(setting);
  };

  const handleAddNew = () => {
    setEditingKey('NEW');
    setEditForm({ key: '', value: '', type: 'string', description: '' });
  };

  const handleSave = () => {
    if (!editForm.key || !editForm.value) return toast.error('Key and value required');
    saveMutation.mutate(editForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-text">Platform Settings</h1>
          <p className="text-text-muted mt-1">Configure global variables, fees, and rules</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" /> New Setting
        </Button>
      </div>

      <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">Loading settings...</div>
        ) : (
          <div className="divide-y divide-border/30">
            {safeArray(settings).map((setting) => (
              <div key={setting.key} className="p-6 hover:bg-background/50 transition-colors">
                {editingKey === setting.key ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">Key</label>
                        <input
                          disabled
                          value={editForm.key}
                          className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text-muted cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">Type</label>
                        <select
                          value={editForm.type}
                          onChange={e => setEditForm({ ...editForm, type: e.target.value as SettingType })}
                          className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Description</label>
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text"
                        placeholder="What does this setting do?"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Value</label>
                      <textarea
                        value={editForm.value || ''}
                        onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-text min-h-[80px]"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setEditingKey(null)}>Cancel</Button>
                      <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {setting.key}
                        </span>
                        <span className="text-xs text-text-muted uppercase px-1.5 border border-border/50 rounded">{setting.type}</span>
                      </div>
                      <p className="text-sm text-text-muted mb-3">{setting.description || 'No description provided.'}</p>
                      <div className="bg-background border border-border/50 rounded-lg p-3 font-mono text-sm text-text overflow-x-auto">
                        {setting.value}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(setting)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-error hover:bg-error/10 border-error/30" onClick={() => {
                        if(confirm('Delete this setting?')) deleteMutation.mutate(setting.key);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* New Setting Form */}
            {editingKey === 'NEW' && (
              <div className="p-6 bg-accent/5 border-l-4 border-accent">
                <h3 className="font-semibold text-text mb-4">Create New Setting</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Key (e.g., PLATFORM_FEE_PCT)</label>
                      <input
                        value={editForm.key || ''}
                        onChange={e => setEditForm({ ...editForm, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-text"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Type</label>
                      <select
                        value={editForm.type || 'string'}
                        onChange={e => setEditForm({ ...editForm, type: e.target.value as SettingType })}
                        className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-text"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Value</label>
                    <textarea
                      value={editForm.value || ''}
                      onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                      className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-text min-h-[80px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setEditingKey(null)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}>Create Setting</Button>
                  </div>
                </div>
              </div>
            )}
            
            {settings?.length === 0 && editingKey !== 'NEW' && (
              <div className="p-12 text-center">
                <Settings className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
                <p className="text-text-muted font-medium">No custom platform settings yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-error">Danger Zone</p>
          <p className="text-xs text-error/80 mt-1">Changing these settings incorrectly can break the platform. Only modify JSON configurations if you are sure about the schema requirements.</p>
        </div>
      </div>
    </div>
  );
}
