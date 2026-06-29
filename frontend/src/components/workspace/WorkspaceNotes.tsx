import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, FileText, Loader2, Trash2, Edit2, Save, X } from 'lucide-react';
import { workspaceService, type Note } from '@/services/workspace.service';

interface WorkspaceNotesProps {
  contractId: string;
}

export function WorkspaceNotes({ contractId }: WorkspaceNotesProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', contractId],
    queryFn: () => workspaceService.getNotes(contractId),
    enabled: !!contractId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      workspaceService.createNote(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contractId] });
      setIsCreating(false);
      setFormData({ title: '', content: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) =>
      workspaceService.updateNote(contractId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contractId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspaceService.deleteNote(contractId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contractId] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.content.trim()) {
      createMutation.mutate(formData);
    }
  };

  const handleUpdate = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.content.trim()) {
      updateMutation.mutate({
        id,
        data: formData,
      });
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content,
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
          <h2 className="text-lg font-semibold text-text">Project Notes</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isCreating && (
          <div className="mb-6 bg-background border border-border rounded-lg p-4">
            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Note title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              <textarea
                placeholder="Write your note here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={6}
              />
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
                    setFormData({ title: '', content: '' });
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!notes || notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <FileText className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No Notes</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
              No notes have been created yet. Add a note to document your project.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === note.id ? (
                  <form onSubmit={(e) => handleUpdate(note.id, e)}>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      autoFocus
                    />
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={5}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        Last updated: {new Date(note.updatedAt).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setFormData({ title: '', content: '' });
                          }}
                          className="flex items-center gap-1 px-3 py-1 border border-border rounded-lg text-sm hover:bg-background transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-text">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(note)}
                          className="p-1 hover:bg-background rounded transition-colors text-text-muted hover:text-text"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(note.id)}
                          className="p-1 hover:bg-background rounded transition-colors text-text-muted hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted whitespace-pre-wrap mb-2">{note.content}</p>
                    <p className="text-xs text-text-muted">
                      Last updated: {new Date(note.updatedAt).toLocaleString()}
                    </p>
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
