import React from 'react';
import { DollarSign, Users, BookOpen, TrendingUp, Award } from 'lucide-react';
import type { CourseAnalytics } from '@/services/academy.service';

interface AnalyticsCardsProps {
  analytics: CourseAnalytics;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ analytics }) => {
  const cards = [
    {
      label: 'Total Enrollments',
      value: (analytics.totalEnrollments || 0).toLocaleString(),
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Total Views',
      value: (analytics.totalViews || 0).toLocaleString(),
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Total Revenue',
      value: `$${(analytics.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'orange',
    },
    {
      label: 'Completion Rate',
      value: `${(analytics.completionRate || 0).toFixed(1)}%`,
      icon: Award,
      color: 'purple',
    },
    {
      label: 'Average Rating',
      value: (analytics.averageRating || 0).toFixed(1),
      icon: BookOpen,
      color: 'yellow',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(card.color)} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-600">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
