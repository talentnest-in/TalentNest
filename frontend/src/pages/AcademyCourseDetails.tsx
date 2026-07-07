import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Users, Clock, BookOpen, Heart, Check } from 'lucide-react';
import { courseService, enrollmentService, reviewService } from '@/services/academy.service';
import { RatingStars, ReviewCard, ReviewForm } from '@/components/academy';

export const AcademyCourseDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseService.getCourseBySlug(slug!),
    enabled: !!slug,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', course?.id],
    queryFn: () => enrollmentService.getEnrollment(course!.id),
    enabled: !!course?.id,
  });

  // Check if course is completed
  const isCourseCompleted = enrollment?.status === 'COMPLETED';

  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-check', course?.id],
    queryFn: () => reviewService.checkWishlist(course!.id),
    enabled: !!course?.id,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollmentService.enrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: (isWishlisted: boolean) =>
      isWishlisted
        ? reviewService.removeFromWishlist(course!.id)
        : reviewService.addToWishlist(course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; review: string }) =>
      reviewService.createReview(course!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', slug] });
      setShowReviewForm(false);
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

  const displayPrice = course.discountPrice || course.price;
  const originalPrice = course.discountPrice ? course.price : null;
  const isEnrolled = enrollment?.enrolled === true && enrollment?.status !== 'CANCELLED';
  const isWishlisted = wishlistStatus?.inWishlist || false;
  const canReview = isEnrolled && enrollment?.status === 'COMPLETED' && !course.reviews?.find(r => r.studentId === enrollment.studentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/academy"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Academy</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <BookOpen className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-gray-600 mb-4">{course.subtitle}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <RatingStars rating={course.averageRating || 0} size={16} />
                  <span className="font-medium text-gray-900">
                    {(course.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-gray-400">({course._count?.reviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course._count?.enrollments || 0} students</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} hours</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-6">
                {course.creator?.avatar ? (
                  <img
                    src={course.creator.avatar}
                    alt={course.creator?.name || 'Creator'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-500">
                      {course.creator?.name?.[0] || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{course.creator?.name || 'Creator'}</p>
                  <p className="text-sm text-gray-600">Course Creator</p>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${(displayPrice || 0).toFixed(2)}
                    </span>
                    {originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        ${(originalPrice || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {course.discountPrice && (
                    <span className="text-sm text-green-600 font-medium">
                      {course.price && course.discountPrice ? Math.round(((course.price - course.discountPrice) / course.price) * 100) : 0}% off
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {!isEnrolled ? (
                    <button
                      onClick={() => enrollMutation.mutate(course.id)}
                      disabled={enrollMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  ) : isCourseCompleted ? (
                    <Link
                      to={`/academy/certificate/${enrollment?.certificate?.id}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      View Certificate
                    </Link>
                  ) : (
                    <Link
                      to={`/academy/learning/${course.id}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Continue Learning
                    </Link>
                  )}

                  <button
                    onClick={() => wishlistMutation.mutate(isWishlisted)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium text-gray-900">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium text-gray-900">{course.language}</span>
                  </div>
                  {course.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{course.duration} hours</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this course</h2>
              <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
            </div>

            {/* What You'll Learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-gray-400">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Audience */}
            {course.targetAudience && course.targetAudience.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Target audience</h2>
                <ul className="space-y-2">
                  {course.targetAudience.map((aud, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-gray-400">•</span>
                      <span>{aud}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            {course.sections && course.sections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Curriculum</h2>
                <div className="space-y-3">
                  {course.sections.map((section) => (
                    <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                        )}
                      </div>
                      {section.lessons && section.lessons.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {section.lessons.map((lesson) => (
                            <div key={lesson.id} className="px-4 py-3 flex items-center gap-3">
                              <Play className="w-4 h-4 text-gray-400" />
                              <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500">{lesson.duration}m</span>
                              )}
                              {lesson.isPreview && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                  Preview
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                {canReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    onSubmit={(rating, review) =>
                      reviewMutation.mutate({ rating, review })
                    }
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {course.reviews && course.reviews.length > 0 ? (
                <div className="space-y-4">
                  {course.reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isCreator={false}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Creator</h3>
              <div className="flex items-center gap-3 mb-4">
                {course.creator?.avatar ? (
                  <img
                    src={course.creator.avatar}
                    alt={course.creator?.name || 'Creator'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-500">
                      {course.creator?.name?.[0] || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{course.creator?.name || 'Creator'}</p>
                  <p className="text-sm text-gray-600">Course Creator</p>
                </div>
              </div>
              <Link
                to={`/academy/creator/${course.creator?.id}`}
                className="block w-full text-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
