const getBaseUrls = () => {
  const defaults = [
    (import.meta as any).env?.VITE_API_BASE_URL,
    `${window.location.protocol}//${window.location.hostname}:3001`,
    `${window.location.protocol}//${window.location.hostname}:3000`,
    window.location.origin,
  ];
  return defaults.filter(Boolean) as string[];
};

const request = async (path: string, init?: RequestInit) => {
  const errors: string[] = [];
  for (const base of getBaseUrls()) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
        ...init,
      });
      if (!response.ok) {
        errors.push(`${base}${path} -> ${response.status}`);
        continue;
      }
      if (response.status === 204) {
        return undefined;
      }
      return await response.json();
    } catch (err: any) {
      errors.push(`${base}${path} -> ${err?.message || 'network error'}`);
    }
  }
  if (errors.length) {
    throw new Error(errors.join(' | '));
  }
  return undefined;
};

export const updateDeliverableStatus = async (deliverableId: string, status: string) =>
  request(`/api/deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const updateChecklistItem = async (deliverableId: string, itemId: string, done: boolean) =>
  request(`/api/deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: JSON.stringify({ checklistItem: { id: itemId, done } }),
  });

export const commitLlmChange = async (
  runId: string,
  payload: { sectionId: string | null; insertedText: string; summary: string; anchor?: { startOffset: number; endOffset: number } | null },
) =>
  request(`/api/runs/${runId}/llm/commit-change`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const exportRun = async (runId: string) =>
  request(`/api/runs/${runId}/export`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
