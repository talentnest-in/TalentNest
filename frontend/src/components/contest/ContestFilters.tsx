import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/components/ui/Button';

const CATEGORIES = [
  'Web Development', 'Mobile App', 'UI/UX Design', 'Logo Design',
  'Data Science', 'Machine Learning', 'Blockchain', 'Game Development',
  'Video Editing', 'Content Writing', 'Marketing', 'Photography',
];

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'prize', label: 'Highest Prize' },
];

export interface FilterState {
  search: string;
  category: string;
  difficulty: string;
  sort: string;
}

interface ContestFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function ContestFilters({ filters, onChange }: ContestFiltersProps) {
  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActive = filters.category || filters.difficulty || filters.search;

  return (
    <div className="space-y-4">
      {/* Search + Sort row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search contests by title, skill..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
          />
          {filters.search && (
            <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-text-muted hover:text-text" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-1 py-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set('sort', opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                filters.sort === opt.value
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="flex items-center gap-1 text-xs text-text-muted mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Difficulty */}
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => set('difficulty', filters.difficulty === d ? '' : d)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
              filters.difficulty === d
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface border-border text-text-muted hover:border-primary/30 hover:text-text'
            )}
          >
            {d.charAt(0) + d.slice(1).toLowerCase()}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        {/* Categories */}
        {CATEGORIES.slice(0, 6).map((cat) => (
          <button
            key={cat}
            onClick={() => set('category', filters.category === cat ? '' : cat)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
              filters.category === cat
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface border-border text-text-muted hover:border-primary/30 hover:text-text'
            )}
          >
            {cat}
          </button>
        ))}

        {hasActive && (
          <button
            onClick={() => onChange({ search: '', category: '', difficulty: '', sort: filters.sort })}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
