import React from 'react';
import { ArtifactInfo } from './artifact-types';
import { ArtifactMetadataCard } from './ArtifactMetadataCard';
import { MarkdownText } from '../markdown-text';
import { FileSearch } from 'lucide-react';

interface ArtifactPreviewPanelProps {
  artifact: ArtifactInfo | null;
  onClose: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
  isFullscreen: boolean;
  isCollapsed: boolean;
  isLoading?: boolean;
}

export const ArtifactPreviewPanel: React.FC<ArtifactPreviewPanelProps> = ({
  artifact,
  onClose,
  onFullscreen,
  onCollapse,
  isFullscreen,
  isCollapsed,
  isLoading
}) => {
  if (!artifact) {
    // ... (rest of "No artifact selected" remains same)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50/30 text-gray-400 p-8 text-center border-l border-gray-100">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 text-purple-200">
          <FileSearch size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-gray-700">No artifact selected</h3>
        <p className="max-w-xs mt-2 text-sm text-gray-500 leading-relaxed">
          Select an artifact from the list to preview its content and metadata.
        </p>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading content...</p>
        </div>
      );
    }

    if (!artifact.content) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8">
          <FileSearch size={48} className="opacity-20" />
          <p className="text-sm font-medium">No content available</p>
          <p className="text-xs text-center max-w-xs">This might be because the file is still being generated or is empty.</p>
        </div>
      );
    }

    switch (artifact.format) {
      case 'json':
        return (
          <div className="p-6 font-mono text-sm">
            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-100 overflow-x-auto whitespace-pre-wrap text-gray-700">
              {artifact.content}
            </pre>
          </div>
        );
      case 'md': {
        // Strip frontmatter from preview if it exists
        const cleanContent = artifact.content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
        return (
          <div className="p-8 max-w-4xl mx-auto prose prose-purple prose-sm sm:prose lg:prose-lg xl:prose-2xl">
            <MarkdownText>{cleanContent}</MarkdownText>
          </div>
        );
      }
      case 'js':
      case 'py':
        return (
          <div className="p-6 font-mono text-sm h-full">
            <pre className="bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto shadow-xl h-full">
              <code className={`language-${artifact.format}`}>{artifact.content}</code>
            </pre>
          </div>
        );
      case 'png':
      case 'jpg':
      case 'svg':
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 h-full">
             <div className="bg-white p-2 rounded-lg shadow-2xl border border-gray-200 max-w-full">
                {artifact.format === 'svg' && artifact.content ? (
                  <div dangerouslySetInnerHTML={{ __html: artifact.content }} />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-300">
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
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <ArtifactMetadataCard 
        artifact={artifact} 
        onClose={onClose} 
        onFullscreen={onFullscreen}
        onCollapse={onCollapse}
        isFullscreen={isFullscreen}
        isCollapsed={isCollapsed}
      />
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};
