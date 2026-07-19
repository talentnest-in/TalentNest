import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Community } from '@/types';
import { Users, Globe, Lock } from 'lucide-react';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <Link to={`/community/${community.slug}`} className="block">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors">
        <div className="h-24 bg-primary/10 relative">
          {community.banner && !bannerError ? (
            <img src={community.banner} alt={community.name} className="w-full h-full object-cover" onError={() => setBannerError(true)} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20" />
          )}
          <div className="absolute -bottom-6 left-4">
            {community.logo && !logoError ? (
              <img src={community.logo} alt={community.name} className="w-12 h-12 rounded-xl border-2 border-surface object-cover bg-white" onError={() => setLogoError(true)} />
            ) : (
              <div className="w-12 h-12 rounded-xl border-2 border-surface bg-primary flex items-center justify-center text-white font-bold">
                {community.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 pt-8">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-text truncate">{community.name}</h3>
            {community.type === 'PRIVATE' ? (
              <Lock className="w-4 h-4 text-text-muted flex-shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-text-muted flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-text-muted line-clamp-2 mb-4">
            {community.description || 'No description provided.'}
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{community._count?.members || 0} members</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{community._count?.posts || 0} posts</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
