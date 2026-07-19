import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { companyService } from '@/services/company.service';
import { Button } from '@/components/ui/Button';
import { Building2, Loader2, ArrowLeft } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

const inp = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent';
const label = 'text-sm font-medium text-text-muted mb-1 block';

export function CompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: companyService.getMyCompany,
  });

  const [form, setForm] = useState({
    name: '',
    industry: '',
    size: '',
    description: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        industry: company.industry || '',
        size: company.size || '',
        description: company.description || '',
        website: company.website || '',
        location: company.location || '',
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: companyService.saveCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
      navigate('/client-dashboard');
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: companyService.uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogoMutation.mutate(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-6">
        <button onClick={() => navigate('/client-dashboard')} className="flex items-center gap-2 text-text-muted hover:text-text mb-2 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Company Profile</h1>
          <p className="text-text-muted mt-1">Manage your company details and branding.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
            {company?.logoUrl ? (
              <img src={company.logoUrl?.startsWith('http') ? company.logoUrl : `${BACKEND_URL}${company.logoUrl}`} alt="Company Logo" className="w-24 h-24 rounded-2xl object-cover border border-border" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-accent" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-text text-lg mb-1">Company Logo</h3>
              <p className="text-sm text-text-muted mb-3 max-w-sm">Upload a professional logo to help freelancers recognize your brand.</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text cursor-pointer hover:bg-border/30 transition-colors">
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadLogoMutation.isPending} />
                {uploadLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Upload New Logo
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className={label}>Company Name *</label>
              <input required className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Corp" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={label}>Industry</label>
                <input className={inp} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Technology" />
              </div>
              <div><label className={label}>Company Size</label>
                <select className={inp} value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>

            <div><label className={label}>Description</label>
              <textarea className={`${inp} h-32 resize-none`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does your company do?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={label}>Website</label>
                <input type="url" className={inp} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              </div>
              <div><label className={label}>Location</label>
                <input className={inp} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. San Francisco, CA" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/client-dashboard')}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending || !form.name.trim()}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
