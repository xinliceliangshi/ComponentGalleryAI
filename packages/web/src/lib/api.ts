import type { GenerateResponse } from "@/types/generate";

export async function postGenerate(input: string, signal?: AbortSignal): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
    signal
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  return (await res.json()) as GenerateResponse;
}

