import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import type { CourseSection } from '@/services/academy.service';

interface CourseSectionEditorProps {
  sections: CourseSection[];
  onSectionAdd: (title: string, description?: string) => void;
  onSectionUpdate: (sectionId: string, data: { title?: string; description?: string }) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionReorder: (sections: CourseSection[]) => void;
}

export const CourseSectionEditor: React.FC<CourseSectionEditorProps> = ({
  sections,
  onSectionAdd,
  onSectionUpdate,
  onSectionDelete,
  onSectionReorder: _onSectionReorder,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);

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

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      onSectionAdd(newSectionTitle.trim());
      setNewSectionTitle('');
    }
  };

  const handleUpdateSection = (sectionId: string, field: 'title' | 'description', value: string) => {
    onSectionUpdate(sectionId, { [field]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Course Sections</h3>

      {/* Sections List */}
      <div className="space-y-3 mb-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <button
                onClick={() => toggleSection(section.id)}
                className="flex-shrink-0"
              >
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                {editingSection === section.id ? (
                  <input
                    type="text"
                    defaultValue={section.title}
                    onBlur={(e) => {
                      handleUpdateSection(section.id, 'title', e.target.value);
                      setEditingSection(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateSection(section.id, 'title', e.currentTarget.value);
                        setEditingSection(null);
                      }
                    }}
                    autoFocus
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <span
                    className="font-medium text-sm text-gray-900 cursor-pointer"
                    onClick={() => setEditingSection(section.id)}
                  >
                    {section.title}
                  </span>
                )}
              </div>
              <button
                onClick={() => onSectionDelete(section.id)}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {expandedSections.has(section.id) && (
              <div className="px-4 py-3 bg-white">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={section.description || ''}
                  onBlur={(e) => handleUpdateSection(section.id, 'description', e.target.value)}
                  placeholder="Add a description for this section..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {section.lessons?.length || 0} lessons
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddSection();
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleAddSection}
          disabled={!newSectionTitle.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>
  );
};
