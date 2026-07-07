import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Video, FileText, Link } from 'lucide-react';
import type { Lesson } from '@/services/academy.service';

interface LessonEditorProps {
  lessons: Lesson[];
  onLessonAdd: (data: {
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    attachments?: string[];
    duration?: number;
    type?: string;
    isPreview?: boolean;
  }) => void;
  onLessonUpdate: (lessonId: string, data: Partial<Lesson>) => void;
  onLessonDelete: (lessonId: string) => void;
  onLessonReorder: (lessons: Lesson[]) => void;
  onVideoUpload?: (lessonId: string, file: File) => Promise<void>;
  onPdfUpload?: (lessonId: string, file: File) => Promise<void>;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  lessons,
  onLessonAdd,
  onLessonUpdate,
  onLessonDelete,
  onLessonReorder: _onLessonReorder,
  onVideoUpload,
  onPdfUpload,
}) => {
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'VIDEO' | 'ARTICLE' | 'PDF' | 'EXTERNAL_LINK'>('VIDEO');
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  const handleAddLesson = () => {
    if (newLessonTitle.trim()) {
      onLessonAdd({
        title: newLessonTitle.trim(),
        type: newLessonType,
      });
      setNewLessonTitle('');
    }
  };

  const handleVideoUpload = async (lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onVideoUpload) {
      try {
        await onVideoUpload(lessonId, file);
      } catch (error) {
        console.error('Failed to upload video:', error);
      }
    }
  };

  const handlePdfUpload = async (lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPdfUpload) {
      try {
        await onPdfUpload(lessonId, file);
      } catch (error) {
        console.error('Failed to upload PDF:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Lessons</h3>

      {/* Lessons List */}
      <div className="space-y-2 mb-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <div className="flex-1">
                {editingLesson === lesson.id ? (
                  <input
                    type="text"
                    defaultValue={lesson.title}
                    onBlur={(e) => {
                      onLessonUpdate(lesson.id, { title: e.target.value });
                      setEditingLesson(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onLessonUpdate(lesson.id, { title: e.currentTarget.value });
                        setEditingLesson(null);
                      }
                    }}
                    autoFocus
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <span
                    className="font-medium text-sm text-gray-900 cursor-pointer"
                    onClick={() => setEditingLesson(lesson.id)}
                  >
                    {lesson.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lesson.type === 'VIDEO' && <Video className="w-4 h-4 text-gray-400" />}
                {lesson.type === 'ARTICLE' && <FileText className="w-4 h-4 text-gray-400" />}
                {lesson.type === 'PDF' && <FileText className="w-4 h-4 text-gray-400" />}
                {lesson.type === 'EXTERNAL_LINK' && <Link className="w-4 h-4 text-gray-400" />}
                {lesson.isPreview && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Preview
                  </span>
                )}
              </div>
              <button
                onClick={() => onLessonDelete(lesson.id)}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Lesson Details */}
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={lesson.type}
                    onChange={(e) => onLessonUpdate(lesson.id, { type: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="ARTICLE">Article</option>
                    <option value="PDF">PDF</option>
                    <option value="EXTERNAL_LINK">External Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={lesson.duration || ''}
                    onChange={(e) => onLessonUpdate(lesson.id, { duration: Number(e.target.value) || null })}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {lesson.type === 'VIDEO' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Video URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lesson.videoUrl || ''}
                      onChange={(e) => onLessonUpdate(lesson.id, { videoUrl: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {onVideoUpload && (
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                        <Video className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">Upload</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(lesson.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {lesson.type === 'PDF' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PDF URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lesson.videoUrl || ''}
                      onChange={(e) => onLessonUpdate(lesson.id, { videoUrl: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {onPdfUpload && (
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">Upload PDF</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handlePdfUpload(lesson.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {lesson.type === 'ARTICLE' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={lesson.content || ''}
                    onChange={(e) => onLessonUpdate(lesson.id, { content: e.target.value })}
                    placeholder="Write your article content here..."
                    rows={4}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              )}

              {lesson.type === 'EXTERNAL_LINK' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={lesson.videoUrl || ''}
                    onChange={(e) => onLessonUpdate(lesson.id, { videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              <div className="mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lesson.isPreview || false}
                    onChange={(e) => onLessonUpdate(lesson.id, { isPreview: e.target.checked })}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Free preview lesson</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lesson */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          placeholder="New lesson title..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddLesson();
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <select
          value={newLessonType}
          onChange={(e) => setNewLessonType(e.target.value as any)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="VIDEO">Video</option>
          <option value="ARTICLE">Article</option>
          <option value="PDF">PDF</option>
          <option value="EXTERNAL_LINK">External Link</option>
        </select>
        <button
          onClick={handleAddLesson}
          disabled={!newLessonTitle.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Lesson
        </button>
      </div>
    </div>
  );
};
