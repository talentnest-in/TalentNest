import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Clock, BookOpen, Heart } from 'lucide-react';
import type { Course } from '@/services/academy.service';

interface CourseCardProps {
  course: Course;
  onWishlistToggle?: (courseId: string) => void;
  isWishlisted?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onWishlistToggle, isWishlisted }) => {
  const displayPrice = course.discountPrice || course.price;
  const originalPrice = course.discountPrice ? course.price : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-100">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <BookOpen className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Wishlist Button */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWishlistToggle(course.id);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
          {course.level}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <Link to={`/academy/course/${course.slug}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
            {course.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {course.subtitle || course.description}
        </p>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3">
          {course.creator?.avatar ? (
            <img
              src={course.creator.avatar}
              alt={course.creator?.name || 'Creator'}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">{course.creator?.name?.[0] || 'C'}</span>
            </div>
          )}
          <span className="text-sm text-gray-600">{course.creator?.name || 'Creator'}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-medium text-gray-900">{(course.averageRating || 0).toFixed(1)}</span>
            <span className="text-gray-400">({course._count?.reviews || 0})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course._count?.enrollments || 0}</span>
          </div>
          {course.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}h</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              ${(displayPrice || 0).toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${(originalPrice || 0).toFixed(2)}
              </span>
            )}
          </div>
          <Link
            to={`/academy/course/${course.slug}`}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
};
