// Retry with exponential backoff for API calls
export async function retryFetch<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === retries - 1) throw err;
      
      const shouldRetry = err instanceof Error && (
        err.message.includes('429') ||
        err.message.includes('rate limit') ||
        err.message.includes('500') ||
        err.message.includes('502') ||
        err.message.includes('503') ||
        err.message.includes('504')
      );
      
      if (!shouldRetry && err instanceof Error && err.message.includes('4')) {
        throw err;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
