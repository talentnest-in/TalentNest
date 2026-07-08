import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { contestService, type CreateContestPayload } from '@/services/contest.service';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Upload, Loader2,
  Trophy, Info, Settings, BookOpen, Paperclip, Eye
} from 'lucide-react';
import { cn } from '@/components/ui/Button';

const CATEGORIES = [
  'Web Development', 'Mobile App', 'UI/UX Design', 'Logo Design',
  'Data Science', 'Machine Learning', 'Blockchain', 'Game Development',
  'Video Editing', 'Content Writing', 'Marketing', 'Photography',
];

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

const steps = [
  { id: 1, label: 'Basic Info', icon: Info },
  { id: 2, label: 'Details', icon: Settings },
  { id: 3, label: 'Rules', icon: BookOpen },
  { id: 4, label: 'Assets', icon: Paperclip },
  { id: 5, label: 'Preview', icon: Eye },
];

type FormData = Omit<CreateContestPayload, 'prizeAmount' | 'maxParticipants'> & {
  prizeAmount: string;
  maxParticipants: string;
  saveDraft: boolean;
};

const defaultForm: FormData = {
  title: '',
  description: '',
  category: '',
  skills: [],
  difficulty: 'INTERMEDIATE',
  prizeAmount: '',
  registrationDeadline: '',
  submissionDeadline: '',
  maxParticipants: '',
  visibility: 'PUBLIC',
  rules: [''],
  judgingCriteria: [''],
  featuredImage: null,
  attachments: [],
  saveDraft: false,
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary', className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary resize-none', className)}
      {...props}
    />
  );
}

