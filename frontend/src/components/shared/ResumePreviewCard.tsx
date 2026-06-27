import { FileText, ExternalLink, Download } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

interface ResumePreviewCardProps {
  resumeUrl: string | null;
}

export function ResumePreviewCard({ resumeUrl }: ResumePreviewCardProps) {
  if (!resumeUrl) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 text-text-muted">
          <FileText className="w-5 h-5" />
          <span>No resume uploaded</span>
        </div>
      </div>
    );
  }

  const fullUrl = resumeUrl.startsWith('http') ? resumeUrl : `${BACKEND_URL}${resumeUrl}`;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium text-text">Resume</p>
            <p className="text-sm text-text-muted">PDF Document</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-border hover:bg-border/30 transition-colors"
            title="View in new tab"
          >
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
          <a
            href={fullUrl}
            download
            className="p-2 rounded-lg border border-border hover:bg-border/30 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4 text-text-muted" />
          </a>
        </div>
      </div>
    </div>
  );
}
