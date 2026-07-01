import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Users, Award, Globe, BookOpen } from 'lucide-react';
import { creatorService, courseService } from '@/services/academy.service';
import { CourseCard } from '@/components/academy/CourseCard';

export const AcademyCreatorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ['creator-profile', id],
    queryFn: () => creatorService.getPublicCreatorProfile(id!),
    enabled: !!id,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['creator-courses-public', id],
    queryFn: () => courseService.getCreatorCourses({ status: 'PUBLISHED' }),
    enabled: !!id,
  });

  if (creatorLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Creator not found</p>
      </div>
    );
  }

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

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              {creator.user?.avatar ? (
                <img
                  src={creator.user.avatar}
                  alt={creator.user?.name || 'Creator'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-medium text-gray-500">
                    {creator.user?.name?.[0] || 'C'}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{creator.user?.name || 'Creator'}</h1>
              {creator.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{creator.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-4 mb-4">
                {creator.website && (
                  <a
                    href={creator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {creator.socialLinks.linkedin && (
                  <a
                    href={creator.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {creator.socialLinks.twitter && (
                  <a
                    href={creator.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="w-4 h-4" />
                    Twitter
                  </a>
                )}
                {creator.socialLinks.github && (
                  <a
                    href={creator.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Globe className="w-4 h-4" />
                    GitHub
                  </a>
                )}
              </div>

              {/* Expertise */}
              {creator.expertise && creator.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {creator.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-900 mb-1">
                <BookOpen className="w-5 h-5" />
                <span className="text-2xl font-bold">{courses?.length || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Courses</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-900 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {courses?.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0) || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Students</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-900 mb-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold">
                  {courses?.length
                    ? ((courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length) || 0).toFixed(1)
                    : '0'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-900 mb-1">
                <Award className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {courses?.reduce((sum, c) => sum + (c._count?.reviews || 0), 0) || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Courses by {creator.user.name}</h2>
        
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No courses published yet.
          </div>
        )}
      </div>
    </div>
  );
};
