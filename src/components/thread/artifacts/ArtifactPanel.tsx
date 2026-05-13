import React, { useDeferredValue, useState, useMemo, useEffect } from "react";
import { ArtifactService } from "@/services/artifact-service";

import "./artifact-panel.css";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { useStreamContext } from "@/providers/Stream";
import { extractArtifacts } from "./artifact-utils";
import { ArtifactListPanel } from "./ArtifactListPanel";
import { ArtifactPreviewPanel } from "./ArtifactPreviewPanel";
import { MobileArtifactTabs, MobileTab } from "./MobileArtifactTabs";
import { ArtifactInfo, ArtifactGroup, PanelState } from "./artifact-types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const ArtifactPanel: React.FC = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const {
    isOpen,
    setIsOpen,
    selectedId,
    setSelectedId,
    activeGroup,
    setActiveGroup,
    artifacts,
    selectedArtifact,
    isContentLoading,
  } = useArtifactPanel();

  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  if (!isOpen && isDesktop) return null;

  // Render for Mobile
  if (!isDesktop) {
    return (
      <>
        {mobileTab === "artifacts" && (
          <div className="fixed inset-0 z-40 bg-white pb-16">
            <ArtifactListPanel
              artifacts={artifacts}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileTab("preview");
              }}
              onClose={() => setIsOpen(false)}
              activeGroup={activeGroup}
              onGroupChange={(g) => setActiveGroup(g)}
              isCompact={false}
            />
          </div>
        )}
        {mobileTab === "preview" && (
          <div className="fixed inset-0 z-40 bg-white pb-16">
            <ArtifactPreviewPanel
              artifact={selectedArtifact || null}
              onClose={() => setMobileTab("artifacts")}
              onFullscreen={() => {}}
              onCollapse={() => {}}
              isFullscreen={false}
              isCollapsed={false}
              isLoading={isContentLoading}
            />
          </div>
        )}
        <MobileArtifactTabs
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          artifactCount={artifacts.length}
          hasSelectedArtifact={!!selectedId}
        />
      </>
    );
  }

  return null;
};

// Hook for sharing artifact state with main Thread component
export function useArtifactPanel() {
  const { messages, values } = useStreamContext();
  const deferredMessages = useDeferredValue(messages);
  const projectPath = (values as any)?.project_path;

  const [isOpen, setIsOpen] = useQueryState(
    "artifacts",
    parseAsBoolean.withDefault(false),
  );
  const [selectedId, setSelectedId] = useQueryState(
    "artifactId",
    parseAsString,
  );
  const [activeGroup, setActiveGroup] = useQueryState(
    "artifactGroup",
    parseAsString.withDefault("lesson"),
  );

  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [systemArtifacts, setSystemArtifacts] = useState<ArtifactInfo[]>([]);

  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Sync with filesystem
  useEffect(() => {
    if (projectPath && isOpen) {
      ArtifactService.listArtifacts(projectPath).then(setSystemArtifacts);
    }
  }, [projectPath, isOpen]);

  const messageArtifacts = useMemo(
    () => extractArtifacts(deferredMessages),
    [deferredMessages],
  );

  // Normalize path helper
  const normalizePath = (p?: string) => {
    if (!p) return "";
    return p.replace(/\\/g, "/").replace(/^\//, "");
  };

  const artifacts = useMemo(() => {
    const merged = [...messageArtifacts];
    const existingNormalizedPaths = new Set(
      merged.map((a) => normalizePath(a.filePath)),
    );

    for (const sa of systemArtifacts) {
      const normPath = normalizePath(sa.filePath);
      if (!existingNormalizedPaths.has(normPath)) {
        merged.push(sa);
        existingNormalizedPaths.add(normPath);
      }
    }

    return merged.map((art) => {
      const normPath = normalizePath(art.filePath);
      return {
        ...art,
        content: art.content || contentCache[normPath] || "",
      };
    });
  }, [messageArtifacts, systemArtifacts, contentCache]);

  const selectedArtifact = useMemo(
    () => artifacts.find((a) => a.id === selectedId),
    [artifacts, selectedId],
  );

  // Lazy load content - optimize to avoid redundant fetches during streaming
  useEffect(() => {
    const filePath = selectedArtifact?.filePath;
    const normPath = normalizePath(filePath);

    if (
      filePath &&
      !selectedArtifact?.content &&
      !contentCache[normPath] &&
      !isContentLoading
    ) {
      setIsContentLoading(true);
      ArtifactService.getArtifactContent(filePath)
        .then((content) => {
          if (content !== null) {
            setContentCache((prev) => ({ ...prev, [normPath]: content }));
          }
        })
        .finally(() => setIsContentLoading(false));
    }
  }, [selectedArtifact?.filePath, selectedArtifact?.content, isContentLoading]);

  const panelState: PanelState = useMemo(() => {
    if (!isOpen) return "S1";
    if (isFullscreen) return "S5";
    if (!selectedId) return "S2";
    if (isListCollapsed) return "S4";
    return "S3";
  }, [isOpen, selectedId, isListCollapsed, isFullscreen]);

  return {
    isOpen,
    setIsOpen,
    selectedId,
    setSelectedId,
    activeGroup: activeGroup as ArtifactGroup,
    setActiveGroup,
    isListCollapsed,
    setIsListCollapsed,
    isFullscreen,
    setIsFullscreen,
    artifacts,
    selectedArtifact,
    isContentLoading,
    panelState,
  };
}
