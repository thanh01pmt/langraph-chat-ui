import React, { memo, useMemo } from "react";
import { ArtifactInfo } from "./artifact-types";
import { ArtifactMetadataCard } from "./ArtifactMetadataCard";
import { MarkdownText } from "../markdown-text";
import { FileSearch } from "lucide-react";

const LIVE_PREVIEW_CHARS = 24000;
const CODE_PREVIEW_CHARS = 50000;

interface ArtifactPreviewPanelProps {
  artifact: ArtifactInfo | null;
  onClose: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
  isFullscreen: boolean;
  isCollapsed: boolean;
  isLoading?: boolean;
  isStreaming?: boolean;
}

function truncateContent(content: string, limit: number): string {
  if (content.length <= limit) return content;
  return `${content.slice(0, limit)}\n\n... (${content.length - limit} more characters)`;
}

const PreviewContent = memo(function PreviewContent({
  artifact,
  isStreaming,
}: {
  artifact: ArtifactInfo;
  isStreaming?: boolean;
}) {
  const previewContent = useMemo(() => {
    const limit =
      artifact.format === "md" ? LIVE_PREVIEW_CHARS : CODE_PREVIEW_CHARS;
    return isStreaming
      ? truncateContent(artifact.content || "", limit)
      : artifact.content || "";
  }, [artifact.content, artifact.format, isStreaming]);

  if (!previewContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-gray-400">
        <FileSearch
          size={48}
          className="opacity-20"
        />
        <p className="text-sm font-medium">No content available</p>
        <p className="max-w-xs text-center text-xs">
          This might be because the file is still being generated or is empty.
        </p>
      </div>
    );
  }

  switch (artifact.format) {
    case "json":
      return (
        <div className="p-6 font-mono text-sm">
          <pre className="overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 whitespace-pre-wrap text-gray-700">
            {previewContent}
          </pre>
        </div>
      );
    case "md": {
      const cleanContent = previewContent
        .replace(/^---\r?\n[\s\S]*?\r?\n---/, "")
        .trim();
      return (
        <div className="prose prose-purple prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto max-w-4xl p-8">
          <MarkdownText>{cleanContent}</MarkdownText>
        </div>
      );
    }
    case "js":
    case "py":
      return (
        <div className="h-full p-6 font-mono text-sm">
          <pre className="h-full overflow-x-auto rounded-xl bg-slate-900 p-6 text-slate-100 shadow-xl">
            <code className={`language-${artifact.format}`}>
              {previewContent}
            </code>
          </pre>
        </div>
      );
    case "png":
    case "jpg":
    case "svg":
      return (
        <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-12">
          <div className="max-w-full rounded-lg border border-gray-200 bg-white p-2 shadow-2xl">
            {artifact.format === "svg" && previewContent ? (
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-gray-300">
                <p className="text-xs">Image Preview ({artifact.fileName})</p>
              </div>
            )}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-12 text-center text-gray-400">
          <p>No preview available for this format ({artifact.format})</p>
        </div>
      );
  }
});

export const ArtifactPreviewPanel: React.FC<ArtifactPreviewPanelProps> = ({
  artifact,
  onClose,
  onFullscreen,
  onCollapse,
  isFullscreen,
  isCollapsed,
  isLoading,
  isStreaming,
}) => {
  if (!artifact) {
    // ... (rest of "No artifact selected" remains same)
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-gray-100 bg-gray-50/30 p-8 text-center text-gray-400">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-100 bg-white text-purple-200 shadow-sm">
          <FileSearch
            size={48}
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-lg font-bold text-gray-700">
          No artifact selected
        </h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
          Select an artifact from the list to preview its content and metadata.
        </p>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-sm font-medium">Loading content...</p>
        </div>
      );
    }

    return (
      <PreviewContent
        artifact={artifact}
        isStreaming={isStreaming}
      />
    );
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <ArtifactMetadataCard
        artifact={artifact}
        onClose={onClose}
        onFullscreen={onFullscreen}
        onCollapse={onCollapse}
        isFullscreen={isFullscreen}
        isCollapsed={isCollapsed}
      />
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-white">
        {renderContent()}
      </div>
    </div>
  );
};
