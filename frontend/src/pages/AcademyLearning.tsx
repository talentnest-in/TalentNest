import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { enrollmentService, quizService } from '@/services/academy.service';
import { LessonSidebar, LessonViewer, QuizCard, QuizQuestion } from '@/components/academy';

export const AcademyLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);

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
      progressMutationSuccess();
    },
  });

  // Extract course data for hooks
  const course = enrollment?.course;
  const allLessons = course?.sections?.flatMap((s) => s.lessons || []) || [];
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  const currentLesson = allLessons[currentLessonIndex];
  const currentQuiz = currentLesson?.quiz;
  const progressRecords = enrollment?.progressRecords || [];

  const { data: quizAttempts } = useQuery({
    queryKey: ['quiz-attempts', currentQuiz?.id],
    queryFn: () => quizService.getAttempts(currentQuiz?.id!),
    enabled: !!currentQuiz?.id,
  });

  const quizSubmitMutation = useMutation({
    mutationFn: (answers: { questionId: string; answerId: string }[]) =>
      quizService.submitAttempt(currentQuiz?.id!, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', currentQuiz?.id] });
      setShowQuizResults(true);
    },
  });

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
    setSelectedAnswers({});
    setShowQuizResults(false);
    setLessonCompleted(false);
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

  const progressMutationSuccess = () => {
    // After lesson completion, check if next lesson should be unlocked
    setLessonCompleted(true);
    if (currentQuiz) {
      // If lesson has quiz, show quiz after completion
      setShowQuizResults(false);
    } else if (currentLessonIndex < allLessons.length - 1) {
      // Move to next lesson if no quiz
      setCurrentLessonId(allLessons[currentLessonIndex + 1].id);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleQuizSubmit = () => {
    const answers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
      questionId,
      answerId,
    }));
    quizSubmitMutation.mutate(answers);
  };

  const handleQuizRetry = () => {
    setSelectedAnswers({});
    setShowQuizResults(false);
  };

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
              {currentQuiz && lessonCompleted ? (
                // Quiz View - only shown after lesson completion
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentQuiz.title}</h2>
                    
                    {quizAttempts && quizAttempts.length > 0 && !showQuizResults ? (
                      <QuizCard
                        quiz={currentQuiz}
                        attempts={quizAttempts}
                        onStartQuiz={() => setShowQuizResults(false)}
                        onRetryQuiz={handleQuizRetry}
                      />
                    ) : showQuizResults ? (
                      <div className="space-y-4">
                        {quizAttempts && quizAttempts.length > 0 && (
                          <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                              Quiz Results
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {(quizAttempts[0]?.score || 0).toFixed(0)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className={`text-2xl font-bold ${quizAttempts[0].passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {quizAttempts[0].passed ? 'Passed' : 'Failed'}
                                </p>
                              </div>
                            </div>
                            {quizAttempts[0].passed && currentLessonIndex < allLessons.length - 1 && (
                              <button
                                onClick={() => {
                                  setCurrentLessonId(allLessons[currentLessonIndex + 1].id);
                                  setLessonCompleted(false);
                                }}
                                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                              >
                                Continue to Next Lesson
                              </button>
                            )}
                            {!quizAttempts[0].passed && (
                              <button
                                onClick={handleQuizRetry}
                                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                              >
                                Retry Quiz
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentQuiz.questions?.map((question) => (
                          <QuizQuestion
                            key={question.id}
                            question={question}
                            selectedAnswer={selectedAnswers[question.id] || null}
                            onAnswerSelect={(answerId) => handleAnswerSelect(question.id, answerId)}
                          />
                        ))}
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(selectedAnswers).length !== currentQuiz.questions?.length}
                          className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Quiz
                        </button>
                      </div>
                    )}
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
                  isCompleted={progressRecords.some((p) => p.lessonId === currentLessonId && p.completed)}
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
