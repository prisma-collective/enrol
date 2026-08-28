/** Split markdown on standalone thematic-break lines (`---`). */
export function splitMarkdownSections(raw: string): string[] {
  return raw
    .split(/^\s*---\s*$/m)
    .map((part) => part.trim())
    .filter(Boolean);
}
