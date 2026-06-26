import type { Education } from '@/types';
import { Calendar, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EducationCardsProps {
  educations: Education[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (education: Education) => void;
}

export function EducationCards({ educations, onDelete, onEdit }: EducationCardsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  if (educations.length === 0) {
    return <p className="text-sm text-text-muted">No education added yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {educations.map((edu) => (
        <div key={edu.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="font-semibold text-text">{edu.institution}</h4>
              <p className="text-sm text-text-muted mt-1">{edu.degree} in {edu.fieldOfStudy}</p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(edu)} className="h-8 w-8 p-0 text-text-muted hover:text-accent">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(edu.id)} className="h-8 w-8 p-0 text-text-muted hover:text-error">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
