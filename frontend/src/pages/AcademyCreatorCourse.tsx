import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Eye, EyeOff } from 'lucide-react';
import { courseService, lessonService } from '@/services/academy.service';
import { CourseSectionEditor, LessonEditor } from '@/components/academy';
import type { Course } from '@/services/academy.service';

export const AcademyCreatorCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', id],
    queryFn: () => courseService.getCourseById(id!),
    enabled: !!id,
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: Partial<Course>) => courseService.updateCourse(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['creator-courses'] });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      lessonService.createSection(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      lessonService.updateSection(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => lessonService.deleteSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      lessonService.createLesson(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) =>
      lessonService.updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => lessonService.deleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const uploadVideoMutation = useMutation({
    mutationFn: ({ lessonId, file }: { lessonId: string; file: File }) =>
      lessonService.uploadLessonVideo(lessonId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Course not found</p>
      </div>
    );
  }

  const handleSectionAdd = (title: string, description?: string) => {
    createSectionMutation.mutate({ title, description });
  };

  const handleSectionUpdate = (sectionId: string, data: any) => {
    updateSectionMutation.mutate({ sectionId, data });
  };

  const handleSectionDelete = (sectionId: string) => {
    deleteSectionMutation.mutate(sectionId);
  };

  const handleLessonAdd = (sectionId: string, data: any) => {
    createLessonMutation.mutate({ sectionId, data });
  };

  const handleLessonUpdate = (lessonId: string, data: any) => {
    updateLessonMutation.mutate({ lessonId, data });
  };

  const handleLessonDelete = (lessonId: string) => {
    deleteLessonMutation.mutate(lessonId);
  };

  const handleVideoUpload = async (lessonId: string, file: File) => {
    await uploadVideoMutation.mutateAsync({ lessonId, file });
  };

  const handlePublish = () => {
    updateCourseMutation.mutate({ status: 'PUBLISHED', visibility: true });
  };

  const handleUnpublish = () => {
    updateCourseMutation.mutate({ status: 'DRAFT', visibility: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/academy/creator')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">{course.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {course.status === 'DRAFT' ? (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Publish Course
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Unpublish
                </button>
              )}
              <Link
                to={`/academy/course/${course.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {course.sections && course.sections.length > 0 ? (
              course.sections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <CourseSectionEditor
                    sections={[section]}
                    onSectionAdd={handleSectionAdd}
                    onSectionUpdate={handleSectionUpdate}
                    onSectionDelete={handleSectionDelete}
                    onSectionReorder={() => {}}
                  />
                  {section.lessons && section.lessons.length > 0 && (
                    <LessonEditor
                      lessons={section.lessons}
                      onLessonAdd={(data) => handleLessonAdd(section.id, data)}
                      onLessonUpdate={handleLessonUpdate}
                      onLessonDelete={handleLessonDelete}
                      onLessonReorder={() => {}}
                      onVideoUpload={handleVideoUpload}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">No sections yet. Create your first section to get started.</p>
                <button
                  onClick={() => handleSectionAdd('Section 1')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            )}

            <button
              onClick={() => handleSectionAdd('')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Course Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCourseMutation.mutate({ visibility: true })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      course.visibility
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    Public
                  </button>
                  <button
                    onClick={() => updateCourseMutation.mutate({ visibility: false })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !course.visibility
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <EyeOff className="w-4 h-4 inline mr-2" />
                    Private
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) => updateCourseMutation.mutate({ price: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price
                </label>
                <input
                  type="number"
                  value={course.discountPrice || ''}
                  onChange={(e) => updateCourseMutation.mutate({ discountPrice: Number(e.target.value) || null })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
