import React from 'react';
import { ArtifactInfo, ArtifactGroup } from './artifact-types';
import { ArtifactCard } from './ArtifactCard';
import { cn } from '@/lib/utils';
import { BookOpen, Search, Image as ImageIcon, X } from 'lucide-react';

interface ArtifactListPanelProps {
  artifacts: ArtifactInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  activeGroup: ArtifactGroup;
  onGroupChange: (group: ArtifactGroup) => void;
  isCompact: boolean;
}

export const ArtifactListPanel: React.FC<ArtifactListPanelProps> = ({
  artifacts,
  selectedId,
  onSelect,
  onClose,
  activeGroup,
  onGroupChange,
  isCompact
}) => {
  const grouped = {
    lesson: artifacts.filter(a => a.group === 'lesson'),
    research: artifacts.filter(a => a.group === 'research'),
    media: artifacts.filter(a => a.group === 'media'),
  };

  const currentList = grouped[activeGroup];

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
            <Search size={18} />
          </div>
          <h2 className={cn("font-bold text-gray-800", isCompact ? "text-sm" : "text-base")}>
            Artifacts
          </h2>
        </div>
        {!isCompact && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={cn(
        "flex bg-gray-50/50 p-1 m-2 rounded-xl border border-gray-100",
        isCompact ? "flex-col gap-1" : "flex-row"
      )}>
        <TabButton 
          active={activeGroup === 'lesson'} 
          onClick={() => onGroupChange('lesson')} 
          icon={<BookOpen size={14} />} 
          label="Lesson" 
          count={grouped.lesson.length}
          isCompact={isCompact}
        />
        <TabButton 
          active={activeGroup === 'research'} 
          onClick={() => onGroupChange('research')} 
          icon={<Search size={14} />} 
          label="Research" 
          count={grouped.research.length}
          isCompact={isCompact}
        />
        <TabButton 
          active={activeGroup === 'media'} 
          onClick={() => onGroupChange('media')} 
          icon={<ImageIcon size={14} />} 
          label="Media" 
          count={grouped.media.length}
          isCompact={isCompact}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {currentList.length > 0 ? (
          currentList.map(art => (
            <ArtifactCard 
              key={art.id}
              artifact={art}
              isSelected={selectedId === art.id}
              isCompact={isCompact}
              onClick={() => onSelect(art.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-4 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 border border-gray-100">
              <Search size={20} className="opacity-20" />
            </div>
            <p className="text-xs font-medium">No artifacts found in this group</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count, isCompact }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all text-xs font-bold uppercase tracking-wider",
      active 
        ? "bg-white text-purple-600 shadow-sm border border-purple-100 ring-1 ring-purple-100/50" 
        : "text-gray-400 hover:text-gray-600 hover:bg-white/50",
      isCompact && "justify-start px-2 py-1.5"
    )}
  >
    {icon}
    {!isCompact && <span>{label}</span>}
    <span className={cn(
      "ml-auto px-1.5 py-0.5 rounded-full text-[10px]",
      active ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"
    )}>
      {count}
    </span>
  </button>
);
