import React from 'react';
import { Search } from 'lucide-react';

interface CourseSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search courses...',
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
};
