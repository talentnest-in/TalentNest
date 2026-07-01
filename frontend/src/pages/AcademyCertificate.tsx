import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { certificateService } from '@/services/academy.service';
import { CertificateViewer } from '@/components/academy';

export const AcademyCertificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: certificate, isLoading, error } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => certificateService.getCertificateById(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any).response?.data?.error || 'Failed to load certificate';
    const isForbidden = (error as any).response?.status === 403;
    const isNotFound = (error as any).response?.status === 404;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {isForbidden ? 'You do not have access to this certificate' : 
             isNotFound ? 'Certificate not found' : errorMessage}
          </p>
          <Link
            to="/academy/my-learning"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Back to My Learning
          </Link>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Certificate not found</p>
          <Link
            to="/academy/my-learning"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Back to My Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/academy/my-learning"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to My Learning</span>
          </Link>
        </div>
      </div>

      {/* Certificate Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CertificateViewer certificate={certificate} />
      </div>
    </div>
  );
};
