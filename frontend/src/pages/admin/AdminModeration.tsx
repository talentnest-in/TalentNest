import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trash2, X, Check, Trophy, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

type Tab = 'POSTS' | 'COURSES' | 'CONTESTS';

export function AdminModeration() {
  const [activeTab, setActiveTab] = useState<Tab>('POSTS');
  const queryClient = useQueryClient();

  const { data: reportedPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['admin-reported-posts'],
    queryFn: async () => (await api.get('/admin/reports/posts')).data?.reports || [],
    enabled: activeTab === 'POSTS',
  });

  const { data: pendingCourses, isLoading: loadingCourses } = useQuery({
    queryKey: ['admin-pending-courses'],
    queryFn: async () => (await api.get('/admin/courses/pending')).data?.courses || [],
    enabled: activeTab === 'COURSES',
  });

  const { data: contests, isLoading: loadingContests } = useQuery({
    queryKey: ['admin-contests'],
    queryFn: async () => (await api.get('/admin/contests')).data?.contests || [],
    enabled: activeTab === 'CONTESTS',
  });

  const deletePostMutation = useMutation({
    mutationFn: (reportId: string) => api.delete(`/admin/reports/posts/${reportId}/delete-post`),
    onSuccess: () => { toast.success('Post deleted'); queryClient.invalidateQueries({ queryKey: ['admin-reported-posts'] }); },
  });

  const dismissReportMutation = useMutation({
    mutationFn: (reportId: string) => api.post(`/admin/reports/posts/${reportId}/dismiss`),
    onSuccess: () => { toast.success('Report dismissed'); queryClient.invalidateQueries({ queryKey: ['admin-reported-posts'] }); },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: string }) =>
      api.patch(`/admin/courses/${courseId}/status`, { status }),
    onSuccess: (_, v) => { toast.success(`Course ${v.status.toLowerCase()}`); queryClient.invalidateQueries({ queryKey: ['admin-pending-courses'] }); },
  });

  const deleteContestMutation = useMutation({
    mutationFn: (contestId: string) => api.delete(`/admin/contests/${contestId}`),
    onSuccess: () => { toast.success('Contest deleted'); queryClient.invalidateQueries({ queryKey: ['admin-contests'] }); },
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'POSTS', label: 'Reported Posts', count: reportedPosts?.length },
    { key: 'COURSES', label: 'Pending Courses', count: pendingCourses?.length },
    { key: 'CONTESTS', label: 'Contests', count: contests?.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Moderation Panel</h1>
        <p className="text-text-muted mt-1">Review flagged content, pending courses, and all contests</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === tab.key ? 'text-accent' : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.key ? 'bg-accent text-white' : 'bg-surface text-text-muted'
              }`}>{tab.count}</span>
            )}
            {activeTab === tab.key && (
              <motion.div layoutId="modTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* ── Reported Posts ── */}
      {activeTab === 'POSTS' && (
        <div className="space-y-4">
          {loadingPosts ? <div className="py-12 text-center text-text-muted">Loading...</div>
            : !reportedPosts?.length ? (
              <div className="py-16 text-center bg-surface rounded-2xl border border-border/50">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-text-muted font-medium">No reported posts — all clear!</p>
              </div>
            ) : reportedPosts.map((report: any) => (
              <div key={report.id} className="bg-surface border border-error/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-error" />
                <div className="flex flex-col md:flex-row gap-6 justify-between">
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-error">⚠ {report.reason}</p>
                      <p className="text-xs text-text-muted mt-0.5">Reported by <span className="text-text">{report.reporter?.name}</span> · {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                          {report.post?.author?.name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-text">{report.post?.author?.name}</span>
                      </div>
                      <p className="text-sm text-text whitespace-pre-wrap line-clamp-4">{report.post?.content}</p>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-3 shrink-0">
                    <Button variant="outline" className="flex-1 border-error/30 text-error hover:bg-error/10"
                      onClick={() => deletePostMutation.mutate(report.id)} disabled={deletePostMutation.isPending}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                    </Button>
                    <Button variant="outline" className="flex-1"
                      onClick={() => dismissReportMutation.mutate(report.id)} disabled={dismissReportMutation.isPending}>
                      <X className="w-4 h-4 mr-2" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Pending Courses ── */}
      {activeTab === 'COURSES' && (
        <div className="space-y-4">
          {loadingCourses ? <div className="py-12 text-center text-text-muted">Loading...</div>
            : !pendingCourses?.length ? (
              <div className="py-16 text-center bg-surface rounded-2xl border border-border/50">
                <p className="text-text-muted font-medium">No pending courses to review.</p>
              </div>
            ) : pendingCourses.map((course: any) => (
              <div key={course.id} className="bg-surface border border-border/50 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">{course.category?.name}</span>
                    <span className="text-sm text-text-muted">by {course.creator?.name}</span>
                    <span className="text-sm text-text-muted">· ${course.price}</span>
                  </div>
                  <h3 className="text-base font-bold text-text mb-1">{course.title}</h3>
                  <p className="text-sm text-text-muted line-clamp-2">{course.description}</p>
                </div>
                <div className="flex sm:flex-col gap-3 shrink-0 justify-center min-w-[120px]">
                  <Button className="flex-1 bg-success hover:bg-success/80 text-white"
                    onClick={() => updateCourseMutation.mutate({ courseId: course.id, status: 'PUBLISHED' })}
                    disabled={updateCourseMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-error/30 text-error hover:bg-error/10"
                    onClick={() => updateCourseMutation.mutate({ courseId: course.id, status: 'REJECTED' })}
                    disabled={updateCourseMutation.isPending}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Contests ── */}
      {activeTab === 'CONTESTS' && (
        <div className="space-y-4">
          {loadingContests ? <div className="py-12 text-center text-text-muted">Loading...</div>
            : !contests?.length ? (
              <div className="py-16 text-center bg-surface rounded-2xl border border-border/50">
                <p className="text-text-muted font-medium">No contests on the platform yet.</p>
              </div>
            ) : contests.map((contest: any) => (
              <div key={contest.id} className="bg-surface border border-border/50 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contest.status === 'OPEN' ? 'bg-success/10 text-success' :
                      contest.status === 'CLOSED' ? 'bg-error/10 text-error' :
                      'bg-accent/10 text-accent'
                    }`}>{contest.status}</span>
                    <span className="text-sm text-text-muted">by {contest.client?.name}</span>
                  </div>
                  <h3 className="text-base font-bold text-text mb-2">{contest.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ${contest.prize} prize</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {contest._count?.submissions || 0} submissions</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Deadline {new Date(contest.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-3 shrink-0 justify-center">
                  <Button variant="outline" className="border-error/30 text-error hover:bg-error/10"
                    onClick={() => {
                      if (confirm('Delete this contest? This cannot be undone.')) {
                        deleteContestMutation.mutate(contest.id);
                      }
                    }}
                    disabled={deleteContestMutation.isPending}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
