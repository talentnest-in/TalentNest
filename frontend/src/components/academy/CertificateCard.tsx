import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Download } from 'lucide-react';
import type { Certificate } from '@/services/academy.service';

interface CertificateCardProps {
  certificate: Certificate;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {certificate.enrollment?.course?.title || ''}
              </h3>
              <p className="text-sm text-gray-600">
                {certificate.enrollment?.course?.creator?.name || ''}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Certificate ID</span>
            <span className="font-mono text-gray-900">{certificate.certificateId}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Issued</span>
            <span className="text-gray-900">{formatDate(certificate.issuedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/academy/certificate/${certificate.id}`}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors text-center"
          >
            View Certificate
          </Link>
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
