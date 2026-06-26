import { useState } from 'react';
import { FileText, UploadCloud, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResumeCardProps {
  resumeUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>; // Optional, just to clear it if you implement clearing
}

export function ResumeCard({ resumeUrl, onUpload, onDelete }: ResumeCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
    } finally {
      setIsUploading(false);
      // reset input
      e.target.value = '';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-accent/10 text-accent rounded-lg">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-text">Resume</h3>
          <p className="text-sm text-text-muted">Upload your latest resume (PDF)</p>
        </div>
      </div>

      {resumeUrl ? (
        <div className="bg-background border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-text">Resume Uploaded</span>
          </div>
          <div className="flex gap-2">
            <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">View</Button>
            </a>
            {onDelete && (
              <Button variant="ghost" size="sm" className="text-error" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
          <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} disabled={isUploading} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
              <span className="text-sm font-medium text-text">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-text-muted mb-2" />
              <span className="text-sm font-medium text-text">Click to upload or drag and drop</span>
              <span className="text-xs text-text-muted mt-1">PDF (max. 10MB)</span>
            </div>
          )}
        </label>
      )}

      {/* Show replacement option if already uploaded */}
      {resumeUrl && !isUploading && (
        <label className="mt-4 flex items-center justify-center cursor-pointer">
          <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
          <span className="text-sm text-accent hover:underline">Replace Resume</span>
        </label>
      )}
    </div>
  );
}
