import { Check, CheckCheck, Download, FileText, Image as ImageIcon } from 'lucide-react';
import type { Message, MessageAttachment } from '@/services/chat.service';
import { api } from '@/lib/api';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderReadReceipt = () => {
    if (!isOwn) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-accent ml-2" />;
    }
    
    return <Check className="w-4 h-4 ml-2" />;
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.mimeType.startsWith('image/');
    
    if (isImage) {
      return (
        <div className="mt-2">
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName}
            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.fileUrl, '_blank')}
          />
        </div>
      );
    }
    
    return (
      <button
        onClick={async () => {
          try {
            const response = await api.get('/download', {
              params: {
                url: attachment.fileUrl,
                fileName: attachment.fileName,
              },
              responseType: 'blob',
            });
            
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = attachment.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
          }
        }}
        className="mt-2 flex items-center gap-3 p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {attachment.mimeType === 'application/pdf' ? (
            <FileText className="w-5 h-5 text-primary" />
          ) : (
            <ImageIcon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{attachment.fileName}</p>
          <p className="text-xs text-text-muted">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <Download className="w-4 h-4 text-text-muted shrink-0" />
      </button>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-accent text-white rounded-br-md'
            : 'bg-background border border-border rounded-bl-md'
        }`}
      >
        {message.content && <p className="text-sm break-words">{message.content}</p>}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}
        
        <div
          className={`text-xs mt-1 flex items-center ${isOwn ? 'text-white/70' : 'text-text-muted'}`}
        >
          {formatTime(message.createdAt)}
          {renderReadReceipt()}
        </div>
      </div>
    </div>
  );
}
