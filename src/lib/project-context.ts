type UnknownRecord = Record<string, unknown>;

export type ProjectRunContext = {
  project_path?: string;
  project_name?: string;
  project_id?: string;
  context_payload?: {
    selected_project?: {
      id?: string;
      name?: string;
      path?: string;
    };
  };
};

type ProjectCandidate = {
  id?: string;
  name?: string;
  path?: string;
  slug?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const PROJECT_STORAGE_KEYS = [
  "activeProject",
  "selectedProject",
  "project",
  "curriculum:activeProject",
  "curriculum:selectedProject",
  "course-studio:activeProject",
  "course-studio:selectedProject",
  "learning-artifact-gen-ui:activeProject",
  "learning-artifact-gen-ui:selectedProject",
  "studio:activeProject",
  "studio:selectedProject",
];

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function readString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function candidateFromRecord(record: UnknownRecord): ProjectCandidate | null {
  const path = readString(record, [
    "path",
    "project_path",
    "projectPath",
    "active_project_path",
    "activeProjectPath",
  ]);
  const id = readString(record, ["id", "slug", "project_id", "projectId"]);
  const name = readString(record, ["name", "project_name", "projectName"]);

  if (path || id || name) return { id, name, path };
  return null;
}

function parseCandidate(raw: string | null): ProjectCandidate | null {
  if (!raw?.trim()) return null;
  const text = raw.trim();

  if (text.startsWith("/") || text.includes("/projects/")) {
    return { path: text };
  }

  try {
    const parsed = JSON.parse(text);
    return findCandidate(parsed);
  } catch {
    return { id: text };
  }
}

function findCandidate(value: unknown, depth = 0): ProjectCandidate | null {
  if (depth > 4) return null;
  const record = asRecord(value);
  if (!record) return null;

  const direct = candidateFromRecord(record);
  if (direct) return direct;

  for (const key of [
    "project",
    "activeProject",
    "selectedProject",
    "currentProject",
    "state",
  ]) {
    const nested = findCandidate(record[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

function getCandidateFromUrl(): ProjectCandidate | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);

  const path =
    params.get("project_path") ||
    params.get("projectPath") ||
    params.get("active_project_path") ||
    params.get("activeProjectPath");
  if (path) return { path };

  const id =
    params.get("project_id") ||
    params.get("projectId") ||
    params.get("project") ||
    params.get("selectedProject");
  return id ? { id } : null;
}

function getCandidateFromStorage(): ProjectCandidate | null {
  if (typeof window === "undefined") return null;
  const stores = [window.localStorage, window.sessionStorage];

  for (const store of stores) {
    for (const key of PROJECT_STORAGE_KEYS) {
      const candidate = parseCandidate(store.getItem(key));
      if (candidate) return candidate;
    }

    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (!key || !/project|curriculum|studio|hub/i.test(key)) continue;
      const candidate = parseCandidate(store.getItem(key));
      if (candidate) return candidate;
    }
  }

  return null;
}

async function resolveProjectFromList(
  candidate: ProjectCandidate,
): Promise<ProjectCandidate | null> {
  if (candidate.path) return candidate;
  const lookup = candidate.id || candidate.name;
  if (!lookup) return null;

  try {
    const response = await fetch(`${API_URL}/projects`);
    if (!response.ok) return null;
    const projects: ProjectCandidate[] = await response.json();
    const normalizedLookup = lookup.toLowerCase();
    const match = projects.find((project) => {
      const basename = project.path?.split(/[\\/]/).filter(Boolean).at(-1);
      return [project.id, project.slug, project.name, project.path, basename]
        .filter(Boolean)
        .some((value) => value?.toLowerCase() === normalizedLookup);
    });
    return match ?? null;
  } catch (error) {
    console.warn("Unable to resolve selected project", error);
    return null;
  }
}

export async function resolveActiveProjectContext(
  values?: UnknownRecord | null,
): Promise<ProjectRunContext> {
  const fromState = values
    ? candidateFromRecord({
        path: values.project_path,
        name: values.project_name,
        id: values.project_id,
      })
    : null;

  const candidate =
    fromState || getCandidateFromUrl() || getCandidateFromStorage();
  const resolved = candidate ? await resolveProjectFromList(candidate) : null;
  const project = resolved || candidate;

  if (!project?.path && !project?.name && !project?.id) return {};

  return {
    ...(project.path ? { project_path: project.path } : {}),
    ...(project.name ? { project_name: project.name } : {}),
    ...(project.id ? { project_id: project.id } : {}),
    context_payload: {
      selected_project: {
        id: project.id,
        name: project.name,
        path: project.path,
      },
    },
  };
}
