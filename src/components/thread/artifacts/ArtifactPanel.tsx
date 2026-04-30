import React, { useMemo, useState, useEffect } from 'react';
import { ArtifactService } from '@/services/artifact-service';

import './artifact-panel.css';
import { useQueryState, parseAsBoolean, parseAsString } from 'nuqs';
import { useStreamContext } from '@/providers/Stream';
import { extractArtifacts } from './artifact-utils';
import { ArtifactListPanel } from './ArtifactListPanel';
import { ArtifactPreviewPanel } from './ArtifactPreviewPanel';
import { MobileArtifactTabs, MobileTab } from './MobileArtifactTabs';
import { ArtifactInfo, ArtifactGroup, ArtifactFormat, PanelState } from './artifact-types';
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
  const { messages, values } = useStreamContext();
  const projectPath = (values as any)?.project_path;

  const [isOpen, setIsOpen] = useQueryState('artifacts', parseAsBoolean.withDefault(false));
  const [selectedId, setSelectedId] = useQueryState('artifactId', parseAsString);
  const [activeGroup, setActiveGroup] = useQueryState('artifactGroup', parseAsString.withDefault('lesson'));
  
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [systemArtifacts, setSystemArtifacts] = useState<ArtifactInfo[]>([]);

  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  // Sync with filesystem
  useEffect(() => {
    if (projectPath && isOpen) {
      ArtifactService.listArtifacts(projectPath).then(setSystemArtifacts);
    }
  }, [projectPath, isOpen]);

  const messageArtifacts = useMemo(() => extractArtifacts(messages), [messages]);

  const artifacts = useMemo(() => {
    const merged = [...messageArtifacts];
    const existingPaths = new Set(merged.map(a => a.filePath).filter(Boolean));
    
    for (const sa of systemArtifacts) {
      if (!existingPaths.has(sa.filePath)) {
        merged.push(sa);
        existingPaths.add(sa.filePath);
      }
    }

    // Apply content from cache for artifacts that don't have it
    return merged.map(art => ({
      ...art,
      content: art.content || contentCache[art.filePath || ''] || ''
    }));
  }, [messageArtifacts, systemArtifacts, contentCache]);

  const selectedArtifact = useMemo(() => 
    artifacts.find(a => a.id === selectedId), 
    [artifacts, selectedId]
  );

  // Lazy load content
  useEffect(() => {
    if (selectedArtifact && !selectedArtifact.content && selectedArtifact.filePath) {
      ArtifactService.getArtifactContent(selectedArtifact.filePath).then(content => {
        if (content) {
          setContentCache(prev => ({ ...prev, [selectedArtifact.filePath!]: content }));
        }
      });
    }
  }, [selectedArtifact]);


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
