export function safeArray<T>(data: T[] | undefined | null): T[] {
  if (!data) return [];
  if (!Array.isArray(data)) return [];
  return data;
}
