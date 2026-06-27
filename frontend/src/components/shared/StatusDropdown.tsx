import { ChevronDown } from 'lucide-react';
import type { ApplicationStatus } from '@/types';

interface StatusDropdownProps {
  value: ApplicationStatus;
  onChange: (value: ApplicationStatus) => void;
  disabled?: boolean;
}

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWING', label: 'Reviewing' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'HIRED', label: 'Hired' },
];

export function StatusDropdown({ value, onChange, disabled }: StatusDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        disabled={disabled}
        className="appearance-none w-full px-4 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  );
}
