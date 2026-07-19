import { api } from '@/lib/api';

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

export const courseService = {
  getAllCourses: async (params?: CoursesQueryParams): Promise<CoursesResponse> => {
    const res = await api.get('/courses', { params });
    const data = res.data?.data ?? res.data;
    return {
      courses: Array.isArray(data?.courses) ? data.courses : [],
      pagination: data?.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  },

  getCourseBySlug: async (slug: string): Promise<Course> => {
    const res = await api.get(`/courses/${slug}`);
    return res.data?.data ?? res.data;
  },

  getCourseById: async (id: string): Promise<Course> => {
    const res = await api.get(`/courses/id/${id}`);
    return res.data?.data ?? res.data;
  },

  getCreatorCourses: async (params?: { status?: string }): Promise<Course[]> => {
    const res = await api.get('/courses/creator/me', { params });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

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
    return res.data?.data ?? res.data;
  },

  updateCourse: async (id: string, data: Partial<Course>): Promise<Course> => {
    const res = await api.put(`/courses/${id}`, data);
    return res.data?.data ?? res.data;
  },

  uploadThumbnail: async (id: string, file: File): Promise<{ thumbnail: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/courses/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  getCategories: async (): Promise<CourseCategory[]> => {
    const res = await api.get('/courses/categories');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  getTags: async (): Promise<CourseTag[]> => {
    const res = await api.get('/courses/tags');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },
};

export const lessonService = {
  createSection: async (courseId: string, data: { title: string; description?: string }): Promise<CourseSection> => {
    const res = await api.post(`/courses/${courseId}/sections`, data);
    return res.data?.data ?? res.data;
  },

  updateSection: async (sectionId: string, data: { title?: string; description?: string; order?: number }): Promise<CourseSection> => {
    const res = await api.put(`/sections/${sectionId}`, data);
    return res.data?.data ?? res.data;
  },

  deleteSection: async (sectionId: string): Promise<void> => {
    await api.delete(`/sections/${sectionId}`);
  },

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
    return res.data?.data ?? res.data;
  },

  updateLesson: async (lessonId: string, data: Partial<Lesson>): Promise<Lesson> => {
    const res = await api.put(`/lessons/${lessonId}`, data);
    return res.data?.data ?? res.data;
  },

  uploadLessonVideo: async (lessonId: string, file: File): Promise<{ videoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/lessons/${lessonId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await api.delete(`/lessons/${lessonId}`);
  },

  reorderLessons: async (sectionId: string, lessons: { id: string; order: number }[]): Promise<{ success: boolean }> => {
    const res = await api.post(`/sections/${sectionId}/lessons/reorder`, { lessons });
    return res.data?.data ?? res.data;
  },
};

export const enrollmentService = {
  enrollCourse: async (courseId: string): Promise<Enrollment> => {
    const res = await api.post(`/courses/${courseId}/enroll`);
    return res.data?.data ?? res.data;
  },

  getUserEnrollments: async (params?: { status?: string }): Promise<Enrollment[]> => {
    const res = await api.get('/enrollments', { params });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  getEnrollment: async (courseId: string): Promise<EnrollmentResponse> => {
    const res = await api.get(`/courses/${courseId}/enrollment`);
    return res.data?.data ?? res.data;
  },

  updateLessonProgress: async (lessonId: string, data: {
    completed?: boolean;
    timeSpent?: number;
  }): Promise<{ progress: LessonProgress; courseProgress: number }> => {
    const res = await api.post(`/lessons/${lessonId}/progress`, data);
    return res.data?.data ?? res.data;
  },

  cancelEnrollment: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/enrollment`);
  },
};

export const certificateService = {
  verifyCertificate: async (code: string): Promise<Certificate> => {
    const res = await api.get(`/certificates/verify/${code}`);
    return res.data?.data ?? res.data;
  },

  getUserCertificates: async (): Promise<Certificate[]> => {
    const res = await api.get('/certificates');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  getCertificateById: async (id: string): Promise<Certificate> => {
    const res = await api.get(`/certificates/${id}`);
    return res.data?.data ?? res.data;
  },

  getEnrollmentCertificate: async (courseId: string): Promise<Certificate> => {
    const res = await api.get(`/courses/${courseId}/certificate`);
    return res.data?.data ?? res.data;
  },
};

export const reviewService = {
  createReview: async (courseId: string, data: { rating: number; review: string }): Promise<CourseReview> => {
    const res = await api.post(`/courses/${courseId}/reviews`, data);
    return res.data?.data ?? res.data;
  },

  updateReview: async (reviewId: string, data: { rating?: number; comment?: string }): Promise<CourseReview> => {
    const res = await api.put(`/reviews/${reviewId}`, data);
    return res.data?.data ?? res.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },

  replyReview: async (reviewId: string, data: { reply: string }): Promise<CourseReview> => {
    const res = await api.post(`/reviews/${reviewId}/reply`, data);
    return res.data?.data ?? res.data;
  },

  addToWishlist: async (courseId: string): Promise<void> => {
    await api.post(`/courses/${courseId}/wishlist`);
  },

  removeFromWishlist: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/wishlist`);
  },

  getWishlist: async (): Promise<CourseWishlist[]> => {
    const res = await api.get('/wishlist');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  checkWishlist: async (courseId: string): Promise<{ inWishlist: boolean }> => {
    const res = await api.get(`/courses/${courseId}/wishlist/check`);
    return res.data?.data ?? res.data;
  },
};

export const creatorService = {
  getCreatorProfile: async (): Promise<CreatorProfile> => {
    const res = await api.get('/creator/profile');
    return res.data?.data ?? res.data;
  },

  updateCreatorProfile: async (data: Partial<CreatorProfile>): Promise<CreatorProfile> => {
    const res = await api.put('/creator/profile', data);
    return res.data?.data ?? res.data;
  },

  getCreatorStats: async (): Promise<CreatorStats> => {
    const res = await api.get('/creator/stats');
    return res.data?.data ?? res.data;
  },

  getPublicCreatorProfile: async (creatorId: string): Promise<CreatorProfile & { user: { name: string; avatar: string | null } }> => {
    const res = await api.get(`/creators/${creatorId}`);
    return res.data?.data ?? res.data;
  },
};

export const analyticsService = {
  getCourseAnalytics: async (courseId: string): Promise<CourseAnalytics> => {
    const res = await api.get(`/courses/${courseId}/analytics`);
    return res.data?.data ?? res.data;
  },

  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const res = await api.get('/analytics/platform');
    return res.data?.data ?? res.data;
  },
};
