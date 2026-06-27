import type { Company } from '@/types';
import { Building2, Globe, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '@/lib/constants';

export function CompanyCard({ company }: { company: Company }) {
  const navigate = useNavigate();
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {company.logoUrl ? (
          <img src={`${BACKEND_URL}${company.logoUrl}`} alt={company.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-text text-lg">{company.name}</h3>
          {company.industry && <p className="text-sm text-text-muted">{company.industry}</p>}
        </div>
      </div>
      {company.description && <p className="text-sm text-text-muted line-clamp-3">{company.description}</p>}
      <div className="flex flex-wrap gap-3 text-sm text-text-muted">
        {company.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{company.location}</span>}
        {company.size && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{company.size} employees</span>}
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline">
            <Globe className="w-4 h-4" />Website
          </a>
        )}
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={() => navigate('/company')}>Edit Company</Button>
    </div>
  );
}
