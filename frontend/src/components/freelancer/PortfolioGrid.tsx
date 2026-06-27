import type { PortfolioProject } from '@/types';
import { ExternalLink, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BACKEND_URL } from '@/lib/constants';

interface PortfolioGridProps {
  projects: PortfolioProject[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (project: PortfolioProject) => void;
}

export function PortfolioGrid({ projects, onDelete, onEdit }: PortfolioGridProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-text-muted">No projects added yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
          {project.imageUrl ? (
            <img src={`${BACKEND_URL}${project.imageUrl}`} alt={project.title} className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-background flex items-center justify-center text-text-muted text-sm">
              No Image
            </div>
          )}
          <div className="p-4 flex flex-col flex-1">
            <h4 className="font-semibold text-text line-clamp-1">{project.title}</h4>
            <p className="text-sm text-text-muted mt-2 line-clamp-2 flex-1">{project.description}</p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              {project.projectUrl ? (
                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" /> View
                </a>
              ) : (
                <span className="text-sm text-text-muted">No link provided</span>
              )}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(project)} className="h-8 w-8 p-0 text-text-muted hover:text-accent">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(project.id)} className="h-8 w-8 p-0 text-text-muted hover:text-error">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
