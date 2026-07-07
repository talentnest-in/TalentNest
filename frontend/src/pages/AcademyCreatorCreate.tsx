import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Upload, Plus, Trash2, GripVertical, FileText, Video } from 'lucide-react';
import { courseService, lessonService } from '@/services/academy.service';

const STEPS = ['Basic Details', 'Thumbnail', 'Sections', 'Lessons', 'Review'];

export const AcademyCreatorCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    subtitle: '',
    description: '',
    price: 0,
    discountPrice: 0,
    level: 'BEGINNER',
    language: 'English',
    requirements: [] as string[],
    whatYouWillLearn: [] as string[],
    targetAudience: [] as string[],
    thumbnail: null as File | null,
    thumbnailUrl: '',
    tags: [] as string[],
  });

  const [sections, setSections] = useState<Array<{ id: string; title: string; description: string; order: number }>>([]);
  
  type Lesson = {
    id: string;
    title: string;
    description: string;
    type: 'VIDEO' | 'ARTICLE' | 'PDF' | 'EXTERNAL_LINK';
    videoUrl: string;
    content: string;
    duration: number;
    isPreview: boolean;
    attachments: string[];
  };
  
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['course-categories'],
    queryFn: courseService.getCategories,
  });

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['course-tags'],
    queryFn: courseService.getTags,
  });

  const createCourseMutation = useMutation({
    mutationFn: courseService.createCourse,
    onSuccess: (data) => {
      setCourseId(data.id);
      setCurrentStep(1);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => courseService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const uploadThumbnailMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      courseService.uploadThumbnail(id, file),
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, thumbnailUrl: data.thumbnail }));
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: { title: string; description?: string } }) =>
      lessonService.createSection(courseId, data),
    onSuccess: (data) => {
      setSections([...sections, { id: data.id, title: data.title, description: data.description || '', order: sections.length }]);
      setLessons({ ...lessons, [data.id]: [] });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      lessonService.createLesson(sectionId, data),
    onSuccess: (data) => {
      const sectionId = data.sectionId;
      const newLesson = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.type as 'VIDEO' | 'ARTICLE' | 'PDF' | 'EXTERNAL_LINK',
        videoUrl: data.videoUrl || '',
        content: data.content || '',
        duration: data.duration || 0,
        isPreview: data.isPreview || false,
        attachments: data.attachments || [],
      };
      setLessons((prev: Record<string, Array<any>>) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), newLesson],
      }));
    },
  });

  const handleNext = async () => {
    if (currentStep === 0) {
      await createCourseMutation.mutateAsync(formData);
    } else if (currentStep === 1) {
      if (formData.thumbnail && courseId) {
        await uploadThumbnailMutation.mutateAsync({ id: courseId, file: formData.thumbnail });
      }
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddSection = async () => {
    if (courseId) {
      await createSectionMutation.mutateAsync({
        courseId,
        data: { title: `Section ${sections.length + 1}`, description: '' },
      });
    }
  };

  const handleAddLesson = async (sectionId: string) => {
    await createLessonMutation.mutateAsync({
      sectionId,
      data: {
        title: `Lesson ${(lessons[sectionId]?.length || 0) + 1}`,
        type: 'VIDEO',
        duration: 10,
      },
    });
  };

  const handlePublish = async () => {
    if (courseId) {
      await updateCourseMutation.mutateAsync({
        id: courseId,
        data: { status: 'PUBLISHED', visibility: true },
      });
      navigate(`/academy/creator/course/${courseId}`);
    }
  };

  const handleSaveDraft = async () => {
    if (courseId) {
      await updateCourseMutation.mutateAsync({
        id: courseId,
        data: { status: 'DRAFT' },
      });
      navigate(`/academy/creator/course/${courseId}`);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter course title"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Enter a subtitle"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your course"
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price ($)
                </label>
                <input
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="English"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <select
                multiple
                value={formData.tags}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: Array.from(e.target.selectedOptions).map(opt => opt.value)
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {tags?.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {formData.thumbnail ? (
                  <div>
                    <img
                      src={URL.createObjectURL(formData.thumbnail)}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, thumbnail: null })}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : formData.thumbnailUrl ? (
                  <div>
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drag and drop or click to upload</p>
                    <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 20MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Course Sections</h3>
              <button
                onClick={handleAddSection}
                disabled={!courseId}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sections yet. Add your first section to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div key={section.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...sections];
                          newSections[index].title = e.target.value;
                          setSections(newSections);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => {
                          setSections(sections.filter(s => s.id !== section.id));
                          const newLessons = { ...lessons };
                          delete newLessons[section.id];
                          setLessons(newLessons);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={section.description}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[index].description = e.target.value;
                        setSections(newSections);
                      }}
                      placeholder="Section description (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                    />
                    
                    {/* Lessons in this section */}
                    <div className="mt-3 space-y-2">
                      {(lessons[section.id] || []).map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-sm">{lesson.title}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">{lesson.type}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddLesson(section.id)}
                        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Lessons Overview</h3>
            {sections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Add sections first to create lessons.
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{section.title}</h4>
                    {(lessons[section.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-500">No lessons in this section</p>
                    ) : (
                      <div className="space-y-2">
                        {(lessons[section.id] || []).map((lesson: any) => (
                          <div key={lesson.id} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              {lesson.type === 'VIDEO' && <Video className="w-4 h-4 text-blue-500" />}
                              {lesson.type === 'ARTICLE' && <FileText className="w-4 h-4 text-green-500" />}
                              {lesson.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => {
                                  const newLessons = { ...lessons };
                                  const sectionLessons = newLessons[section.id] || [];
                                  const lessonIdx = sectionLessons.findIndex((l: any) => l.id === lesson.id);
                                  if (lessonIdx >= 0) {
                                    sectionLessons[lessonIdx].title = e.target.value;
                                    newLessons[section.id] = sectionLessons;
                                    setLessons(newLessons);
                                  }
                                }}
                                className="flex-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              />
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={lesson.isPreview}
                                  onChange={(e) => {
                                    const newLessons = { ...lessons };
                                    const sectionLessons = newLessons[section.id] || [];
                                    const lessonIdx = sectionLessons.findIndex((l: any) => l.id === lesson.id);
                                    if (lessonIdx >= 0) {
                                      sectionLessons[lessonIdx].isPreview = e.target.checked;
                                      newLessons[section.id] = sectionLessons;
                                      setLessons(newLessons);
                                    }
                                  }}
                                  className="rounded"
                                />
                                Preview
                              </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={lesson.videoUrl}
                                onChange={(e) => {
                                  const newLessons = { ...lessons };
                                  const sectionLessons = newLessons[section.id] || [];
                                  const lessonIdx = sectionLessons.findIndex((l: any) => l.id === lesson.id);
                                  if (lessonIdx >= 0) {
                                    sectionLessons[lessonIdx].videoUrl = e.target.value;
                                    newLessons[section.id] = sectionLessons;
                                    setLessons(newLessons);
                                  }
                                }}
                                placeholder="Video URL"
                                className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              />
                              <input
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => {
                                  const newLessons = { ...lessons };
                                  const sectionLessons = newLessons[section.id] || [];
                                  const lessonIdx = sectionLessons.findIndex((l: any) => l.id === lesson.id);
                                  if (lessonIdx >= 0) {
                                    sectionLessons[lessonIdx].duration = Number(e.target.value);
                                    newLessons[section.id] = sectionLessons;
                                    setLessons(newLessons);
                                  }
                                }}
                                placeholder="Duration (min)"
                                className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Summary</h3>
              <div className="space-y-2">
                <p><span className="text-gray-600">Title:</span> {formData.title}</p>
                <p><span className="text-gray-600">Category:</span> {categories?.find(c => c.id === formData.categoryId)?.name}</p>
                <p><span className="text-gray-600">Price:</span> ${formData.price}</p>
                <p><span className="text-gray-600">Level:</span> {formData.level}</p>
                <p><span className="text-gray-600">Language:</span> {formData.language}</p>
                <p><span className="text-gray-600">Sections:</span> {sections.length}</p>
                <p><span className="text-gray-600">Total Lessons:</span> {Object.values(lessons).flat().length}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/academy/creator')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Create Course</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    index < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {currentStep === STEPS.length - 1 ? (
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={!courseId}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={!courseId}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish Course
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                categoriesLoading ||
                tagsLoading ||
                (currentStep === 0 && (!formData.categoryId || !formData.title || !formData.description)) ||
                createCourseMutation.isPending ||
                uploadThumbnailMutation.isPending
              }
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {categoriesLoading || tagsLoading ? 'Loading...' : createCourseMutation.isPending ? 'Creating...' : currentStep === 0 ? 'Create Course' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
