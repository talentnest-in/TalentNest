import React from 'react';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';
import type { Certificate } from '@/services/academy.service';

interface CertificateViewerProps {
  certificate: Certificate;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Certificate Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Certificate of Completion</h1>
              <p className="text-orange-100">TalentNest Academy</p>
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">This is to certify that</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {certificate.enrollment?.course.creator.name}
            </h2>
            <p className="text-gray-600 mb-4">has successfully completed</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              {certificate.enrollment?.course.title}
            </h3>
          </div>

          {/* Course Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
                <p className="font-mono text-sm text-gray-900">{certificate.certificateId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Verification Code</p>
                <p className="font-mono text-sm text-gray-900">{certificate.verificationCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                <p className="text-sm text-gray-900">{formatDate(certificate.issuedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="text-sm text-gray-900">
                  {certificate.enrollment?.course.duration || 0} hours
                </p>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Verified Certificate</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This certificate can be verified at talentnest.com/verify/{certificate.verificationCode}
          </p>
        </div>
      </div>
    </div>
  );
};
