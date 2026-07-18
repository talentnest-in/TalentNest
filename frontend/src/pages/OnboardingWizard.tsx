import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Briefcase, Building2, Sparkles, MapPin, Building, Briefcase as BriefcaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function OnboardingWizard() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(user?.role ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState<string | null>(user?.role || null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');

  const selectRoleMutation = useMutation({
    mutationFn: authService.selectRole,
    onSuccess: (data) => {
      login(data.token, data.user);
      setSelectedRole(data.user.role);
      setStep(2);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/onboarding/complete', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Re-login to update onboardingCompleted status
      login(localStorage.getItem('token') || '', data.user);
      toast.success('Onboarding complete! You earned 50 EXP.');
      
      if (data.user.role === 'CLIENT') {
        navigate('/client-dashboard', { replace: true });
      } else {
        navigate('/freelancer-dashboard', { replace: true });
      }
    },
  });

  const handleSelectRole = () => {
    if (selectedRole) {
      selectRoleMutation.mutate({ role: selectedRole as 'FREELANCER' | 'CLIENT' });
    }
  };

  const handleComplete = () => {
    const payload: any = {
      bio,
      location,
    };

    if (selectedRole === 'FREELANCER') {
      payload.title = title;
      payload.skills = skills;
    } else {
      payload.companyName = companyName;
      payload.companyIndustry = companyIndustry;
    }

    completeMutation.mutate(payload);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-xl"
      >
        <h2 className="text-center text-3xl font-bold tracking-tight text-text">
          {step === 1 ? 'Welcome to TalentNest 👋' : 'Complete Your Profile 🚀'}
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          {step === 1 ? 'How would you like to use TalentNest?' : 'Let\'s get your profile set up so you can start right away.'}
        </p>

        {/* Progress Bar */}
        <div className="mt-6 flex justify-center gap-2">
          <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-surface'}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-surface'}`} />
          <div className={`h-2 w-16 rounded-full ${step >= 3 ? 'bg-accent' : 'bg-surface'}`} />
        </div>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative">
        <AnimatePresence mode="wait">
          {/* STEP 1: ROLE SELECTION */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole('FREELANCER')}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                    selectedRole === 'FREELANCER' ? 'border-accent bg-accent/5' : 'border-border/50 bg-background hover:border-accent/50'
                  }`}
                >
                  <Briefcase className={`w-8 h-8 mb-3 ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${selectedRole === 'FREELANCER' ? 'text-accent' : 'text-text'}`}>I'm a Freelancer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('CLIENT')}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                    selectedRole === 'CLIENT' ? 'border-accent bg-accent/5' : 'border-border/50 bg-background hover:border-accent/50'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mb-3 ${selectedRole === 'CLIENT' ? 'text-accent' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${selectedRole === 'CLIENT' ? 'text-accent' : 'text-text'}`}>I'm Hiring Talent</span>
                </button>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={selectRoleMutation.isPending || !selectedRole}
                onClick={handleSelectRole}
              >
                {selectRoleMutation.isPending ? 'Saving...' : 'Continue'}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: BASIC INFO */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10 space-y-4"
            >
              {selectedRole === 'FREELANCER' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Professional Title</label>
                  <div className="relative">
                    <BriefcaseIcon className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-text focus:outline-none focus:border-accent"
                      placeholder="e.g. Senior Full Stack Developer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'CLIENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                      <input
                        type="text"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-text focus:outline-none focus:border-accent"
                        placeholder="Your Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Industry</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-accent"
                      placeholder="e.g. Tech, Finance, Healthcare"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-text focus:outline-none focus:border-accent"
                    placeholder="e.g. New York, USA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Short Bio</label>
                <textarea
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-accent"
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)} disabled={!!user?.role}>
                  Back
                </Button>
                <Button className="w-full" onClick={() => setStep(selectedRole === 'FREELANCER' ? 3 : 4)}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SKILLS (FREELANCER ONLY) */}
          {step === 3 && selectedRole === 'FREELANCER' && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1">Add your skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-text focus:outline-none focus:border-accent"
                    placeholder="e.g. React, Node.js, UI Design"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-2">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-accent/50">&times;</button>
                  </span>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Back</Button>
                <Button className="w-full" onClick={() => setStep(4)} disabled={skills.length === 0}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FINISH */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface py-8 px-4 shadow-xl border border-border/50 sm:rounded-3xl sm:px-10 text-center"
            >
              <Sparkles className="w-16 h-16 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-2">You're all set!</h3>
              <p className="text-text-muted mb-6">Your profile is complete. Click below to enter your dashboard and earn your first 50 EXP!</p>
              
              <div className="flex gap-4">
                <Button variant="outline" className="w-full" onClick={() => setStep(selectedRole === 'FREELANCER' ? 3 : 2)}>
                  Back
                </Button>
                <Button className="w-full" onClick={handleComplete} disabled={completeMutation.isPending}>
                  {completeMutation.isPending ? 'Finalizing...' : 'Go to Dashboard'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
