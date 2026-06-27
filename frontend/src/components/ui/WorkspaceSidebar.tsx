import { Home, FileText, MessageSquare, CheckSquare, Folder, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceSidebarProps {
  contractId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WorkspaceSidebar({ contractId, activeTab, onTabChange }: WorkspaceSidebarProps) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'milestones', label: 'Milestones', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border/50 h-screen flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold text-text">Project Workspace</h2>
        <p className="text-xs text-text-muted mt-1">Contract #{contractId.slice(0, 8)}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:bg-background hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 space-y-1">
        <button
          onClick={() => navigate('/contracts')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-background hover:text-text transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Contracts</span>
        </button>
      </div>
    </div>
  );
}
