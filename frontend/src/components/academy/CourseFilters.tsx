import React from 'react';
import { Filter, X } from 'lucide-react';
import type { CourseCategory } from '@/services/academy.service';

interface CourseFiltersProps {
  categories: CourseCategory[];
  selectedCategory: string;
  selectedLevel: string;
  selectedLanguage: string;
  priceRange: { min: number; max: number };
  minRating: number;
  onCategoryChange: (category: string) => void;
  onLevelChange: (level: string) => void;
  onLanguageChange: (language: string) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onRatingChange: (rating: number) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];
const RATING_OPTIONS = [4.5, 4.0, 3.5, 3.0];

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  categories,
  selectedCategory,
  selectedLevel,
  selectedLanguage,
  priceRange,
  minRating,
  onCategoryChange,
  onLevelChange,
  onLanguageChange,
  onPriceRangeChange,
  onRatingChange,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  const hasActiveFilters =
    selectedCategory ||
    selectedLevel ||
    selectedLanguage ||
    priceRange.min > 0 ||
    priceRange.max < 1000 ||
    minRating > 0;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 bg-orange-500 rounded-full" />
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All/categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => onLevelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All levels</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All languages</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min || ''}
                onChange={(e) =>
                  onPriceRangeChange({
                    ...priceRange,
                    min: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max || ''}
                onChange={(e) =>
                  onPriceRangeChange({
                    ...priceRange,
                    max: Number(e.target.value) || 1000,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <div className="flex flex-col gap-2">
              {RATING_OPTIONS.map((rating) => (
                <button
                  key={rating}
                  onClick={() => onRatingChange(rating)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    minRating === rating
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{rating}+</span>
                  <span className="text-gray-500">& up</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
