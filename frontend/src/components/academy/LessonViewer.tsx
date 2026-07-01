import React from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { Lesson } from '@/services/academy.service';

interface LessonViewerProps {
  lesson: Lesson;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onComplete?: () => void;
  isCompleted: boolean;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onComplete,
  isCompleted,
}) => {
  const renderContent = () => {
    switch (lesson.type) {
      case 'VIDEO':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {lesson.videoUrl ? (
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
                onEnded={() => !isCompleted && onComplete?.()}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p className="text-lg">No video available</p>
              </div>
            )}
          </div>
        );

      case 'ARTICLE':
        return (
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {lesson.content ? (
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
          </div>
        );

      case 'PDF':
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            {lesson.attachments && lesson.attachments.length > 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-600 mb-4">PDF attachment available</p>
                <a
                  href={lesson.attachments[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              </div>
            ) : (
              <p className="text-gray-500">No PDF available</p>
            )}
          </div>
        );

      case 'QUIZ':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">This lesson includes a quiz</p>
              <button
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Start Quiz
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-gray-500">Unknown lesson type</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Lesson Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
        )}
      </div>

      {/* Lesson Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}

        {/* Attachments */}
        {lesson.attachments && lesson.attachments.length > 0 && lesson.type !== 'PDF' && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Resources</h3>
            <div className="space-y-2">
              {lesson.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Resource {index + 1}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onComplete}
            disabled={isCompleted}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isCompleted ? 'Completed' : 'Mark as Complete'}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
