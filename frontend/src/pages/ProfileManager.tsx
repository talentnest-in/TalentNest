import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freelancerService } from '@/services/freelancer.service';
import { portfolioService } from '@/services/portfolio.service';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProfileProgressCard } from '@/components/freelancer/ProfileProgressCard';
import { SkillChips } from '@/components/freelancer/SkillChips';
import { ExperienceTimeline } from '@/components/freelancer/ExperienceTimeline';
import { EducationCards } from '@/components/freelancer/EducationCards';
import { PortfolioGrid } from '@/components/freelancer/PortfolioGrid';
import { ResumeCard } from '@/components/freelancer/ResumeCard';
import { User, Briefcase, GraduationCap, FolderDot, Plus, Loader2 } from 'lucide-react';
import type { Experience, Education, PortfolioProject } from '@/types';
import { BACKEND_URL } from '@/lib/constants';

// ─── Experience Form ─────────────────────────────────────────────────────────
function ExperienceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Experience;
  onSave: (data: Omit<Experience, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    startDate: initial?.startDate ? initial.startDate.slice(0, 10) : '',
    endDate: initial?.endDate ? initial.endDate.slice(0, 10) : '',
    current: initial?.current ?? false,
    description: initial?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        company: form.company,
        role: form.role,
        startDate: form.startDate,
        endDate: form.current ? null : form.endDate || null,
        current: form.current,
        description: form.description || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Company *</label>
        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Google" />
      </div>
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Role / Title *</label>
        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Engineer" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-text-muted mb-1 block">Start Date *</label>
          <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div><label className="text-sm font-medium text-text-muted mb-1 block">End Date</label>
          <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" disabled={form.current} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={e => setForm({ ...form, current: e.target.checked, endDate: '' })} />
        I currently work here
      </label>
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Description</label>
        <textarea className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your role..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{initial ? 'Save Changes' : 'Add Experience'}</Button>
      </div>
    </form>
  );
}

// ─── Education Form ─────────────────────────────────────────────────────────
function EducationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Education;
  onSave: (data: Omit<Education, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    institution: initial?.institution ?? '',
    degree: initial?.degree ?? '',
    fieldOfStudy: initial?.fieldOfStudy ?? '',
    startDate: initial?.startDate ? initial.startDate.slice(0, 10) : '',
    endDate: initial?.endDate ? initial.endDate.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        institution: form.institution,
        degree: form.degree,
        fieldOfStudy: form.fieldOfStudy,
        startDate: form.startDate,
        endDate: form.endDate || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Institution *</label>
        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="e.g. MIT" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-text-muted mb-1 block">Degree *</label>
          <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} placeholder="e.g. B.Tech" />
        </div>
        <div><label className="text-sm font-medium text-text-muted mb-1 block">Field of Study *</label>
          <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.fieldOfStudy} onChange={e => setForm({ ...form, fieldOfStudy: e.target.value })} placeholder="e.g. Computer Science" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-text-muted mb-1 block">Start Date *</label>
          <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div><label className="text-sm font-medium text-text-muted mb-1 block">End Date</label>
          <input type="date" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{initial ? 'Save Changes' : 'Add Education'}</Button>
      </div>
    </form>
  );
}

// ─── Portfolio Form ────────────────────────────────────────────────────────
function PortfolioForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: PortfolioProject;
  onSave: (data: Omit<PortfolioProject, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    projectUrl: initial?.projectUrl ?? '',
    imageUrl: initial?.imageUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await portfolioService.uploadProjectImage(file);
      setForm(f => ({ ...f, imageUrl: url }));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        description: form.description,
        projectUrl: form.projectUrl || null,
        imageUrl: form.imageUrl || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Project Title *</label>
        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. E-Commerce App" />
      </div>
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Description *</label>
        <textarea className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-none" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what you built..." />
      </div>
      <div><label className="text-sm font-medium text-text-muted mb-1 block">Project URL</label>
        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" type="url" value={form.projectUrl} onChange={e => setForm({ ...form, projectUrl: e.target.value })} placeholder="https://..." />
      </div>
      <div>
        <label className="text-sm font-medium text-text-muted mb-1 block">Project Image</label>
        {form.imageUrl && (
          <img src={`${BACKEND_URL}${form.imageUrl}`} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
        )}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-accent hover:underline">
          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
          {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {form.imageUrl ? 'Change Image' : 'Upload Image'}
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{initial ? 'Save Changes' : 'Add Project'}</Button>
      </div>
    </form>
  );
}

