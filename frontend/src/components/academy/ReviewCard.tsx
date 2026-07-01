import React from 'react';
import { Star, MessageCircle } from 'lucide-react';
import type { CourseReview } from '@/services/academy.service';

interface ReviewCardProps {
  review: CourseReview;
  isCreator?: boolean;
  onReply?: (reviewId: string, reply: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isCreator = false,
  onReply,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {review.student?.avatar ? (
          <img
            src={review.student.avatar}
            alt={review.student?.name || 'Student'}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-medium text-gray-500">
              {review.student?.name?.[0] || 'S'}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{review.student?.name || 'Student'}</h4>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-gray-700 mb-4">{review.review}</p>

          {/* Creator Reply */}
          {review.reply && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">
                  Creator Reply
                </span>
              </div>
              <p className="text-sm text-gray-700">{review.reply}</p>
            </div>
          )}

          {/* Reply Button (Creator Only) */}
          {isCreator && !review.reply && onReply && (
            <button
              onClick={() => onReply(review.id, '')}
              className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
