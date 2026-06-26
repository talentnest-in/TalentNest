import type { Experience } from '@/types';
import { Briefcase, Calendar, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExperienceTimelineProps {
  experiences: Experience[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (experience: Experience) => void;
}

export function ExperienceTimeline({ experiences, onDelete, onEdit }: ExperienceTimelineProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  if (experiences.length === 0) {
    return <p className="text-sm text-text-muted">No experience added yet.</p>;
  }

  return (
    <div className="relative border-l border-border ml-3 space-y-6">
      {experiences.map((exp) => (
        <div key={exp.id} className="relative pl-6">
          <div className="absolute w-3 h-3 bg-accent rounded-full -left-1.5 top-1.5 ring-4 ring-background" />
          <div className="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-lg font-semibold text-text">{exp.role}</h4>
                <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{exp.company}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(exp.startDate)} - {exp.current || !exp.endDate ? 'Present' : formatDate(exp.endDate)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(exp)} className="h-8 w-8 p-0 text-text-muted hover:text-accent">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(exp.id)} className="h-8 w-8 p-0 text-text-muted hover:text-error">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {exp.description && <p className="mt-3 text-sm text-text-muted whitespace-pre-wrap">{exp.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