// ─── ProfileManager Page ──────────────────────────────────────────────────────
export function ProfileManager() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['freelancerProfile'],
    queryFn: freelancerService.getProfile,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'education' | 'portfolio'>('overview');
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({ title: '', bio: '', hourlyRate: '', location: '' });

  // Modal states
  const [expModal, setExpModal] = useState<{ open: boolean; item?: Experience }>({ open: false });
  const [eduModal, setEduModal] = useState<{ open: boolean; item?: Education }>({ open: false });
  const [portModal, setPortModal] = useState<{ open: boolean; item?: PortfolioProject }>({ open: false });

  const updateProfileMutation = useMutation({
    mutationFn: freelancerService.upsertProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancerProfile'] });
      setIsEditingBasic(false);
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['freelancerProfile'] });

  const handleBasicEditInit = () => {
    setBasicForm({
      title: profile?.title || '',
      bio: profile?.bio || '',
      hourlyRate: profile?.hourlyRate ? profile.hourlyRate.toString() : '',
      location: profile?.location || '',
    });
    setIsEditingBasic(true);
  };

  const handleBasicSave = () => {
    updateProfileMutation.mutate({
      title: basicForm.title || null,
      bio: basicForm.bio || null,
      hourlyRate: basicForm.hourlyRate ? parseFloat(basicForm.hourlyRate) : null,
      location: basicForm.location || null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'portfolio', label: 'Portfolio', icon: FolderDot },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Profile Manager</h1>
          <p className="text-text-muted mt-1">Manage your freelancer profile and portfolio.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Sidebar */}
          <div className="space-y-4">
            <ProfileProgressCard profile={profile || null} />
            <ResumeCard
              resumeUrl={profile?.resumeUrl || null}
              onUpload={async (f) => {
                await freelancerService.uploadResume(f);
                invalidate();
              }}
            />
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border p-6 rounded-2xl shadow-sm"
            >
              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-text">Basic Information</h3>
                      {!isEditingBasic && (
                        <Button variant="ghost" size="sm" onClick={handleBasicEditInit}>Edit</Button>
                      )}
                    </div>
                    {isEditingBasic ? (
                      <div className="space-y-4">
                        <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Professional Title (e.g. Senior Frontend Developer)" value={basicForm.title} onChange={e => setBasicForm({ ...basicForm, title: e.target.value })} />
                        <textarea className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-none" placeholder="Professional Bio" value={basicForm.bio} onChange={e => setBasicForm({ ...basicForm, bio: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                          <input type="number" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Hourly Rate ($)" value={basicForm.hourlyRate} onChange={e => setBasicForm({ ...basicForm, hourlyRate: e.target.value })} />
                          <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Location (e.g. Remote, NY)" value={basicForm.location} onChange={e => setBasicForm({ ...basicForm, location: e.target.value })} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsEditingBasic(false)}>Cancel</Button>
                          <Button onClick={handleBasicSave} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-text">{profile?.title || <span className="text-text-muted italic">No title — click Edit</span>}</p>
                        <p className="text-text-muted whitespace-pre-wrap">{profile?.bio || <span className="italic">No bio provided</span>}</p>
                        <div className="flex gap-6 mt-3 text-sm text-text-muted">
                          <span>💰 ${profile?.hourlyRate ?? 0}/hr</span>
                          <span>📍 {profile?.location || 'Not specified'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Skills</h3>
                    <SkillChips
                      skills={profile?.skills || []}
                      onAddSkill={async (name) => { await freelancerService.addSkill(name); invalidate(); }}
                      onRemoveSkill={async (id) => { await freelancerService.deleteSkill(id); invalidate(); }}
                    />
                  </div>
                </div>
              )}

              {/* ── Experience Tab ── */}
              {activeTab === 'experience' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text">Work Experience</h3>
                    <Button size="sm" className="gap-2" onClick={() => setExpModal({ open: true })}>
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </div>
                  <ExperienceTimeline
                    experiences={profile?.experiences || []}
                    onEdit={(exp) => setExpModal({ open: true, item: exp })}
                    onDelete={async (id) => { await freelancerService.deleteExperience(id); invalidate(); }}
                  />
                </div>
              )}

              {/* ── Education Tab ── */}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text">Education</h3>
                    <Button size="sm" className="gap-2" onClick={() => setEduModal({ open: true })}>
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </div>
                  <EducationCards
                    educations={profile?.educations || []}
                    onEdit={(edu) => setEduModal({ open: true, item: edu })}
                    onDelete={async (id) => { await freelancerService.deleteEducation(id); invalidate(); }}
                  />
                </div>
              )}

              {/* ── Portfolio Tab ── */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text">Portfolio Projects</h3>
                    <Button size="sm" className="gap-2" onClick={() => setPortModal({ open: true })}>
                      <Plus className="w-4 h-4" /> Add Project
                    </Button>
                  </div>
                  <PortfolioGrid
                    projects={profile?.projects || []}
                    onEdit={(p) => setPortModal({ open: true, item: p })}
                    onDelete={async (id) => { await portfolioService.deleteProject(id); invalidate(); }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={expModal.open}
        onClose={() => setExpModal({ open: false })}
        title={expModal.item ? 'Edit Experience' : 'Add Experience'}
      >
        <ExperienceForm
          initial={expModal.item}
          onCancel={() => setExpModal({ open: false })}
          onSave={async (data) => {
            if (expModal.item) {
              await freelancerService.updateExperience(expModal.item.id, data);
            } else {
              await freelancerService.addExperience(data);
            }
            invalidate();
            setExpModal({ open: false });
          }}
        />
      </Modal>

      <Modal
        isOpen={eduModal.open}
        onClose={() => setEduModal({ open: false })}
        title={eduModal.item ? 'Edit Education' : 'Add Education'}
      >
        <EducationForm
          initial={eduModal.item}
          onCancel={() => setEduModal({ open: false })}
          onSave={async (data) => {
            if (eduModal.item) {
              await freelancerService.updateEducation(eduModal.item.id, data);
            } else {
              await freelancerService.addEducation(data);
            }
            invalidate();
            setEduModal({ open: false });
          }}
        />
      </Modal>

      <Modal
        isOpen={portModal.open}
        onClose={() => setPortModal({ open: false })}
        title={portModal.item ? 'Edit Project' : 'Add Project'}
      >
        <PortfolioForm
          initial={portModal.item}
          onCancel={() => setPortModal({ open: false })}
          onSave={async (data) => {
            if (portModal.item) {
              await portfolioService.updateProject(portModal.item.id, data);
            } else {
              await portfolioService.addProject(data);
            }
            invalidate();
            setPortModal({ open: false });
          }}
        />
      </Modal>
    </div>
  );
}
