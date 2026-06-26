import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, X, Plus } from 'lucide-react';
import { clientJobService, type JobInput } from '@/services/job.service';
import type { JobStatus } from '@/types';

const inp = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent';
const label = 'text-sm font-medium text-text-muted mb-1 block';

export function CreateEditJobPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<JobInput>({
    title: '',
    description: '',
    type: 'FIXED',
    budget: null,
    status: 'DRAFT',
    location: '',
    isRemote: true,
    skills: [],
  });

  const [skillInput, setSkillInput] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['clientJob', id],
    queryFn: () => clientJobService.getJob(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        description: job.description,
        type: job.type,
        budget: job.budget,
        status: job.status,
        location: job.location || '',
        isRemote: job.isRemote,
        skills: job.skills.map(s => s.name),
      });
    }
  }, [job]);

  const mutation = useMutation({
    mutationFn: (data: JobInput) =>
      isEdit ? clientJobService.updateJob(id!, data) : clientJobService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientJobs'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
      navigate('/client/jobs');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const addSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
        setForm((prev: JobInput) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skill: string) => {
    setForm((prev: JobInput) => ({ ...prev, skills: prev.skills.filter((s: string) => s !== skill) }));
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-6">
        <button onClick={() => navigate('/client/jobs')} className="flex items-center gap-2 text-text-muted hover:text-text mb-2 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <div>
          <h1 className="text-2xl font-bold text-text">{isEdit ? 'Edit Job' : 'Post a New Job'}</h1>
          <p className="text-text-muted mt-1">{isEdit ? 'Update your job posting details.' : 'Fill out the details to find the perfect freelancer.'}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div><label className={label}>Job Title *</label>
              <input required className={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Need a Senior React Developer" />
            </div>

            <div><label className={label}>Job Description *</label>
              <textarea required className={`${inp} h-40 resize-y`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the project, requirements, and deliverables..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={label}>Job Type</label>
                <select className={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'FIXED' | 'HOURLY' })}>
                  <option value="FIXED">Fixed Price</option>
                  <option value="HOURLY">Hourly Rate</option>
                </select>
              </div>
              <div><label className={label}>Budget ($)</label>
                <input type="number" min="0" className={inp} value={form.budget || ''} onChange={e => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : null })} placeholder={form.type === 'FIXED' ? "e.g. 1000" : "e.g. 50 / hr"} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={label}>Location Type</label>
                <select className={inp} value={form.isRemote ? 'true' : 'false'} onChange={e => setForm({ ...form, isRemote: e.target.value === 'true' })}>
                  <option value="true">Remote</option>
                  <option value="false">On-site</option>
                </select>
              </div>
              {!form.isRemote && (
                <div><label className={label}>Location</label>
                  <input className={inp} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. London, UK" />
                </div>
              )}
            </div>

            <div>
              <label className={label}>Skills Required</label>
              <div className="flex gap-2 mb-3">
                <input
                  className={inp}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="Type a skill and press Enter"
                />
                <Button type="button" variant="outline" onClick={addSkill} className="shrink-0 px-3">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill: string) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:bg-accent/20 rounded-full p-0.5 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <label className={label}>Job Status</label>
              <select className={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as JobStatus })}>
                <option value="DRAFT">Draft (Not visible to freelancers)</option>
                <option value="OPEN">Open (Published & accepting applications)</option>
                <option value="PAUSED">Paused (Temporarily hidden)</option>
                <option value="CLOSED">Closed (Hiring completed)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/client/jobs')}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending || !form.title.trim() || !form.description.trim()}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEdit ? 'Save Changes' : 'Post Job'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
