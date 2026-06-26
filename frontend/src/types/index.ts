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

export interface ClientDashboard {
  activeJobs: number;
  draftJobs: number;
  totalJobs: number;
  closedJobs: number;
  recentJobs: Job[];
  company: Company | null;
}
