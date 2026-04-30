export type ArtifactGroup = 'lesson' | 'research' | 'media';
export type PanelState = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
export type ArtifactFormat = 'md' | 'json' | 'js' | 'py' | 'png' | 'jpg' | 'svg' | 'other';

export interface ArtifactInfo {
  id: string;              // unique ID (toolCallId or generated)
  fileName: string;        // basename
  filePath: string;        // full path
  toolName: string;        // which tool created it
  toolCallId: string;

  // Classification
  group: ArtifactGroup;
  type: string;            // LESSON_GENERAL, QUIZ, SLIDE, REFERENCE_REGISTRY, IMAGE, etc.
  format: ArtifactFormat;

  // Metadata (parsed from frontmatter or tool args)
  title: string;
  version?: string;
  date?: string;
  prerequisites?: string[];
  unitId?: string;
  lessonId?: string;

  // Content
  content: string;
  size: number;            // bytes

  // Status
  status: 'success' | 'error' | 'pending';
  statusMessage?: string;
}

export interface ArtifactTypeConfig {
  label: string;
  color: string;           // hex color for badge
  icon: string;            // Lucide icon name (as string to be mapped)
}

export const ARTIFACT_TYPE_MAP: Record<string, ArtifactTypeConfig> = {
  // Lesson group
  'LESSON_GENERAL': { label: 'LESSON', color: '#8B5CF6', icon: 'BookOpen' },
  'QUIZ':           { label: 'QUIZ',   color: '#F59E0B', icon: 'ClipboardCheck' },
  'SLIDE':          { label: 'SLIDE',  color: '#3B82F6', icon: 'Presentation' },
  'HANDOUT':        { label: 'HANDOUT', color: '#10B981', icon: 'FileText' },
  'ACT_HandsOn':    { label: 'ACT',    color: '#EF4444', icon: 'Hammer' },
  'WKS':            { label: 'WKS',    color: '#EAB308', icon: 'PenTool' },
  'EXT':            { label: 'EXT',    color: '#6B7280', icon: 'Sparkles' },
  'GUIDE':          { label: 'GUIDE',  color: '#14B8A6', icon: 'GraduationCap' },
  'CODE':           { label: 'CODE',   color: '#06B6D4', icon: 'Code' },
  'ASSET':          { label: 'ASSET',  color: '#6366F1', icon: 'Image' },

  // Research group
  'PROJECT_BRIEF':      { label: 'BRIEF',    color: '#92400E', icon: 'Briefcase' },
  'LEARNER_PROFILE':    { label: 'PROFILE',  color: '#EC4899', icon: 'Users' },
  'REFERENCE_PACK':     { label: 'REF PACK', color: '#D97706', icon: 'BookMarked' },
  'REFERENCE_REGISTRY': { label: 'REGISTRY', color: '#B45309', icon: 'Database' },
  'RESEARCH_NOTES':     { label: 'NOTES',    color: '#64748B', icon: 'NotebookPen' },
  'CACHED_REF':         { label: 'CACHED',   color: '#94A3B8', icon: 'Globe' },

  // Media group
  'IMAGE':     { label: 'IMAGE', color: '#6366F1', icon: 'Image' },
  'SVG':       { label: 'SVG',   color: '#6366F1', icon: 'Image' },
  'AUDIO':     { label: 'AUDIO', color: '#7C3AED', icon: 'Music' },
  'SCHEMATIC': { label: 'SCHEMATIC', color: '#06B6D4', icon: 'CircuitBoard' },

  // Fallback
  'UNKNOWN':   { label: 'FILE',  color: '#9CA3AF', icon: 'File' },
};
