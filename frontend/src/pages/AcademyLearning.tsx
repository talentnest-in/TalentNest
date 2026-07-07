import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { enrollmentService } from '@/services/academy.service';
import { LessonSidebar, LessonViewer } from '@/components/academy';

export const AcademyLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentLessonId, setCurrentLessonId] = useState<string>('');

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['enrollment', courseId],
    queryFn: () => enrollmentService.getEnrollment(courseId!),
    enabled: !!courseId,
  });

  const progressMutation = useMutation({
    mutationFn: ({ lessonId, completed, timeSpent }: { lessonId: string; completed: boolean; timeSpent?: number }) =>
      enrollmentService.updateLessonProgress(lessonId, { completed, timeSpent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
    },
  });

  // Extract course data for hooks
  const course = enrollment?.course;
  const allLessons = course?.sections?.flatMap((s) => s.lessons || []) || [];
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  const currentLesson = allLessons[currentLessonIndex];
  const progressRecords = enrollment?.progressRecords || [];

  // Set first lesson as current when enrollment loads
  useEffect(() => {
    if (enrollment && enrollment.course.sections && enrollment.course.sections.length > 0) {
      const firstLesson = enrollment.course.sections[0].lessons?.[0];
      if (firstLesson && !currentLessonId) {
        setCurrentLessonId(firstLesson.id);
      }
    }
  }, [enrollment, currentLessonId]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!currentLessonId) return;
    
    const interval = setInterval(() => {
      progressMutation.mutate({
        lessonId: currentLessonId,
        completed: false,
        timeSpent: 30,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [currentLessonId, progressMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Enrollment not found</p>
      </div>
    );
  }

  const handleLessonClick = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonId(allLessons[currentLessonIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonId(allLessons[currentLessonIndex + 1].id);
    }
  };

  const handleComplete = () => {
    progressMutation.mutate({
      lessonId: currentLessonId,
      completed: true,
    });
  };

  const isCourseCompleted = enrollment.status === 'COMPLETED';
  const isLastLesson = currentLessonIndex === allLessons.length - 1;
  const isCurrentLessonCompleted = progressRecords.some((p) => p.lessonId === currentLessonId && p.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => course?.slug && navigate(`/academy/course/${course.slug}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Course</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Progress: {(enrollment.progress || 0).toFixed(0)}%
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <LessonSidebar
          sections={course?.sections || []}
          currentLessonId={currentLessonId}
          progressRecords={progressRecords}
          onLessonClick={handleLessonClick}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentLesson ? (
            <>
              {isCourseCompleted && isLastLesson && isCurrentLessonCompleted ? (
                // Course Completion View
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Course Completed!</h2>
                      <p className="text-gray-600 mb-6">
                        Congratulations! You have successfully completed all lessons in this course.
                      </p>
                      {enrollment.certificate && (
                        <Link
                          to={`/academy/certificate/${enrollment.certificate.id}`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                        >
                          View Certificate
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Lesson View
                <LessonViewer
                  lesson={currentLesson}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  hasPrevious={currentLessonIndex > 0}
                  hasNext={currentLessonIndex < allLessons.length - 1}
                  onComplete={handleComplete}
                  isCompleted={isCurrentLessonCompleted}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
