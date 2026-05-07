export function safeJsonParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON");
      return JSON.parse(match[0]);
    }
  }