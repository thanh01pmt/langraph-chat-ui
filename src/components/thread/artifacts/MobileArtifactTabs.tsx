import React from 'react';
import { MessageSquare, Package, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'chat' | 'artifacts' | 'preview';

interface MobileArtifactTabsProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  artifactCount: number;
  hasSelectedArtifact: boolean;
}

export const MobileArtifactTabs: React.FC<MobileArtifactTabsProps> = ({
  activeTab,
  onTabChange,
  artifactCount,
  hasSelectedArtifact
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-4 pb-safe">
      <TabButton 
        active={activeTab === 'chat'} 
        onClick={() => onTabChange('chat')} 
        icon={<MessageSquare size={20} />} 
        label="Chat" 
      />
      
      <TabButton 
        active={activeTab === 'artifacts'} 
        onClick={() => onTabChange('artifacts')} 
        icon={<Package size={20} />} 
        label="Artifacts" 
        count={artifactCount > 0 ? artifactCount : undefined}
      />
      
      {hasSelectedArtifact && (
        <TabButton 
          active={activeTab === 'preview'} 
          onClick={() => onTabChange('preview')} 
          icon={<Eye size={20} />} 
          label="View" 
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
      active ? "text-purple-600" : "text-gray-400"
    )}
  >
    <div className="relative">
      {icon}
      {count !== undefined && (
        <span className="absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[8px] font-bold border-2 border-white">
          {count}
        </span>
      )}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    {active && <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-purple-600 rounded-b-full" />}
  </button>
);
