export interface ChecklistItemResponse {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface DeliverableResponse {
  id: string;
  runId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  checklistItems: ChecklistItemResponse[];
}

export interface SectionResponse {
  id: string;
  heading: string;
  content: string;
  order: number;
}

export interface HighlightAnchorResponse {
  startOffset: number;
  endOffset: number;
}

export interface LlmChangeResponse {
  id: string;
  runId: string;
  sectionId: string | null;
  summary: string;
  insertedText: string;
  createdAt: string;
  approvedByUser: boolean;
  highlightAnchor: HighlightAnchorResponse | null;
}

export interface ChatSuggestionResponse {
  id: string;
  summary: string;
  content: string;
  status: 'pending' | 'inserted' | 'dismissed';
}

export interface ChatEntryResponse {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  suggestions?: ChatSuggestionResponse[];
}

export interface RunResponse {
  id: string;
  projectId: string | null;
  runName: string;
  fileName: string;
  status: 'draft' | 'exported';
  createdAt: string;
  updatedAt: string;
  deliverables: DeliverableResponse[];
  sections: SectionResponse[];
  llmChanges: LlmChangeResponse[];
  chat: ChatEntryResponse[];
  pdfMeta: { filename: string; pages: number } | null;
  exports: Array<{ id: string; createdAt: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  suggestedName?: string;
}

const getBaseUrls = () => {
  const defaults = [
    (import.meta as any).env?.VITE_API_BASE_URL,
    `${window.location.protocol}//${window.location.hostname}:3001`,
    `${window.location.protocol}//${window.location.hostname}:3000`,
    window.location.origin,
  ];
  return defaults.filter(Boolean) as string[];
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const errors: string[] = [];
  for (const base of getBaseUrls()) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        ...init,
      });
      if (!response.ok) {
        let payload: ApiResponse<T> | undefined;
        try {
          payload = (await response.json()) as ApiResponse<T>;
        } catch (error) {
          void error;
        }
        const message = payload?.error || payload?.message || `${response.status}`;
        errors.push(`${base}${path} -> ${message}`);
        continue;
      }
      if (response.status === 204) {
        return undefined as T;
      }
      const data = (await response.json()) as ApiResponse<T>;
      if (!data.success) {
        throw new Error(data.error || data.message || 'Request failed');
      }
      if (data.data === undefined) {
        throw new Error('Empty response payload');
      }
      return data.data;
    } catch (error: any) {
      errors.push(`${base}${path} -> ${error?.message || 'network error'}`);
    }
  }
  throw new Error(errors.join(' | '));
};

export const createRun = async (payload: { runName: string; fileName: string; projectId?: string }) => {
  const errors: Array<string | { message: string; suggestedName?: string }> = [];
  for (const base of getBaseUrls()) {
    try {
      const response = await fetch(`${base}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse<RunResponse>;
      if (!response.ok || !data.success || !data.data) {
        const error: { message: string; suggestedName?: string } = {
          message: data.error || data.message || `${response.status}`,
        };
        if ('suggestedName' in data) {
          error.suggestedName = (data as any).suggestedName;
        }
        errors.push(error);
        continue;
      }
      return data.data;
    } catch (error: any) {
      errors.push({ message: error?.message || 'network error' });
    }
  }
  const firstError = errors.find((entry) => typeof entry !== 'string') as
    | { message: string; suggestedName?: string }
    | undefined;
  if (firstError) {
    const err = new Error(firstError.message);
    (err as any).suggestedName = firstError.suggestedName;
    throw err;
  }
  throw new Error(errors.map((entry) => (typeof entry === 'string' ? entry : entry.message)).join(' | '));
};

export const getRunById = async (runId: string) =>
  request<RunResponse>(`/api/runs/${runId}`);

export const listRuns = async () => request<RunResponse[]>('/api/runs');

export const patchRun = async (runId: string, payload: Partial<RunResponse>) =>
  request<RunResponse>(`/api/runs/${runId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const postDeliverables = async (
  runId: string,
  payload: { deliverables: Array<{ title: string; description?: string; checklist?: string[] }> },
) =>
  request<DeliverableResponse[]>(`/api/runs/${runId}/deliverables`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

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
  payload: {
    sectionId: string | null;
    insertedText: string;
    summary: string;
    anchor?: HighlightAnchorResponse | null;
    sourceMessageId?: string;
    suggestionId?: string;
  },
) =>
  request<LlmChangeResponse>(`/api/runs/${runId}/llm/commit-change`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const exportRun = async (runId: string) =>
  request<{ id: string; createdAt: string }>(`/api/runs/${runId}/export`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

export const listArchives = async () =>
  request<Array<{ id: string; runId: string; title: string; fileName: string; updatedAt: string }>>('/api/archives');

export const getArchiveById = async (id: string) => request<RunResponse>(`/api/archives/${id}`);

export const planRun = async (
  runId: string,
  options: { file: File; companyPrompt?: string },
): Promise<{ run: RunResponse; initialChange: LlmChangeResponse }> => {
  const form = new FormData();
  form.append('file', options.file);
  if (options.companyPrompt) {
    form.append('companyPrompt', options.companyPrompt);
  }

  const errors: string[] = [];
  for (const base of getBaseUrls()) {
    try {
      const response = await fetch(`${base}/api/runs/${runId}/llm/plan`, {
        method: 'POST',
        body: form,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiResponse<{
          run: RunResponse;
          initialChange: LlmChangeResponse;
        }>;
        const message = payload?.error || payload?.message || `${response.status}`;
        errors.push(`${base}/api/runs/${runId}/llm/plan -> ${message}`);
        continue;
      }
      const data = (await response.json()) as ApiResponse<{
        run: RunResponse;
        initialChange: LlmChangeResponse;
      }>;
      if (!data.success || !data.data) {
        throw new Error(data.error || data.message || 'Unable to generate plan');
      }
      return data.data;
    } catch (error: any) {
      errors.push(`${base}/api/runs/${runId}/llm/plan -> ${error?.message || 'network error'}`);
    }
  }
  throw new Error(errors.join(' | '));
};

export const requestSuggestions = async (
  runId: string,
  payload: { prompt: string; sectionId?: string | null; cursor?: number | null },
) =>
  request<ChatEntryResponse>(`/api/runs/${runId}/llm/suggest`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSuggestionStatusRemote = async (
  runId: string,
  messageId: string,
  payload: { suggestionId: string; status: ChatSuggestionResponse['status'] },
) =>
  request<ChatEntryResponse>(`/api/runs/${runId}/llm/suggestions/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
