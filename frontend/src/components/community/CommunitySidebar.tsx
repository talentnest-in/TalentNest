import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { communityService } from '@/services/community.service';
import { Button } from '@/components/ui/Button';
import { safeArray } from '@/lib/safeArray';
import { Users, Plus, Hash } from 'lucide-react';
export function CommunitySidebar() {
  const { data, isLoading } = useQuery({
    queryKey: ['communities', 'all'],
    queryFn: () => communityService.getCommunities({ limit: 5, sort: 'popular' }),
  });

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Popular Communities
        </h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-border rounded w-3/4" />
                  <div className="h-2 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {safeArray(data?.data).map(community => (
              <Link 
                key={community.id} 
                to={`/community/${community.slug}`}
                className="flex items-center gap-3 group"
              >
                {community.logo ? (
                  <img src={community.logo} alt={community.name} className="w-10 h-10 rounded-lg object-cover bg-border/50" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Hash className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text text-sm truncate group-hover:text-primary transition-colors">
                    {community.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {community._count?.members || 0} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-border">
          <Link to="/community/create">
            <Button variant="outline" className="w-full gap-2 text-sm h-9">
              <Plus className="w-4 h-4" />
              Create Community
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-text mb-2">About Community</h3>
        <p className="text-sm text-text-muted mb-4">
          Connect with freelancers and clients, share knowledge, and build your professional network.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-text-muted">
          <span className="hover:underline cursor-pointer">Rules</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Help</span>
        </div>
      </div>
    </div>
  );
}
