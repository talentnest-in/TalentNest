import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ChatHeaderProps {
  userName: string;
  userAvatar?: string | null;
  contractTitle?: string;
  isOnline?: boolean;
  onBack?: () => void;
}

export function ChatHeader({ userName, userAvatar, contractTitle, isOnline, onBack }: ChatHeaderProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/communications');
    }
  };

  return (
    <div className="bg-surface border-b border-border p-4 flex items-center gap-4">
      <button
        onClick={handleBack}
        className="p-2 hover:bg-background rounded-lg transition-colors text-text-muted"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 relative">
        {userAvatar && !imgError ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-text truncate">{userName}</h2>
          {isOnline && (
            <span className="text-xs text-success font-medium">Online</span>
          )}
        </div>
        {contractTitle && (
          <p className="text-sm text-text-muted truncate">{contractTitle}</p>
        )}
      </div>

      <button className="p-2 hover:bg-background rounded-lg transition-colors text-text-muted">
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}
