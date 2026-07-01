import React from 'react';
import { ChevronDown, ChevronRight, PlayCircle, FileText, Video, CheckCircle, Circle } from 'lucide-react';
import type { CourseSection, LessonProgress } from '@/services/academy.service';

interface LessonSidebarProps {
  sections: CourseSection[];
  currentLessonId: string;
  progressRecords: LessonProgress[];
  onLessonClick: (lessonId: string) => void;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  sections,
  currentLessonId,
  progressRecords,
  onLessonClick,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return Video;
      case 'ARTICLE':
        return FileText;
      case 'PDF':
        return FileText;
      case 'QUIZ':
        return PlayCircle;
      default:
        return FileText;
    }
  };

  const getLessonProgress = (lessonId: string) => {
    return progressRecords.find((p) => p.lessonId === lessonId);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Course Content</h2>
      </div>

      <div className="py-2">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-sm text-gray-900">
                  {section.title}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {section.lessons?.length || 0} lessons
              </span>
            </button>

            {/* Lessons */}
            {expandedSections.has(section.id) && section.lessons && (
              <div className="pl-6 pr-2 pb-2">
                {section.lessons.map((lesson) => {
                  const LessonIcon = getLessonIcon(lesson.type);
                  const progress = getLessonProgress(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onLessonClick(lesson.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isCurrent
                          ? 'bg-orange-50 text-orange-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {progress?.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <LessonIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{lesson.title}</span>
                      {lesson.duration && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {lesson.duration}m
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
