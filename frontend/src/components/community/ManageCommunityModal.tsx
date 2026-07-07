import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community.service';
import { api } from '@/lib/api';
import type { Community } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Plus, Trash2, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

const manageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  rules: z.array(z.object({ value: z.string().min(1, 'Rule cannot be empty') })),
});

type ManageFormValues = z.infer<typeof manageSchema>;

interface ManageCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
}

export function ManageCommunityModal({ isOpen, onClose, community }: ManageCommunityModalProps) {
  const queryClient = useQueryClient();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(community.banner);
  const [logoPreview, setLogoPreview] = useState<string | null>(community.logo);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm<ManageFormValues>({
    resolver: zodResolver(manageSchema),
    defaultValues: {
      name: community.name,
      description: community.description || '',
      type: community.type,
      rules: (community.rules || []).map(r => ({ value: r })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const updateMutation = useMutation({
    mutationFn: (data: ManageFormValues) => 
      communityService.updateCommunity(community.id, {
        name: data.name,
        description: data.description,
        type: data.type,
        rules: data.rules.map(r => r.value),
      }),
    onSuccess: () => {
      toast.success('Community updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['community', community.slug] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update community');
    }
  });

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPreview(URL.createObjectURL(file));
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/community/${community.id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Banner updated!');
      queryClient.invalidateQueries({ queryKey: ['community', community.slug] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload banner');
      setBannerPreview(community.banner);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/community/${community.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Logo updated!');
      queryClient.invalidateQueries({ queryKey: ['community', community.slug] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
      setLogoPreview(community.logo);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Manage Community</h2>
          <button onClick={onClose} className="p-2 hover:bg-border/50 rounded-lg text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="manage-form" onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            
            {/* Images */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text">Community Images</label>
              
              {/* Banner */}
              <div 
                className="relative h-32 rounded-xl border-2 border-dashed border-border bg-background flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Change Banner
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-text-muted">
                    <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-sm font-medium">Upload Banner Image</span>
                    <p className="text-xs opacity-70 mt-1">Recommended: 1200x400 (Max 10MB)</p>
                  </div>
                )}
                {isUploadingBanner && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={bannerInputRef} 
                  onChange={handleBannerChange} 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                />
              </div>

              {/* Logo */}
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-text-muted flex flex-col items-center justify-center">
                      <Plus className="w-6 h-6 opacity-50" />
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    onChange={handleLogoChange} 
                    accept="image/jpeg,image/png,image/webp" 
                    className="hidden" 
                  />
                </div>
                <div className="text-sm text-text-muted">
                  <p className="font-medium text-text">Community Logo</p>
                  <p className="text-xs">Recommended: 256x256 square (Max 5MB)</p>
                </div>
              </div>
            </div>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Community Name</label>
              <Input {...register('name')} placeholder="e.g. TalentNest Developers" />
              {errors.name && <p className="text-sm text-danger mt-1">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Description</label>
              <textarea
                {...register('description')}
                placeholder="What is this community about?"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors min-h-[100px] resize-y"
              />
            </div>

            {/* Privacy Type */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Privacy</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors bg-background">
                  <input type="radio" value="PUBLIC" {...register('type')} className="mt-1" />
                  <div>
                    <span className="block font-medium text-text">Public</span>
                    <span className="text-xs text-text-muted">Anyone can view and join</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors bg-background">
                  <input type="radio" value="PRIVATE" {...register('type')} className="mt-1" />
                  <div>
                    <span className="block font-medium text-text">Private</span>
                    <span className="text-xs text-text-muted">Only members can view posts</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text">Community Rules</label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })} className="h-8 text-xs py-0">
                  <Plus className="w-3 h-3 mr-1" /> Add Rule
                </Button>
              </div>
              <div className="space-y-3">
                {fields.length === 0 && <p className="text-sm text-text-muted">No rules added yet.</p>}
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`rules.${index}.value`)} placeholder={`Rule #${index + 1}`} className="flex-1" />
                    <button type="button" onClick={() => remove(index)} className="p-3 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              {errors.rules && <p className="text-sm text-danger mt-1">Please ensure all rules have text</p>}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-surface">
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="manage-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

      </div>
    </div>
  );
}
