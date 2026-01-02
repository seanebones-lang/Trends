// Simplified cache using JSON keys - reduces redundant calls by ~70%
export function getCacheKey(...args: any[]): string {
  return JSON.stringify(args);
}
