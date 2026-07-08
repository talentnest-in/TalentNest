// Shared TypeScript types for the entire application

export type Role = 'FREELANCER' | 'CLIENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  provider?: string | null;
  role: Role | null;
  onboardingCompleted: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  issues?: Array<{ message: string; path: string[] }>;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  projectUrl: string | null;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  location: string | null;
  resumeUrl: string | null;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  projects: PortfolioProject[];
}

// ─── Sprint 3: Client & Job Management ────────────────────────────────────────

export type JobStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED';
export type JobType = 'FIXED' | 'HOURLY';

export interface JobSkill {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  location: string | null;
}

export interface ClientProfile {
  id: string;
  userId: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  logoUrl: string | null;
  company: Company | null;
}

export interface Job {
  id: string;
  clientProfileId: string;
  title: string;
  description: string;
  type: JobType;
  budget: number | null;
  status: JobStatus;
  location: string | null;
  isRemote: boolean;
  skills: JobSkill[];
  createdAt: string;
  updatedAt: string;
  clientProfile?: ClientProfile;
}

export interface JobWithDetails extends Job {
  clientProfile: ClientProfile & { company: Company | null };
}

export interface ClientDashboard {
  activeJobs: number;
  draftJobs: number;
  totalJobs: number;
  closedJobs: number;
  recentJobs: Job[];
  company: Company | null;
}

// ─── Sprint 4: Job Marketplace & Saved Jobs ───────────────────────────────────

export interface SavedJob {
  id: string;
  freelancerProfileId: string;
  jobId: string;
  createdAt: string;
  job: JobWithDetails;
}

export interface JobsQueryParams {
  search?: string;
  type?: JobType;
  skills?: string;
  minBudget?: string;
  maxBudget?: string;
  isRemote?: string;
  datePosted?: string;
  sortBy?: 'newest' | 'oldest' | 'budget_low' | 'budget_high';
  page?: string;
}

export interface JobsResponse {
  jobs: JobWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Sprint 5: Job Applications ─────────────────────────────────────────────────────

export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';

export interface JobApplication {
  id: string;
  freelancerProfileId: string;
  jobId: string;
  coverLetter: string;
  proposedRate: number | null;
  estimatedDuration: string | null;
  resumeUrl: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job?: JobWithDetails;
  profile?: FreelancerProfile;
  offer?: Offer;
}

export interface ApplicationWithDetails extends JobApplication {
  job: JobWithDetails;
  profile: FreelancerProfile & {
    user: User;
    skills: Skill[];
    experiences: Experience[];
    educations: Education[];
    projects: PortfolioProject[];
  };
}

export interface ApplicationsQueryParams {
  page?: string;
  search?: string;
  status?: ApplicationStatus;
}

export interface ApplicationsResponse {
  applications: ApplicationWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApplyJobInput {
  coverLetter: string;
  proposedRate?: number;
  estimatedDuration?: string;
  resumeUrl?: string;
}

export interface UpdateStatusInput {
  status: ApplicationStatus;
}

// ─── Sprint 6: Offers & Contracts ─────────────────────────────────────────────────────

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface Offer {
  id: string;
  applicationId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  message: string;
  proposedBudget: number;
  currency: string;
  estimatedDuration: string | null;
  deadline: string | null;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  application?: {
    job: JobWithDetails;
    profile: FreelancerProfile & { user: User };
  };
  client?: User;
  freelancer?: User;
  contract?: Contract;
}

export interface OfferWithDetails extends Offer {
  application: {
    job: JobWithDetails;
    profile: FreelancerProfile & {
      user: User;
      skills: Skill[];
      experiences: Experience[];
      educations: Education[];
    };
  };
  client: User;
  freelancer: User;
}

export interface Contract {
  id: string;
  offerId: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string;
  agreedBudget: number;
  currency: string;
  deadline: string | null;
  status: ContractStatus;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  offer?: Offer;
  job?: JobWithDetails;
  client?: User;
  freelancer?: User;
}

export interface ContractWithDetails extends Contract {
  offer: OfferWithDetails;
  job: JobWithDetails & {
    clientProfile: ClientProfile & { company: Company | null };
  };
  client: User;
  freelancer: User;
}

export interface CreateOfferInput {
  applicationId: string;
  title: string;
  message: string;
  proposedBudget: number;
  currency: string;
  estimatedDuration?: string;
  deadline?: string;
}

export interface OffersQueryParams {
  status?: OfferStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OffersResponse {
  offers: OfferWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContractsQueryParams {
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

export interface ContractsResponse {
  contracts: ContractWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Sprint 9: Community Module ────────────────────────────────────────────────

export type CommunityType = 'PUBLIC' | 'PRIVATE';
export type CommunityRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';
export type PostType = 'TEXT' | 'IMAGE' | 'PDF' | 'LINK';
export type ReportStatus = 'PENDING' | 'REVIEWED';

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityRole;
  joinedAt: string;
  user?: User;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: CommunityType;
  banner: string | null;
  logo: string | null;
  creatorId: string;
  rules: string[];
  createdAt: string;
  updatedAt: string;
  // Populated by backend when authenticated
  isMember?: boolean;
  memberRole?: string | null;
  _count?: {
    members: number;
    posts: number;
  };
  creator?: User;
  members?: CommunityMember[];
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: PostComment[];
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  type: PostType;
  mediaUrls: string[];
  linkUrl: string | null;
  authorId: string;
  communityId: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
  community?: Pick<Community, 'id' | 'name' | 'slug' | 'type'>;
  likes?: PostLike[];
  comments?: PostComment[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface SearchResult {
  communities: Community[];
  posts: Post[];
  users: User[];
  jobs: Job[];
  contests: Contest[];
}

// ─── Sprint 10: Contest Hub ─────────────────────────────────────────────────────

export type ContestDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type ContestVisibility = 'PUBLIC' | 'PRIVATE';
export type ContestStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
export type ContestSubmissionStatus = 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'WINNER' | 'RUNNER_UP';

export interface ContestAttachment {
  id: string;
  contestId: string;
  url: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface ContestParticipant {
  id: string;
  contestId: string;
  userId: string;
  joinedAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  participantId: string;
  description: string;
  imageUrls: string[];
  pdfUrl: string | null;
  zipUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  figmaUrl: string | null;
  videoUrl: string | null;
  status: ContestSubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  participant?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  skills: string[];
  difficulty: ContestDifficulty;
  prizeAmount: number;
  registrationDeadline: string;
  submissionDeadline: string;
  maxParticipants: number | null;
  visibility: ContestVisibility;
  status: ContestStatus;
  rules: string[];
  judgingCriteria: string[];
  featuredImage: string | null;
  isFeatured: boolean;
  viewCount: number;
  clientId: string;
  winnerId: string | null;
  runnerUpId: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Pick<User, 'id' | 'name' | 'avatar'>;
  winner?: Pick<User, 'id' | 'name' | 'avatar'> | null;
  runnerUp?: Pick<User, 'id' | 'name' | 'avatar'> | null;
  attachments?: ContestAttachment[];
  submissions?: ContestSubmission[];
  savedBy?: { id: string }[];
  _count?: {
    participants: number;
    submissions: number;
  };
}

export interface ContestAnalytics {
  viewCount: number;
  participantCount: number;
  submissionCount: number;
  shortlistedCount: number;
  submissionRate: number;
}

