import React from 'react';
import { ArtifactInfo, ARTIFACT_TYPE_MAP } from './artifact-types';
import { formatFileSize } from './artifact-utils';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ArtifactCardProps {
  artifact: ArtifactInfo;
  isSelected: boolean;
  isCompact: boolean;
  onClick: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ 
  artifact, 
  isSelected, 
  isCompact, 
  onClick 
}) => {
  const config = ARTIFACT_TYPE_MAP[artifact.type] || ARTIFACT_TYPE_MAP['UNKNOWN'];
  const IconComponent = (Icons as any)[config.icon] || Icons.File;

  if (isCompact) {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "group cursor-pointer p-3 border-b border-gray-100 transition-all hover:bg-gray-50 relative",
          isSelected ? "bg-purple-50/50 border-l-4 border-l-purple-500" : "border-l-4 border-l-transparent"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
            <span className="font-medium text-sm text-gray-700 truncate">{artifact.fileName}</span>
          </div>
          <StatusIcon status={artifact.status} size={14} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
          <span>{config.label}</span>
          {artifact.version && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span>{artifact.version}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group cursor-pointer p-4 border-b border-gray-100 transition-all hover:bg-gray-50 relative",
        isSelected ? "bg-purple-50/50 border-l-4 border-l-purple-500" : "border-l-4 border-l-transparent"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
            <IconComponent size={18} style={{ color: config.color }} />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-gray-800 truncate leading-tight">{artifact.fileName}</h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">{artifact.title}</p>
          </div>
        </div>
        <StatusIcon status={artifact.status} size={18} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Badge label={config.label} color={config.color} />
        {artifact.version && <Badge label={artifact.version} variant="secondary" />}
        <Badge label={formatFileSize(artifact.size)} variant="secondary" />
        {artifact.unitId && <Badge label={artifact.unitId} variant="outline" />}
      </div>
    </div>
  );
};

const StatusIcon = ({ status, size }: { status: string; size: number }) => {
  switch (status) {
    case 'success': return <CheckCircle2 size={size} className="text-green-500 flex-shrink-0" />;
    case 'error': return <XCircle size={size} className="text-red-500 flex-shrink-0" />;
    default: return <Clock size={size} className="text-amber-400 animate-pulse flex-shrink-0" />;
  }
};

const Badge = ({ label, color, variant = 'primary' }: { label: string; color?: string; variant?: 'primary' | 'secondary' | 'outline' }) => {
  if (variant === 'primary') {
    return (
      <span 
        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
        style={{ backgroundColor: color || '#6B7280' }}
      >
        {label}
      </span>
    );
  }
  
  if (variant === 'secondary') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 bg-gray-100 uppercase tracking-wider border border-gray-200">
        {label}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-purple-600 border border-purple-200 uppercase tracking-wider">
      {label}
    </span>
  );
};
