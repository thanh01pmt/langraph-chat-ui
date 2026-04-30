import React, { useMemo, useState } from 'react';
import './artifact-panel.css';
import { useQueryState, parseAsBoolean, parseAsString } from 'nuqs';
import { useStreamContext } from '@/providers/Stream';
import { extractArtifacts } from './artifact-utils';
import { ArtifactListPanel } from './ArtifactListPanel';
import { ArtifactPreviewPanel } from './ArtifactPreviewPanel';
import { MobileArtifactTabs, MobileTab } from './MobileArtifactTabs';
import { ArtifactGroup, PanelState } from './artifact-types';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const ArtifactPanel: React.FC = () => {
  const { messages } = useStreamContext();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // URL States
  const [isOpen, setIsOpen] = useQueryState('artifacts', parseAsBoolean.withDefault(false));
  const [selectedId, setSelectedId] = useQueryState('artifactId', parseAsString);
  const [activeGroup, setActiveGroup] = useQueryState('artifactGroup', parseAsString.withDefault('lesson'));
  
  // Local States
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  // Extraction
  const allArtifacts = useMemo(() => extractArtifacts(messages), [messages]);
  const selectedArtifact = useMemo(() => 
    allArtifacts.find(a => a.id === selectedId), 
    [allArtifacts, selectedId]
  );

  if (!isOpen && isDesktop) return null;

  // Render for Mobile
  if (!isDesktop) {
    return (
      <>
        {mobileTab === 'artifacts' && (
          <div className="fixed inset-0 bg-white z-40 pb-16">
            <ArtifactListPanel 
              artifacts={allArtifacts}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileTab('preview');
              }}
              onClose={() => setIsOpen(false)}
              activeGroup={activeGroup as ArtifactGroup}
              onGroupChange={(g) => setActiveGroup(g)}
              isCompact={false}
            />
          </div>
        )}
        {mobileTab === 'preview' && (
          <div className="fixed inset-0 bg-white z-40 pb-16">
            <ArtifactPreviewPanel 
              artifact={selectedArtifact || null}
              onClose={() => setMobileTab('artifacts')}
              onFullscreen={() => {}}
              onCollapse={() => {}}
              isFullscreen={false}
              isCollapsed={false}
            />
          </div>
        )}
        <MobileArtifactTabs 
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          artifactCount={allArtifacts.length}
          hasSelectedArtifact={!!selectedId}
        />
      </>
    );
  }

  // Render for Desktop (as part of the grid in index.tsx)
  // This component will be called multiple times for different columns
  // But we can also export separate components for clarity.
  // For now, let's export a hook to get the state and data.
  return null;
};

// Hook for sharing artifact state with main Thread component
export function useArtifactPanel() {
  const { messages } = useStreamContext();
  const [isOpen, setIsOpen] = useQueryState('artifacts', parseAsBoolean.withDefault(false));
  const [selectedId, setSelectedId] = useQueryState('artifactId', parseAsString);
  const [activeGroup, setActiveGroup] = useQueryState('artifactGroup', parseAsString.withDefault('lesson'));
  
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const artifacts = useMemo(() => extractArtifacts(messages), [messages]);
  const selectedArtifact = useMemo(() => 
    artifacts.find(a => a.id === selectedId), 
    [artifacts, selectedId]
  );

  const panelState: PanelState = useMemo(() => {
    if (!isOpen) return 'S1';
    if (isFullscreen) return 'S5';
    if (!selectedId) return 'S2';
    if (isListCollapsed) return 'S4';
    return 'S3';
  }, [isOpen, selectedId, isListCollapsed, isFullscreen]);

  return {
    isOpen, setIsOpen,
    selectedId, setSelectedId,
    activeGroup: activeGroup as ArtifactGroup, setActiveGroup,
    isListCollapsed, setIsListCollapsed,
    isFullscreen, setIsFullscreen,
    artifacts,
    selectedArtifact,
    panelState
  };
}
