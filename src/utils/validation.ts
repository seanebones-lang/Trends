// Input validation utilities
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateApiKeys(xApiKey: string, grokApiKey?: string): ValidationResult {
  if (!xApiKey || !xApiKey.trim()) {
    return { valid: false, error: 'X API key is required' };
  }
  
  // Optional validation for Grok key (if provided, it should not be empty)
  if (grokApiKey !== undefined && (!grokApiKey || !grokApiKey.trim())) {
    return { valid: false, error: 'Grok API key cannot be empty if provided' };
  }
  
  return { valid: true };
}

export function validateQuery(query: string): ValidationResult {
  if (!query || !query.trim()) {
    return { valid: false, error: 'Search query is required' };
  }
  
  if (query.trim().length < 2) {
    return { valid: false, error: 'Search query must be at least 2 characters' };
  }
  
  if (query.trim().length > 500) {
    return { valid: false, error: 'Search query must be less than 500 characters' };
  }
  
  return { valid: true };
}

export function validateFilters(filters: { keyword: string; maxResults?: number }): ValidationResult {
  const queryValidation = validateQuery(filters.keyword || '');
  if (!queryValidation.valid) {
    return queryValidation;
  }
  
  if (filters.maxResults !== undefined) {
    if (filters.maxResults < 1 || filters.maxResults > 500) {
      return { valid: false, error: 'Max results must be between 1 and 500' };
    }
  }
  
  return { valid: true };
}
