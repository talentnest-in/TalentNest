import { Briefcase } from 'lucide-react';

interface EmptyApplicationsStateProps {
  title?: string;
  description?: string;
}

export function EmptyApplicationsState({ 
  title = 'No applications yet',
  description = 'Start applying to jobs to track your applications here.'
}: EmptyApplicationsStateProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Briefcase className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  );
}
