import { Button } from '@/components/ui/Button';
import type { JobType } from '@/types';

interface JobFiltersProps {
  type?: JobType;
  minBudget?: string;
  maxBudget?: string;
  isRemote?: string;
  datePosted?: string;
  sortBy?: string;
  onTypeChange: (type: JobType | undefined) => void;
  onMinBudgetChange: (value: string) => void;
  onMaxBudgetChange: (value: string) => void;
  onRemoteChange: (value: string) => void;
  onDatePostedChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function JobFilters({
  type,
  minBudget,
  maxBudget,
  isRemote,
  datePosted,
  sortBy,
  onTypeChange,
  onMinBudgetChange,
  onMaxBudgetChange,
  onRemoteChange,
  onDatePostedChange,
  onSortChange,
  onClear,
  hasActiveFilters,
}: JobFiltersProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 lg:sticky lg:top-8">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Filters</h3>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-sm text-accent hover:text-accent/80">
            Clear all
          </button>
        )}
      </div>

      {/* Job Type */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Job Type</label>
        <div className="flex gap-2">
          <Button
            variant={type === 'FIXED' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(type === 'FIXED' ? undefined : 'FIXED')}
            className="flex-1"
          >
            Fixed Price
          </Button>
          <Button
            variant={type === 'HOURLY' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(type === 'HOURLY' ? undefined : 'HOURLY')}
            className="flex-1"
          >
            Hourly
          </Button>
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Budget Range ($)</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min"
            value={minBudget || ''}
            onChange={(e) => onMinBudgetChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxBudget || ''}
            onChange={(e) => onMaxBudgetChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Remote */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Work Type</label>
        <div className="flex gap-2">
          <Button
            variant={isRemote === 'true' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => onRemoteChange(isRemote === 'true' ? '' : 'true')}
            className="flex-1"
          >
            Remote
          </Button>
          <Button
            variant={isRemote === 'false' ? 'accent' : 'outline'}
            size="sm"
            onClick={() => onRemoteChange(isRemote === 'false' ? '' : 'false')}
            className="flex-1"
          >
            On-site
          </Button>
        </div>
      </div>

      {/* Date Posted */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Date Posted</label>
        <select
          value={datePosted || 'any'}
          onChange={(e) => onDatePostedChange(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="any">Any Time</option>
          <option value="24h">Past 24 Hours</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Sort By</label>
        <select
          value={sortBy || 'newest'}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="budget_low">Budget: Low to High</option>
          <option value="budget_high">Budget: High to Low</option>
        </select>
      </div>
    </div>
  );
}
