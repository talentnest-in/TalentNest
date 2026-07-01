import React from 'react';
import { CourseCard } from './CourseCard';
import type { Course } from '@/services/academy.service';

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  onWishlistToggle?: (courseId: string) => void;
  wishlistedCourses?: Set<string>;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  loading = false,
  onWishlistToggle,
  wishlistedCourses = new Set(),
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="h-48 bg-gray-100 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-6 bg-gray-100 rounded animate-pulse w-20" />
                <div className="h-8 bg-gray-100 rounded animate-pulse w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No courses found
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onWishlistToggle={onWishlistToggle}
          isWishlisted={wishlistedCourses.has(course.id)}
        />
      ))}
    </div>
  );
};
