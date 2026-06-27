import { SearchX } from 'lucide-react';

interface NoResultsProps {
  query?: string;
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">No jobs found</h3>
      <p className="text-sm text-text-muted text-center max-w-md">
        {query
          ? `We couldn't find any jobs matching "${query}". Try adjusting your search or filters.`
          : 'No jobs match your current filters. Try clearing them to see more results.'}
      </p>
    </div>
  );
}
