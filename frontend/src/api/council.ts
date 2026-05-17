export type CouncilMode = "parallel" | "sequential" | "debate" | "router";

export interface SSEEvent {
  event: string;
  model?: string;
  color?: string;
  content?: string;
  selected?: string[];
}

export async function streamCouncil(
  mode: CouncilMode,
  question: string,
  selectedModel: string,
  onEvent: (e: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`/api/council/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model: selectedModel }),
    signal,
  });

  if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          onEvent(JSON.parse(trimmed.slice(6)));
        } catch {}
      }
    }
  }
}

export async function fetchModels(): Promise<string[]> {
  const res = await fetch("/api/models");
  const data = await res.json();
  return data.models as string[];
}
