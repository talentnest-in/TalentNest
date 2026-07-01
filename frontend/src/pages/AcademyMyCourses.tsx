import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Eye, Archive, ArchiveRestore } from 'lucide-react';
import { courseService } from '@/services/academy.service';
import type { Course } from '@/services/academy.service';

type TabType = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export const AcademyMyCourses: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('PUBLISHED');

  const { data: publishedCourses, isLoading: publishedLoading } = useQuery<Course[]>({
    queryKey: ['creator-courses', 'PUBLISHED'],
    queryFn: () => courseService.getCreatorCourses({ status: 'PUBLISHED' }),
  });

  const { data: draftCourses, isLoading: draftLoading } = useQuery<Course[]>({
    queryKey: ['creator-courses', 'DRAFT'],
    queryFn: () => courseService.getCreatorCourses({ status: 'DRAFT' }),
  });

  const { data: archivedCourses, isLoading: archivedLoading } = useQuery<Course[]>({
    queryKey: ['creator-courses', 'ARCHIVED'],
    queryFn: () => courseService.getCreatorCourses({ status: 'ARCHIVED' }),
  });

  const deleteMutation = useMutation({
    mutationFn: courseService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => courseService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
    },
  });

  const handleDelete = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteMutation.mutate(courseId);
    }
  };

  const handlePublish = (courseId: string) => {
    updateMutation.mutate({ id: courseId, data: { status: 'PUBLISHED', visibility: true } });
  };

  const handleUnpublish = (courseId: string) => {
    updateMutation.mutate({ id: courseId, data: { status: 'DRAFT', visibility: false } });
  };

  const handleArchive = (courseId: string) => {
    updateMutation.mutate({ id: courseId, data: { status: 'ARCHIVED', visibility: false } });
  };

  const handleUnarchive = (courseId: string) => {
    updateMutation.mutate({ id: courseId, data: { status: 'DRAFT', visibility: false } });
  };

  const getCoursesForTab = () => {
    switch (activeTab) {
      case 'PUBLISHED':
        return publishedCourses || [];
      case 'DRAFT':
        return draftCourses || [];
      case 'ARCHIVED':
        return archivedCourses || [];
      default:
        return [];
    }
  };

  const isLoading = activeTab === 'PUBLISHED' ? publishedLoading : activeTab === 'DRAFT' ? draftLoading : archivedLoading;
  const courses = getCoursesForTab();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">Manage your course content</p>
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
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('PUBLISHED')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'PUBLISHED'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Published ({publishedCourses?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('DRAFT')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'DRAFT'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Drafts ({draftCourses?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'ARCHIVED'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Archived ({archivedCourses?.length || 0})
          </button>
        </div>

        {/* Course List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab.toLowerCase()} courses
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {activeTab === 'PUBLISHED' && 'Publish your first course to start earning.'}
              {activeTab === 'DRAFT' && 'Start creating a new course.'}
              {activeTab === 'ARCHIVED' && 'No archived courses.'}
            </p>
            <Link
              to="/academy/creator/create"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Create Course
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.category.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                          course.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">${course.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>{course._count?.enrollments || 0} students</span>
                      <span>{course.averageRating?.toFixed(1) || '0'} rating</span>
                      <span>{course.level}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/academy/course/${course.slug}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        to={`/academy/creator/course/${course.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      {activeTab === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(course.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                      {activeTab === 'PUBLISHED' && (
                        <button
                          onClick={() => handleUnpublish(course.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition-colors disabled:opacity-50"
                        >
                          Unpublish
                        </button>
                      )}
                      {activeTab !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(course.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                      {activeTab === 'ARCHIVED' && (
                        <button
                          onClick={() => handleUnarchive(course.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          Unarchive
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