export function CreateContest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: (payload: CreateContestPayload & { status?: 'DRAFT' | 'PUBLISHED' }) =>
      contestService.create(payload),
    onSuccess: (contest) => {
      if (form.saveDraft) {
        toast.success('Contest saved as draft!');
      } else {
        contestService.publish(contest.id).catch(() => {});
        toast.success('Contest published!');
      }
      navigate('/contests/manage');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create contest'),
  });

  const handleSubmit = (saveDraft: boolean) => {
    if (!form.title || !form.description || !form.category || !form.prizeAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    set('saveDraft', saveDraft);
    createMutation.mutate({
      title: form.title,
      description: form.description,
      category: form.category,
      skills: form.skills,
      difficulty: form.difficulty,
      prizeAmount: parseFloat(form.prizeAmount),
      registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      submissionDeadline: new Date(form.submissionDeadline).toISOString(),
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
      visibility: form.visibility,
      rules: form.rules.filter((r) => r.trim()),
      judgingCriteria: form.judgingCriteria.filter((c) => c.trim()),
      featuredImage: form.featuredImage,
      attachments: form.attachments,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await contestService.uploadImage(file);
      set('featuredImage', url);
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    set('skills', [...form.skills, skillInput.trim()]);
    setSkillInput('');
  };

  const removeSkill = (idx: number) => set('skills', form.skills.filter((_, i) => i !== idx));

  const updateList = (key: 'rules' | 'judgingCriteria', idx: number, val: string) => {
    const arr = [...form[key]];
    arr[idx] = val;
    set(key, arr);
  };

  const addToList = (key: 'rules' | 'judgingCriteria') => set(key, [...form[key], '']);
  const removeFromList = (key: 'rules' | 'judgingCriteria', idx: number) =>
    set(key, form[key].filter((_, i) => i !== idx));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Create Contest</h1>
            <p className="text-sm text-text-muted">Fill in the details to launch your contest</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => isDone && setStep(s.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    isActive ? 'bg-primary text-white' :
                    isDone ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30' :
                    'bg-background text-text-muted'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
                {i < steps.length - 1 && (
                  <ChevronRight className={cn('w-4 h-4 flex-shrink-0', isDone ? 'text-primary' : 'text-border')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-surface border border-border/50 rounded-2xl p-6 space-y-5"
          >
            {step === 1 && (
              <>
                <h2 className="font-bold text-text">Basic Information</h2>
                <div>
                  <FieldLabel label="Contest Title" required />
                  <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g., Design a Logo for TalentNest" />
                </div>
                <div>
                  <FieldLabel label="Description" required />
                  <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Describe the contest goals, deliverables, and expectations..." />
                </div>
                <div>
                  <FieldLabel label="Category" required />
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => set('category', cat)}
                        className={cn(
                          'px-3 py-2 text-xs rounded-xl border font-medium transition-colors',
                          form.category === cat
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-background border-border text-text-muted hover:border-primary/30 hover:text-text'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel label="Required Skills" required />
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Type a skill and press Enter"
                    />
                    <Button type="button" size="sm" onClick={addSkill} className="shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill, i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {skill}
                        <button onClick={() => removeSkill(i)} className="hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-bold text-text">Contest Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Prize Amount (USD)" required />
                    <Input type="number" min="1" value={form.prizeAmount} onChange={(e) => set('prizeAmount', e.target.value)} placeholder="e.g., 500" />
                  </div>
                  <div>
                    <FieldLabel label="Max Participants" />
                    <Input type="number" min="1" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} placeholder="Leave blank for unlimited" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Registration Deadline" required />
                    <Input type="datetime-local" value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="Submission Deadline" required />
                    <Input type="datetime-local" value={form.submissionDeadline} onChange={(e) => set('submissionDeadline', e.target.value)} />
                  </div>
                </div>
                <div>
                  <FieldLabel label="Difficulty" />
                  <div className="grid grid-cols-4 gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set('difficulty', d)}
                        className={cn(
                          'py-2 text-xs rounded-xl border font-medium transition-colors',
                          form.difficulty === d
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-background border-border text-text-muted hover:border-primary/30'
                        )}
                      >
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel label="Visibility" />
                  <div className="grid grid-cols-2 gap-3">
                    {['PUBLIC', 'PRIVATE'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set('visibility', v as 'PUBLIC' | 'PRIVATE')}
                        className={cn(
                          'py-2.5 text-sm rounded-xl border font-medium transition-colors',
                          form.visibility === v
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-background border-border text-text-muted hover:border-primary/30'
                        )}
                      >
                        {v === 'PUBLIC' ? '🌍 Public' : '🔒 Private'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-bold text-text">Rules & Judging</h2>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel label="Contest Rules" required />
                    <button onClick={() => addToList('rules')} className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Add Rule
                    </button>
                  </div>
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold mt-2 shrink-0">{i + 1}</span>
                      <Input value={rule} onChange={(e) => updateList('rules', i, e.target.value)} placeholder={`Rule ${i + 1}`} />
                      {form.rules.length > 1 && (
                        <button onClick={() => removeFromList('rules', i)} className="text-text-muted hover:text-red-400 mt-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel label="Judging Criteria" required />
                    <button onClick={() => addToList('judgingCriteria')} className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Add Criterion
                    </button>
                  </div>
                  {form.judgingCriteria.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input value={c} onChange={(e) => updateList('judgingCriteria', i, e.target.value)} placeholder={`Criterion ${i + 1}`} />
                      {form.judgingCriteria.length > 1 && (
                        <button onClick={() => removeFromList('judgingCriteria', i)} className="text-text-muted hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-bold text-text">Assets & Resources</h2>
                <div>
                  <FieldLabel label="Featured Image" />
                  <div className="relative">
                    {form.featuredImage ? (
                      <div className="relative rounded-xl overflow-hidden h-48">
                        <img src={form.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                        <button
                          onClick={() => set('featuredImage', null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors bg-background">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-text-muted mb-2" />
                            <span className="text-sm text-text-muted">Click to upload featured image</span>
                            <span className="text-xs text-text-muted mt-1">JPG, PNG, WEBP (max 20MB)</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="font-bold text-text">Preview & Publish</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Title', value: form.title },
                    { label: 'Category', value: form.category },
                    { label: 'Difficulty', value: form.difficulty },
                    { label: 'Prize', value: form.prizeAmount ? `$${form.prizeAmount}` : '-' },
                    { label: 'Registration Deadline', value: form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleString() : '-' },
                    { label: 'Submission Deadline', value: form.submissionDeadline ? new Date(form.submissionDeadline).toLocaleString() : '-' },
                    { label: 'Skills', value: form.skills.join(', ') || '-' },
                    { label: 'Rules', value: `${form.rules.filter(r => r.trim()).length} rules` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border/30 text-sm">
                      <span className="text-text-muted">{label}</span>
                      <span className="text-text font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSubmit(true)}
                    disabled={createMutation.isPending}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSubmit(false)}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                    Publish Contest
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex gap-3 mt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <Button className="ml-auto flex items-center gap-2" onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        {step > 1 && step < 5 && (
          <button onClick={() => setStep((s) => s - 1)} className="hidden" />
        )}
      </div>
    </DashboardLayout>
  );
}
