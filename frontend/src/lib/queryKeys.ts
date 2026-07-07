/**
 * Centralized query key factory for React Query.
 * Using factory functions ensures type-safety and prevents typo-based cache misses.
 *
 * Usage:
 *   useQuery({ queryKey: QUERY_KEYS.community.detail(slug), ... })
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.lists() })
 */

export const QUERY_KEYS = {
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: {
    me: () => ['me'] as const,
  },

  // ── Freelancer ───────────────────────────────────────────────────────────
  freelancer: {
    profile: (userId?: string) => ['freelancerProfile', userId] as const,
    dashboard: () => ['freelancerDashboard'] as const,
  },

  // ── Client ───────────────────────────────────────────────────────────────
  client: {
    profile: (userId?: string) => ['clientProfile', userId] as const,
    dashboard: () => ['clientDashboard'] as const,
    company: () => ['company'] as const,
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────
  jobs: {
    all: () => ['jobs'] as const,
    list: (params?: Record<string, unknown>) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    saved: () => ['savedJobs'] as const,
  },

  // ── Applications ─────────────────────────────────────────────────────────
  applications: {
    all: () => ['applications'] as const,
    list: (params?: Record<string, unknown>) => ['applications', 'list', params] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
    forJob: (jobId: string) => ['applications', 'forJob', jobId] as const,
  },

  // ── Offers ───────────────────────────────────────────────────────────────
  offers: {
    all: () => ['offers'] as const,
    list: (params?: Record<string, unknown>) => ['offers', 'list', params] as const,
    detail: (id: string) => ['offers', 'detail', id] as const,
  },

  // ── Contracts ────────────────────────────────────────────────────────────
  contracts: {
    all: () => ['contracts'] as const,
    list: (params?: Record<string, unknown>) => ['contracts', 'list', params] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: {
    conversations: () => ['conversations'] as const,
    detail: (id: string) => ['conversation', id] as const,
    messages: (conversationId: string) => ['messages', conversationId] as const,
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    all: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },

  // ── Community ────────────────────────────────────────────────────────────
  community: {
    lists: () => ['communities'] as const,
    list: (params?: Record<string, unknown>) => ['communities', 'list', params] as const,
    detail: (slug: string) => ['community', slug] as const,
    posts: (communityId: string) => ['communityPosts', communityId] as const,
    members: (communityId: string) => ['communityMembers', communityId] as const,
    search: (q: string) => ['communitySearch', q] as const,
  },

  // ── Posts ────────────────────────────────────────────────────────────────
  posts: {
    all: () => ['posts'] as const,
    list: (params?: Record<string, unknown>) => ['posts', 'list', params] as const,
    detail: (id: string) => ['post', id] as const,
    comments: (postId: string) => ['postComments', postId] as const,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  search: {
    global: (q: string) => ['search', q] as const,
  },

  // ── Academy ──────────────────────────────────────────────────────────────
  academy: {
    courses: () => ['courses'] as const,
    courseDetail: (slug: string) => ['course', slug] as const,
    myLearning: () => ['myLearning'] as const,
    enrollment: (courseId: string) => ['enrollment', courseId] as const,
    certificate: (id: string) => ['certificate', id] as const,
    creatorCourses: () => ['creatorCourses'] as const,
    analytics: () => ['creatorAnalytics'] as const,
  },

  // ── Workspace ────────────────────────────────────────────────────────────
  workspace: {
    files: (contractId: string) => ['workspaceFiles', contractId] as const,
    milestones: (contractId: string) => ['milestones', contractId] as const,
    notes: (contractId: string) => ['notes', contractId] as const,
  },
} as const;
