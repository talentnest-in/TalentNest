import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { chatService, type MessageAttachment } from '@/services/chat.service';

interface MessageInputProps {
  onSendMessage: (content?: string, attachments?: MessageAttachment[]) => void;
  onTypingStart?: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, onTypingStart, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim() || undefined, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTypingStart && e.target.value.trim()) {
      onTypingStart();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOCX, ZIP');
      return;
    }

    setUploading(true);
    try {
      const uploadedFile = await chatService.uploadFile(file);
      const tempAttachment: MessageAttachment = {
        id: crypto.randomUUID(),
        messageId: '',
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        createdAt: new Date().toISOString(),
      };
      setAttachments([...attachments, tempAttachment]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <form onSubmit={handleSubmit} className="bg-surface border-t border-border p-4">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((att, index) => (
            <div key={att.id} className="relative group">
              {isImage(att.mimeType) ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-background border border-border flex items-center justify-center">
                  <span className="text-xs text-text-muted truncate px-1">{att.fileName}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
          className="hidden"
          disabled={uploading || disabled}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="p-3 hover:bg-background rounded-xl transition-colors text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>
        
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled}
          className="p-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
