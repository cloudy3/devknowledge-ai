export function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function chunkText(input: string, size = 1000, overlap = 150): string[] {
  if (overlap >= size) throw new Error('Chunk overlap must be smaller than chunk size.');
  const text = normalizeText(input);
  if (!text) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const floor = start + Math.floor(size * 0.6);
      const paragraph = text.lastIndexOf('\n\n', end);
      const sentence = text.lastIndexOf('. ', end);
      const whitespace = text.lastIndexOf(' ', end);
      const boundary = [paragraph, sentence >= 0 ? sentence + 1 : -1, whitespace].find((candidate) => candidate >= floor);
      if (boundary !== undefined) end = boundary;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

