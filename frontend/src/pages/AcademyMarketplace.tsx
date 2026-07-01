import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { CourseGrid, CourseFilters, CourseSearch } from '@/components/academy';
import { courseService, reviewService, creatorService } from '@/services/academy.service';
import type { CoursesQueryParams } from '@/services/academy.service';

export const AcademyMarketplace: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: creatorService.getCreatorProfile,
  });

  const { data: categories } = useQuery({
    queryKey: ['course-categories'],
    queryFn: courseService.getCategories,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: reviewService.getWishlist,
  });

  const wishlistedCourses = new Set(wishlist?.map((w) => w.courseId) || []);

  const queryParams: CoursesQueryParams = {
    search: search || undefined,
    category: selectedCategory || undefined,
    level: selectedLevel || undefined,
    language: selectedLanguage || undefined,
    minPrice: priceRange.min > 0 ? priceRange.min : undefined,
    maxPrice: priceRange.max < 1000 ? priceRange.max : undefined,
    sortBy,
    sortOrder,
    page,
    limit: 12,
  };

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', queryParams],
    queryFn: () => courseService.getAllCourses(queryParams),
  });

  const handleWishlistToggle = async (courseId: string) => {
    try {
      if (wishlistedCourses.has(courseId)) {
        await reviewService.removeFromWishlist(courseId);
      } else {
        await reviewService.addToWishlist(courseId);
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedLanguage('');
    setPriceRange({ min: 0, max: 1000 });
    setMinRating(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Academy</h1>
              <p className="text-gray-600">Discover courses to enhance your skills</p>
            </div>
            {!creatorProfile?.bio ? (
              <Link
                to="/academy/become-creator"
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Become a Creator
              </Link>
            ) : (
              <Link
                to="/academy/creator"
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Creator Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <CourseSearch value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-4">
            <CourseFilters
              categories={categories || []}
              selectedCategory={selectedCategory}
              selectedLevel={selectedLevel}
              selectedLanguage={selectedLanguage}
              priceRange={priceRange}
              minRating={minRating}
              onCategoryChange={setSelectedCategory}
              onLevelChange={setSelectedLevel}
              onLanguageChange={setSelectedLanguage}
              onPriceRangeChange={setPriceRange}
              onRatingChange={setMinRating}
              onClearFilters={handleClearFilters}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="createdAt-desc">Newest</option>
              <option value="createdAt-asc">Oldest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Course Grid */}
        <CourseGrid
          courses={coursesData?.courses || []}
          loading={isLoading}
          onWishlistToggle={handleWishlistToggle}
          wishlistedCourses={wishlistedCourses}
        />

        {/* Pagination */}
        {coursesData && coursesData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {coursesData.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(coursesData.pagination.totalPages, p + 1))}
              disabled={page === coursesData.pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
