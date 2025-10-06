// Real OpenAI-backed call via backend API (uses server-side OPENAI key)
export const callOpenAI = async (prompt: string): Promise<string> => {
  const candidates = [
    (import.meta as any).env?.VITE_API_BASE_URL,
    `${window.location.protocol}//${window.location.hostname}:3001`,
    `${window.location.protocol}//${window.location.hostname}:3000`,
    `${window.location.origin}`,
    `http://localhost:3001`,
    `http://localhost:3000`,
    `http://127.0.0.1:3001`,
    `http://127.0.0.1:3000`,
  ].filter(Boolean) as string[];

  const errors: string[] = [];

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      if (!response.ok) {
        errors.push(`${baseUrl} -> HTTP ${response.status}`);
        continue;
      }
      const json = await response.json();
      const content = json?.data?.content;
      if (typeof content === 'string' && content.trim().length > 0) {
        return content;
      }
      errors.push(`${baseUrl} -> Empty content`);
    } catch (err: any) {
      errors.push(`${baseUrl} -> ${err?.message || 'network error'}`);
      continue;
    }
  }

  // If all candidates failed, throw so callers can handle without inserting fallback text
  throw new Error(`LLM call failed: ${errors.join(' | ')}`);
};

export const analyzePdf = async (file: File): Promise<{ content: string; fileName: string }> => {
  const candidates = [
    (import.meta as any).env?.VITE_API_BASE_URL,
    `${window.location.protocol}//${window.location.hostname}:3001`,
    `${window.location.protocol}//${window.location.hostname}:3000`,
    `${window.location.origin}`,
    `http://localhost:3001`,
    `http://localhost:3000`,
    `http://127.0.0.1:3001`,
    `http://127.0.0.1:3000`,
  ].filter(Boolean) as string[];

  const errors: string[] = [];
  for (const baseUrl of candidates) {
    try {
      const res = await fetch(`${baseUrl}/api/upload/pdf`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      });
      if (!res.ok) { errors.push(`${baseUrl} -> HTTP ${res.status}`); continue; }
      const json = await res.json();
      if (json?.success && json?.data?.content) return json.data as { content: string; fileName: string };
      errors.push(`${baseUrl} -> Invalid response`);
    } catch (e: any) {
      errors.push(`${baseUrl} -> ${e?.message || 'network error'}`);
    }
  }
  throw new Error(`PDF analysis failed: ${errors.join(' | ')}`);
};
