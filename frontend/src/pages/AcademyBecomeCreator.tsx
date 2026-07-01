import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { creatorService } from '@/services/academy.service';

export const AcademyBecomeCreator: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    bio: '',
    website: '',
    expertise: [] as string[],
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
    },
  });
  
  const [expertiseInput, setExpertiseInput] = useState('');

  const { data: existingProfile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: creatorService.getCreatorProfile,
  });

  const createProfileMutation = useMutation({
    mutationFn: creatorService.updateCreatorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      navigate('/academy/creator');
    },
  });

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData({ ...formData, expertise: [...formData.expertise, expertiseInput.trim()] });
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setFormData({ ...formData, expertise: formData.expertise.filter((e) => e !== item) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProfileMutation.mutate(formData);
  };

  if (existingProfile && existingProfile.bio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're already a Creator!</h2>
          <p className="text-gray-600 mb-6">You have an active creator profile.</p>
          <button
            onClick={() => navigate('/academy/creator')}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Go to Creator Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/academy')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Academy</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Course Creator</h1>
          <p className="text-gray-600">Share your expertise and earn by creating courses</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell students about yourself and your expertise..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                required
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                  placeholder="e.g., React, Python, Marketing"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddExpertise}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.expertise.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(item)}
                        className="hover:text-orange-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Social Links
              </label>
              <div>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                  })}
                  placeholder="LinkedIn URL"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                  })}
                  placeholder="Twitter/X URL"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="url"
                  value={formData.socialLinks.github}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, github: e.target.value }
                  })}
                  placeholder="GitHub URL"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/academy')}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProfileMutation.isPending || !formData.bio}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProfileMutation.isPending ? 'Creating Profile...' : 'Become a Creator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
