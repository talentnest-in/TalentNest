import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  duration: number | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  visibility: boolean;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  sections?: CourseSection[];
  tags?: CourseTagRelation[];
  reviews?: CourseReview[];
  averageRating?: number;
  reviewCount?: number;
  _count?: {
    enrollments: number;
    reviews: number;
  };
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  attachments: string[];
  duration: number | null;
  type: 'VIDEO' | 'ARTICLE' | 'PDF' | 'EXTERNAL_LINK';
  order: number;
  isPreview: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string;
  course: Course;
  progressRecords?: LessonProgress[];
  certificate?: Certificate;
  student?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface EnrollmentResponse {
  enrolled: boolean;
  progress: number;
  completed: boolean;
  enrollmentId: string | null;
  course: Course;
  progressRecords: LessonProgress[];
  // These are present when enrolled
  id?: string;
  studentId?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt?: string;
  completedAt?: string | null;
  lastAccessedAt?: string;
  certificate?: Certificate;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  timeSpent: number;
  lastAccessedAt: string;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  certificateId: string;
  verificationCode: string;
  issuedAt: string;
  enrollment?: Enrollment;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  review: string;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface CourseWishlist {
  id: string;
  courseId: string;
  userId: string;
  createdAt: string;
  course: Course;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  bio: string | null;
  website: string | null;
  socialLinks: Record<string, string>;
  expertise: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CoursePurchase {
  id: string;
  courseId: string;
  studentId: string;
  amount: number;
  currency: string;
  discountAmount: number;
  purchasedAt: string;
}

export interface CourseAnalytics {
  id: string;
  courseId: string;
  totalEnrollments: number;
  totalViews: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  updatedAt: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  _count?: {
    courses: number;
  };
}

export interface CourseTag {
  id: string;
  name: string;
  slug: string;
}

export interface CourseTagRelation {
  id: string;
  courseId: string;
  tagId: string;
  tag: CourseTag;
}

export interface CoursesQueryParams {
  search?: string;
  category?: string;
  level?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatorStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
}

export interface PlatformAnalytics {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalCreators: number;
  totalStudents: number;
  topCourses: Course[];
}

// ── Course Service ────────────────────────────────────────────────────────────

export const courseService = {
  // Get all courses (marketplace)
  getAllCourses: async (params?: CoursesQueryParams): Promise<CoursesResponse> => {
    const res = await api.get('/courses', { params });
    return res.data;
  },

  // Get course by slug
  getCourseBySlug: async (slug: string): Promise<Course> => {
    const res = await api.get(`/courses/${slug}`);
    return res.data;
  },

  // Get course by ID (for creator editing)
  getCourseById: async (id: string): Promise<Course> => {
    const res = await api.get(`/courses/id/${id}`);
    return res.data;
  },

  // Get creator's courses
  getCreatorCourses: async (params?: { status?: string }): Promise<Course[]> => {
    const res = await api.get('/courses/creator/me', { params });
    return res.data;
  },

  // Create course
  createCourse: async (data: {
    categoryId: string;
    title: string;
    subtitle?: string;
    description: string;
    price?: number;
    discountPrice?: number;
    level?: string;
    language?: string;
    requirements?: string[];
    whatYouWillLearn?: string[];
    targetAudience?: string[];
  }): Promise<Course> => {
    const res = await api.post('/courses', data);
    return res.data;
  },

  // Update course
  updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
    const res = await api.put(`/courses/${id}`, data);
    return res.data;
  },

  // Upload course thumbnail
  uploadThumbnail: async (id: string, file: File): Promise<{ thumbnail: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/courses/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Delete course
  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  // Get course categories
  getCategories: async (): Promise<CourseCategory[]> => {
    const res = await api.get('/courses/categories');
    return res.data;
  },

  // Get course tags
  getTags: async (): Promise<CourseTag[]> => {
    const res = await api.get('/courses/tags');
    return res.data;
  },
};

// ── Lesson Service ─────────────────────────────────────────────────────────────

export const lessonService = {
  // Create section
  createSection: async (courseId: string, data: { title: string; description?: string }): Promise<CourseSection> => {
    const res = await api.post(`/courses/${courseId}/sections`, data);
    return res.data;
  },

  // Update section
  updateSection: async (sectionId: string, data: { title?: string; description?: string; order?: number }): Promise<CourseSection> => {
    const res = await api.put(`/sections/${sectionId}`, data);
    return res.data;
  },

  // Delete section
  deleteSection: async (sectionId: string): Promise<void> => {
    await api.delete(`/sections/${sectionId}`);
  },

  // Create lesson
  createLesson: async (sectionId: string, data: {
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    attachments?: string[];
    duration?: number;
    type?: string;
    isPreview?: boolean;
  }): Promise<Lesson> => {
    const res = await api.post(`/sections/${sectionId}/lessons`, data);
    return res.data;
  },

  // Update lesson
  updateLesson: async (lessonId: string, data: Partial<Lesson>): Promise<Lesson> => {
    const res = await api.put(`/lessons/${lessonId}`, data);
    return res.data;
  },

  // Upload lesson video
  uploadLessonVideo: async (lessonId: string, file: File): Promise<{ videoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/lessons/${lessonId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Delete lesson
  deleteLesson: async (lessonId: string): Promise<void> => {
    await api.delete(`/lessons/${lessonId}`);
  },

  // Reorder lessons
  reorderLessons: async (sectionId: string, lessons: { id: string; order: number }[]): Promise<{ success: boolean }> => {
    const res = await api.post(`/sections/${sectionId}/lessons/reorder`, { lessons });
    return res.data;
  },
};

// ── Enrollment Service ─────────────────────────────────────────────────────────

export const enrollmentService = {
  // Enroll in course
  enrollCourse: async (courseId: string): Promise<Enrollment> => {
    const res = await api.post(`/courses/${courseId}/enroll`);
    return res.data;
  },

  // Get user's enrollments
  getUserEnrollments: async (params?: { status?: string }): Promise<Enrollment[]> => {
    const res = await api.get('/enrollments', { params });
    return res.data;
  },

  // Get enrollment details
  getEnrollment: async (courseId: string): Promise<EnrollmentResponse> => {
    const res = await api.get(`/courses/${courseId}/enrollment`);
    return res.data;
  },

  // Update lesson progress
  updateLessonProgress: async (lessonId: string, data: {
    completed?: boolean;
    timeSpent?: number;
  }): Promise<{ progress: LessonProgress; courseProgress: number }> => {
    const res = await api.post(`/lessons/${lessonId}/progress`, data);
    return res.data;
  },

  // Cancel enrollment
  cancelEnrollment: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/enrollment`);
  },
};

// ── Certificate Service ────────────────────────────────────────────────────────

export const certificateService = {
  // Verify certificate (public)
  verifyCertificate: async (code: string): Promise<Certificate> => {
    const res = await api.get(`/certificates/verify/${code}`);
    return res.data;
  },

  // Get user's certificates
  getUserCertificates: async (): Promise<Certificate[]> => {
    const res = await api.get('/certificates');
    return res.data;
  },

  // Get certificate by ID
  getCertificateById: async (id: string): Promise<Certificate> => {
    const res = await api.get(`/certificates/${id}`);
    return res.data;
  },

  // Get certificate for specific enrollment
  getEnrollmentCertificate: async (courseId: string): Promise<Certificate> => {
    const res = await api.get(`/courses/${courseId}/certificate`);
    return res.data;
  },
};

// ── Review Service ─────────────────────────────────────────────────────────────

export const reviewService = {
  // Create course review
  createReview: async (courseId: string, data: { rating: number; review: string }): Promise<CourseReview> => {
    const res = await api.post(`/courses/${courseId}/reviews`, data);
    return res.data;
  },

  // Update review
  updateReview: async (reviewId: string, data: { rating?: number; comment?: string }): Promise<CourseReview> => {
    const res = await api.put(`/reviews/${reviewId}`, data);
    return res.data;
  },

  // Delete review
  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },

  // Reply to review
  replyReview: async (reviewId: string, data: { reply: string }): Promise<CourseReview> => {
    const res = await api.post(`/reviews/${reviewId}/reply`, data);
    return res.data;
  },

  // Add to wishlist
  addToWishlist: async (courseId: string): Promise<void> => {
    await api.post(`/courses/${courseId}/wishlist`);
  },

  // Remove from wishlist
  removeFromWishlist: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/wishlist`);
  },

  // Get user's wishlist
  getWishlist: async (): Promise<CourseWishlist[]> => {
    const res = await api.get('/wishlist');
    return res.data;
  },

  // Check if course is in wishlist
  checkWishlist: async (courseId: string): Promise<{ inWishlist: boolean }> => {
    const res = await api.get(`/courses/${courseId}/wishlist/check`);
    return res.data;
  },
};

// ── Creator Service ────────────────────────────────────────────────────────────

export const creatorService = {
  // Get or create creator profile
  getCreatorProfile: async (): Promise<CreatorProfile> => {
    const res = await api.get('/creator/profile');
    return res.data;
  },

  // Update creator profile
  updateCreatorProfile: async (data: Partial<CreatorProfile>): Promise<CreatorProfile> => {
    const res = await api.put('/creator/profile', data);
    return res.data;
  },

  // Get creator dashboard stats
  getCreatorStats: async (): Promise<CreatorStats> => {
    const res = await api.get('/creator/stats');
    return res.data;
  },

  // Get public creator profile
  getPublicCreatorProfile: async (creatorId: string): Promise<CreatorProfile & { user: { name: string; avatar: string | null } }> => {
    const res = await api.get(`/creators/${creatorId}`);
    return res.data;
  },
};

// ── Analytics Service ─────────────────────────────────────────────────────────

export const analyticsService = {
  // Get course analytics
  getCourseAnalytics: async (courseId: string): Promise<CourseAnalytics> => {
    const res = await api.get(`/courses/${courseId}/analytics`);
    return res.data;
  },

  // Get platform-wide analytics (admin only)
  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const res = await api.get('/analytics/platform');
    return res.data;
  },
};
