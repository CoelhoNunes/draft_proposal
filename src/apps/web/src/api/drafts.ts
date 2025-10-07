interface SaveDraftPayload {
  projectId: string;
  fileName: string;
  title: string;
  status: 'draft' | 'final';
  body: string;
  deliverables: Array<{ id: string; title: string; description?: string }>;
}

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
};

export async function saveDraftToArchive(payload: SaveDraftPayload) {
  const response = await fetch('/api/archive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function listProjectDrafts(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/drafts`);
  return handleResponse(response);
}

export async function getDraftById(id: string) {
  const response = await fetch(`/api/drafts/${id}`);
  return handleResponse(response);
}

export async function openArchivedRun(id: string) {
  const response = await fetch(`/api/archive/${id}`);
  return handleResponse(response);
}
