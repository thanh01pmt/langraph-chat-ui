import { ArtifactInfo, ArtifactGroup, ArtifactFormat } from '../components/thread/artifacts/artifact-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ProjectArtifact {
  path: string;
  rel_path: string;
  name: string;
  size: number;
  mtime: number;
  type: string;
}

export const ArtifactService = {
  /**
   * Fetches all artifacts for a given project path
   */
  async listArtifacts(projectPath: string): Promise<ArtifactInfo[]> {
    try {
      const response = await fetch(`${API_URL}/projects/artifacts?path=${encodeURIComponent(projectPath)}`);
      if (!response.ok) throw new Error('Failed to fetch artifacts');
      
      const rawArtifacts: ProjectArtifact[] = await response.json();
      
      return rawArtifacts.map(raw => {
        let group: ArtifactGroup = 'lesson';
        if (raw.path.includes('_analyst') || raw.path.includes('_references')) {
          group = 'research';
        } else if (raw.path.includes('_assets')) {
          group = 'media';
        }

        let format: ArtifactFormat = 'other';
        if (raw.name.endsWith('.md')) format = 'md';
        else if (raw.name.endsWith('.json')) format = 'json';
        else if (raw.name.endsWith('.svg')) format = 'svg';

        return {
          id: `fs-${raw.path}`,
          toolCallId: `fs-${raw.path}`,
          toolName: 'system_scan',
          fileName: raw.name,
          filePath: raw.path,
          content: '', // Lazy loaded
          size: raw.size,
          format,
          group,
          type: raw.type,
          title: raw.name,
          status: 'success',
          statusMessage: 'System-led artifact'
        };
      });
    } catch (error) {
      console.error('Error listing project artifacts:', error);
      return [];
    }
  },

  /**
   * Fetches content for a specific artifact
   */
  async getArtifactContent(path: string): Promise<string | null> {
    try {
      const url = `${API_URL}/projects/artifacts/content?path=${encodeURIComponent(path)}`;
      console.log('Fetching artifact content:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Artifact fetch failed:', response.status, response.statusText);
        return null;
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching artifact content:', error);
      return null;
    }
  },
};
