export function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}
