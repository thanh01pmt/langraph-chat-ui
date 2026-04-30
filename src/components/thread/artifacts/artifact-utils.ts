import { ArtifactInfo, ArtifactGroup, ArtifactFormat } from './artifact-types';

/**
 * Extracts artifacts from a list of messages based on tool calls.
 */
export function extractArtifacts(messages: any[]): ArtifactInfo[] {
  const artifacts: ArtifactInfo[] = [];

  for (const msg of messages) {
    // Look for tool calls in AI messages
    if (msg.type === 'ai' && msg.tool_calls && Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls) {
        const artifact = processToolCall(tc, messages);
        if (artifact) {
          artifacts.push(artifact);
        }
      }
    }
  }

  // Deduplicate by filePath (keep the latest version)
  const uniqueArtifacts = new Map<string, ArtifactInfo>();
  for (const art of artifacts) {
    uniqueArtifacts.set(art.filePath || art.id, art);
  }

  return Array.from(uniqueArtifacts.values());
}

function processToolCall(toolCall: any, allMessages: any[]): ArtifactInfo | null {
  const { name, args, id } = toolCall;
  
  // Find matching tool result
  const toolResult = allMessages.find(
    m => m.type === 'tool' && m.tool_call_id === id
  );

  const status = toolResult 
    ? (toolResult.content?.includes('[ERROR]') ? 'error' : 'success')
    : 'pending';

  // Logic for each tool
  switch (name) {
    case 'write_protected_file': {
      const filePath = args.file_path || '';
      const content = args.content || '';
      const frontmatter = parseFrontmatter(content);
      const { group, type } = classifyArtifact(filePath, frontmatter?.type);

      return {
        id,
        toolCallId: id,
        toolName: name,
        fileName: getBasename(filePath),
        filePath,
        content,
        size: new TextEncoder().encode(content).length,
        format: 'md',
        group: group as ArtifactGroup,
        type: type || (frontmatter?.type as string) || 'UNKNOWN',
        title: frontmatter?.title || getBasename(filePath),
        version: frontmatter?.version,
        date: frontmatter?.date,
        prerequisites: frontmatter?.prerequisite,
        unitId: extractUnitId(filePath),
        status,
        statusMessage: toolResult?.content
      };
    }

    case 'cache_reference': {
      const { ref_id, raw_content, title, project } = args;
      const slug = (title || 'ref').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      const filePath = `${project}/_analyst/_references/${ref_id}_${slug}.md`;

      return {
        id: ref_id || id,
        toolCallId: id,
        toolName: name,
        fileName: `${ref_id}_${slug}.md`,
        filePath,
        content: raw_content || '',
        size: new TextEncoder().encode(raw_content || '').length,
        format: 'md',
        group: 'research',
        type: 'CACHED_REF',
        title: title || ref_id,
        status,
        statusMessage: toolResult?.content
      };
    }

    case 'update_reference_registry': {
      const { entry_json, project_path } = args;
      const filePath = `${project_path}/_analyst/REFERENCE_REGISTRY.json`;
      let title = 'Reference Registry';
      try {
        const entry = JSON.parse(entry_json);
        title = `Registry Update: ${entry.title || entry.id || 'Entry'}`;
      } catch {
        // Ignore parse errors, fallback to default title
      }

      return {
        id: `registry-${id}`,
        toolCallId: id,
        toolName: name,
        fileName: 'REFERENCE_REGISTRY.json',
        filePath,
        content: entry_json || '',
        size: new TextEncoder().encode(entry_json || '').length,
        format: 'json',
        group: 'research',
        type: 'REFERENCE_REGISTRY',
        title,
        status,
        statusMessage: toolResult?.content
      };
    }

    case 'assemble_svg': {
      const { output_file } = args;
      return {
        id,
        toolCallId: id,
        toolName: name,
        fileName: getBasename(output_file),
        filePath: output_file,
        content: '', // SVG content usually not in args, but we can track it
        size: 0,
        format: 'svg',
        group: 'media',
        type: 'SVG',
        title: getBasename(output_file),
        status,
        statusMessage: toolResult?.content
      };
    }

    default:
      return null;
  }
}

function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const lines = match[1].split('\n');
  const result: Record<string, any> = {};
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    // Simple array/string parsing
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        result[key] = JSON.parse(value.replace(/'/g, '"'));
      } catch {
        result[key] = value;
      }
    } else if (value.startsWith('"') && value.endsWith('"')) {
      result[key] = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      result[key] = value.slice(1, -1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function classifyArtifact(filePath: string, frontmatterType?: string): { group: ArtifactGroup; type: string } {
  // Research group
  if (filePath.includes('/_analyst/')) {
    if (filePath.endsWith('REFERENCE_REGISTRY.json')) return { group: 'research', type: 'REFERENCE_REGISTRY' };
    if (filePath.includes('PROJECT_BRIEF'))  return { group: 'research', type: 'PROJECT_BRIEF' };
    if (filePath.includes('LEARNER_PROFILE')) return { group: 'research', type: 'LEARNER_PROFILE' };
    if (filePath.includes('REFERENCE_PACK')) return { group: 'research', type: 'REFERENCE_PACK' };
    if (filePath.includes('RESEARCH_NOTES')) return { group: 'research', type: 'RESEARCH_NOTES' };
    if (filePath.includes('_references/'))   return { group: 'research', type: 'CACHED_REF' };
    return { group: 'research', type: 'UNKNOWN' };
  }
  
  // Media group
  if (filePath.includes('/_assets/')) {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filePath)) return { group: 'media', type: filePath.endsWith('.svg') ? 'SVG' : 'IMAGE' };
    if (/\.(mp3|wav|ogg)$/i.test(filePath))               return { group: 'media', type: 'AUDIO' };
    return { group: 'media', type: 'ASSET' };
  }
  
  // Lesson group (default)
  return { group: 'lesson', type: frontmatterType || 'UNKNOWN' };
}

function getBasename(path: string): string {
  return path.split(/[/\\]/).pop() || '';
}

function extractUnitId(path: string): string | undefined {
  const match = path.match(/hp\d+/i);
  return match ? match[0].toUpperCase() : undefined;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
