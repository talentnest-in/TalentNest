import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { analyticsService, courseService } from '@/services/academy.service';
import { AnalyticsCards } from '@/components/academy/AnalyticsCards';
import type { Course, CourseAnalytics } from '@/services/academy.service';

export const AcademyCreatorAnalytics: React.FC = () => {
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['creator-courses'],
    queryFn: () => courseService.getCreatorCourses(),
  });

  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);

  const { data: courseAnalytics } = useQuery<CourseAnalytics>({
    queryKey: ['course-analytics', selectedCourseId],
    queryFn: () => analyticsService.getCourseAnalytics(selectedCourseId!),
    enabled: !!selectedCourseId,
  });

  const publishedCourses = courses?.filter((c) => c.status === 'PUBLISHED') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/academy/creator"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value || null)}
            className="w-full md:w-96 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Courses</option>
            {publishedCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Course Analytics */}
        {courseAnalytics ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Analytics</h2>
            <AnalyticsCards analytics={courseAnalytics} />
          </div>
        ) : selectedCourseId ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-8">
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Select a course to view analytics</p>
          </div>
        )}
      </div>
    </div>
  );
};
