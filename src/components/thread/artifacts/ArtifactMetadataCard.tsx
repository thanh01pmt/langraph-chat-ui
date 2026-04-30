import React from 'react';
import { ArtifactInfo, ARTIFACT_TYPE_MAP } from './artifact-types';
import { formatFileSize } from './artifact-utils';
import * as Icons from 'lucide-react';
import { Maximize2, Minimize2, ChevronLeft, X } from 'lucide-react';

interface ArtifactMetadataCardProps {
  artifact: ArtifactInfo;
  onClose: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
  isFullscreen: boolean;
  isCollapsed: boolean;
}

export const ArtifactMetadataCard: React.FC<ArtifactMetadataCardProps> = ({
  artifact,
  onClose,
  onFullscreen,
  onCollapse,
  isFullscreen,
  isCollapsed
}) => {
  const config = ARTIFACT_TYPE_MAP[artifact.type] || ARTIFACT_TYPE_MAP['UNKNOWN'];
  const IconComponent = (Icons as any)[config.icon] || Icons.File;

  return (
    <div className="bg-white border-b border-gray-100 p-6 shadow-sm sticky top-0 z-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
            <IconComponent size={24} style={{ color: config.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{artifact.fileName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
               <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{config.label}</span>
               <span className="text-gray-300">|</span>
               <span className="text-sm text-gray-400">{artifact.status === 'success' ? '✅ Ready' : '⏳ Processing'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onCollapse}
            title={isCollapsed ? "Expand List" : "Collapse List"}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} size={20} />
          </button>
          <button 
            onClick={onFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={onClose}
            title="Close Preview"
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <MetaItem label="Title" value={artifact.title} className="col-span-full" />
        <MetaItem label="Version" value={artifact.version || 'v1.0'} />
        <MetaItem label="Date" value={artifact.date || new Date().toISOString().split('T')[0]} />
        <MetaItem label="Size" value={formatFileSize(artifact.size)} />
        <MetaItem label="Unit" value={artifact.unitId || 'N/A'} />
        <MetaItem label="Path" value={artifact.filePath} className="col-span-full font-mono text-[10px]" />
        {artifact.prerequisites && artifact.prerequisites.length > 0 && (
          <MetaItem label="Prerequisites" value={artifact.prerequisites.join(', ')} className="col-span-full" />
        )}
      </div>
    </div>
  );
};

const MetaItem = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-700 break-all">{value}</p>
  </div>
);
