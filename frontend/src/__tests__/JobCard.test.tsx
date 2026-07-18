import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { JobCard } from '../components/freelancer/JobCard';
import type { JobWithDetails } from '../types';

vi.mock('../components/freelancer/SaveButton', () => ({
  SaveButton: ({ jobId }: { jobId: string }) => <button data-testid="save-button">{jobId}</button>,
}));

const mockJob: JobWithDetails = {
  id: 'job-1',
  title: 'Senior React Developer',
  description: 'Looking for an experienced React developer',
  type: 'FIXED',
  budget: 10000,
  status: 'OPEN',
  location: 'Remote',
  isRemote: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  clientProfileId: 'client-1',
  skills: [
    { id: 's1', name: 'React' },
    { id: 's2', name: 'TypeScript' },
  ],
  clientProfile: {
    id: 'client-1',
    userId: 'user-1',
    bio: null,
    website: null,
    location: null,
    logoUrl: null,
    company: { 
      id: 'c-1', 
      name: 'TechCorp', 
      industry: null,
      size: null,
      description: null,
      website: null,
      logoUrl: null,
      location: null 
    },
  },
};

describe('JobCard', () => {
  it('renders job title', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    expect(screen.getByText('Senior React Developer')).toBeTruthy();
  });

  it('renders company name', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    expect(screen.getByText('TechCorp')).toBeTruthy();
  });

  it('renders job type', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    expect(screen.getByText('Fixed Price')).toBeTruthy();
  });

  it('renders budget with formatting', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    expect(screen.getByText('$10,000')).toBeTruthy();
  });

  it('renders remote badge', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    const remoteElements = screen.getAllByText('Remote');
    expect(remoteElements.length).toBe(2);
    const badge = remoteElements[1];
    expect(badge.className).toContain('rounded-full');
  });

  it('renders skills list', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('renders view details link', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>,
    );
    const link = screen.getByText('View Details').closest('a');
    expect(link).toHaveAttribute('href', '/jobs/job-1');
  });

  it('renders save button when showSaveButton is true', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} showSaveButton={true} />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('save-button')).toBeTruthy();
  });

  it('hides save button when showSaveButton is false', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} showSaveButton={false} />
      </BrowserRouter>,
    );
    expect(screen.queryByTestId('save-button')).toBeNull();
  });
});
