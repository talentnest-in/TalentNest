import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import type { PortfolioProject } from '@/types';

interface PortfolioPreviewProps {
  projects: PortfolioProject[];
}

export function PortfolioPreview({ projects }: PortfolioPreviewProps) {
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 text-text-muted">
          <ImageIcon className="w-5 h-5" />
          <span>No portfolio projects</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="bg-surface border border-border rounded-2xl p-4">
          {project.imageUrl ? (
            <img
              src={project.imageUrl.startsWith('http') ? project.imageUrl : `${BACKEND_URL}${project.imageUrl}`}
              alt={project.title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          ) : (
            <div className="w-full h-48 rounded-xl bg-border/30 flex items-center justify-center mb-4">
              <ImageIcon className="w-12 h-12 text-text-muted" />
            </div>
          )}
          <h4 className="font-semibold text-text mb-2">{project.title}</h4>
          <p className="text-sm text-text-muted line-clamp-2 mb-3">{project.description}</p>
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80"
            >
              View Project <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
