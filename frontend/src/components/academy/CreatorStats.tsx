import React from 'react';
import { DollarSign, Users, BookOpen, Star, TrendingUp } from 'lucide-react';
import type { CreatorStats as CreatorStatsType } from '@/services/academy.service';

interface CreatorStatsProps {
  stats: CreatorStatsType;
}

export const CreatorStats: React.FC<CreatorStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Total Students',
      value: (stats.totalEnrollments || 0).toLocaleString(),
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Published Courses',
      value: (stats.publishedCourses || 0).toString(),
      icon: BookOpen,
      color: 'orange',
    },
    {
      label: 'Average Rating',
      value: (stats.averageRating || 0).toFixed(1),
      icon: Star,
      color: 'yellow',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(card.color)} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm text-gray-600">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
};
