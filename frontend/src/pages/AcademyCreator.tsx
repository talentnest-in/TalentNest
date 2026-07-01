import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, BookOpen, TrendingUp, List } from 'lucide-react';
import { creatorService, courseService } from '@/services/academy.service';
import { CreatorStats } from '@/components/academy/CreatorStats';
import { CourseCard } from '@/components/academy/CourseCard';
import type { Course } from '@/services/academy.service';

export const AcademyCreator: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['creator-stats'],
    queryFn: creatorService.getCreatorStats,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['creator-courses'],
    queryFn: () => courseService.getCreatorCourses(),
  });

  const publishedCourses = (courses || []).filter((c: Course) => c.status === 'PUBLISHED');
  const draftCourses = (courses || []).filter((c: Course) => c.status === 'DRAFT');

  if (statsLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
              <p className="text-gray-600">Manage your courses and track your performance</p>
            </div>
            <Link
              to="/academy/creator/create"
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && <CreatorStats stats={stats} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/academy/creator/create"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Course</h3>
                <p className="text-sm text-gray-600">Start a new course</p>
              </div>
            </div>
          </Link>

          <Link
            to="/academy/creator/my-courses"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <List className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Courses</h3>
                <p className="text-sm text-gray-600">Manage all courses</p>
              </div>
            </div>
          </Link>

          <Link
            to="/academy/my-learning"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Learning</h3>
                <p className="text-sm text-gray-600">View your enrolled courses</p>
              </div>
            </div>
          </Link>

          <Link
            to="/academy/creator/analytics"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View detailed analytics</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Published Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Published Courses</h2>
            {publishedCourses.length > 0 && (
              <Link
                to="/academy/creator/courses?status=PUBLISHED"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                View all
              </Link>
            )}
          </div>

          {publishedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedCourses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No published courses yet</h3>
              <p className="text-gray-600 mb-4">Create and publish your first course to start earning</p>
              <Link
                to="/academy/creator/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </Link>
            </div>
          )}
        </div>

        {/* Draft Courses */}
        {draftCourses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Draft Courses</h2>
              <Link
                to="/academy/creator/courses?status=DRAFT"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftCourses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
