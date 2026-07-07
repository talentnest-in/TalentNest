import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { Search, Loader2, X, Users, Building, MessageSquare, Briefcase } from 'lucide-react';
import { cloudinaryAvatar, cloudinaryLogo } from '@/lib/cloudinaryUtils';
import type { SearchResult } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{ data: SearchResult }>({
    queryKey: QUERY_KEYS.search.global(debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery) return { data: { communities: [], posts: [], users: [], jobs: [] } };
      const res = await api.get('/search', { params: { q: debouncedQuery } });
      return res.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  const results = data?.data;
  const hasResults = results && (
    results.communities?.length > 0 || 
    results.posts?.length > 0 || 
    results.users?.length > 0 || 
    results.jobs?.length > 0
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md z-50" ref={wrapperRef}>
      <div 
        className={`relative flex items-center w-full transition-all duration-200 ${
          isOpen ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-lg' : 'bg-surface/50 border-border hover:bg-surface'
        } border rounded-full px-4 py-2.5`}
      >
        <Search className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'text-primary' : 'text-text-muted'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search communities, jobs, users..."
          className="w-full bg-transparent border-none outline-none px-3 text-sm text-text placeholder:text-text-muted/70"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="p-1 hover:bg-background rounded-full text-text-muted hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden max-h-[70vh] flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center text-text-muted px-4">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-text">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try checking for typos or using different keywords</p>
            </div>
          ) : (
            <div className="overflow-y-auto py-2">
              
              {/* Jobs */}
              {results.jobs && results.jobs.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background/50">
                    <Briefcase className="w-3.5 h-3.5" /> Jobs
                  </div>
                  {results.jobs.map(job => (
                    <button
                      key={`job-${job.id}`}
                      onClick={() => handleNavigate(`/jobs/${job.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-background flex items-center gap-3 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{job.title}</p>
                        <p className="text-xs text-text-muted truncate">
                          {job.clientProfile?.company?.name || 'Client'} • {job.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Communities */}
              {results.communities && results.communities.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background/50">
                    <Building className="w-3.5 h-3.5" /> Communities
                  </div>
                  {results.communities.map(community => (
                    <button
                      key={`community-${community.id}`}
                      onClick={() => handleNavigate(`/community/${community.slug}`)}
                      className="w-full text-left px-4 py-3 hover:bg-background flex items-center gap-3 transition-colors"
                    >
                      {community.logo ? (
                        <img src={cloudinaryLogo(community.logo)} alt={community.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                          <span className="font-semibold">{community.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{community.name}</p>
                        <p className="text-xs text-text-muted truncate">{community._count?.members || 0} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Users */}
              {results.users && results.users.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background/50">
                    <Users className="w-3.5 h-3.5" /> People
                  </div>
                  {results.users.map(u => (
                    <button
                      key={`user-${u.id}`}
                      onClick={() => handleNavigate(`/profile`)} // Or public profile link if implemented
                      className="w-full text-left px-4 py-3 hover:bg-background flex items-center gap-3 transition-colors"
                    >
                      <img 
                        src={cloudinaryAvatar(u.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`} 
                        alt={u.name || 'User'} 
                        className="w-10 h-10 rounded-full object-cover border border-border" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{u.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Posts */}
              {results.posts && results.posts.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider bg-background/50">
                    <MessageSquare className="w-3.5 h-3.5" /> Posts
                  </div>
                  {results.posts.map(post => (
                    <button
                      key={`post-${post.id}`}
                      onClick={() => handleNavigate(`/community/post/${post.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-background flex items-start gap-3 transition-colors"
                    >
                      <img 
                        src={cloudinaryAvatar(post.author?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=random`} 
                        alt="Author" 
                        className="w-8 h-8 rounded-full object-cover border border-border mt-0.5" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text line-clamp-2">{post.content}</p>
                        <p className="text-xs text-text-muted mt-1">
                          in {post.community?.name} • by {post.author?.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
