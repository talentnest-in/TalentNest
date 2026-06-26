import { useState } from 'react';
import type { Skill } from '@/types';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SkillChipsProps {
  skills: Skill[];
  onAddSkill: (name: string) => Promise<void>;
  onRemoveSkill: (id: string) => Promise<void>;
}

export function SkillChips({ skills, onAddSkill, onRemoveSkill }: SkillChipsProps) {
  const [newSkill, setNewSkill] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      setIsAdding(true);
      await onAddSkill(newSkill.trim());
      setNewSkill('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setRemovingId(id);
      await onRemoveSkill(id);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-1 bg-background border border-border px-3 py-1.5 rounded-full text-sm font-medium text-text shadow-sm"
          >
            {skill.name}
            <button
              onClick={() => handleRemove(skill.id)}
              disabled={removingId === skill.id}
              className="text-text-muted hover:text-error transition-colors ml-1 disabled:opacity-50"
            >
              {removingId === skill.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            </button>
          </div>
        ))}
        {skills.length === 0 && <span className="text-sm text-text-muted">No skills added yet.</span>}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill (e.g. React, Node.js)"
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          disabled={isAdding}
        />
        <Button type="submit" disabled={!newSkill.trim() || isAdding} className="gap-2">
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </Button>
      </form>
    </div>
  );
}
