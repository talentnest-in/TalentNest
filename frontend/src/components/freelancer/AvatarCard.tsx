import { useState } from 'react';
import { User, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { freelancerService } from '@/services/freelancer.service';
import { useQueryClient } from '@tanstack/react-query';

export function AvatarCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      await freelancerService.uploadAvatar(file);
      // Invalidate user query to refresh avatar
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-accent/10 text-accent rounded-lg">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-text">Profile Picture</h3>
          <p className="text-sm text-text-muted">Upload your profile photo</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.avatar && !avatarError ? (
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              className="w-full h-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span className="text-2xl font-semibold text-text-muted">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <label className="inline-block">
            <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileChange} disabled={isUploading} />
            <Button variant="outline" size="sm" disabled={isUploading} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  {user?.avatar ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>
          </label>
          <p className="text-xs text-text-muted mt-2">JPG, PNG, WEBP (max. 5MB)</p>
        </div>
      </div>
    </div>
  );
}
