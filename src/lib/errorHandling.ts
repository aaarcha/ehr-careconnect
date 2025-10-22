/**
 * Sanitizes error messages to prevent information disclosure
 * In development: shows full error details
 * In production: maps to safe, user-friendly messages
 */
export const sanitizeError = (error: any): string => {
  // Development mode: show full errors for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error details:', error);
    return error.message || 'An error occurred';
  }
  
  // Production mode: map to safe messages
  const errorMap: Record<string, string> = {
    // Database errors (PostgreSQL error codes)
    '23505': 'This record already exists',
    '23503': 'Related record not found',
    '23502': 'Required information is missing',
    '22P02': 'Invalid data format provided',
    '22001': 'Input value is too long',
    
    // RLS errors
    '42501': 'Access denied',
    'PGRST301': 'Access denied',
    
    // Auth errors
    'invalid_grant': 'Invalid credentials',
    'Invalid login credentials': 'Invalid account number or password',
    'Email not confirmed': 'Please verify your account',
    'User already registered': 'This account already exists',
    
    // PostgREST errors
    'PGRST116': 'Record not found',
    'PGRST204': 'No content available'
  };
  
  // Check error code first
  if (error.code && errorMap[error.code]) {
    return errorMap[error.code];
  }
  
  // Check message patterns
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('policy') || msg.includes('security') || msg.includes('permission')) {
    return 'You do not have permission to perform this action';
  }
  
  if (msg.includes('constraint') || msg.includes('violates')) {
    return 'Unable to complete operation - data conflict';
  }
  
  if (msg.includes('not found') || msg.includes('does not exist')) {
    return 'The requested information is not available';
  }
  
  if (msg.includes('duplicate') || msg.includes('already exists')) {
    return 'A record with this information already exists';
  }
  
  if (msg.includes('invalid') || msg.includes('malformed')) {
    return 'Invalid data format provided';
  }
  
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'Operation timed out. Please try again';
  }
  
  if (msg.includes('network') || msg.includes('connection')) {
    return 'Network error. Please check your connection';
  }
  
  // Log unknown errors for investigation (without exposing to user)
  console.error('Unmapped error:', {
    code: error.code,
    message: error.message,
    name: error.name
  });
  
  return 'An unexpected error occurred. Please try again or contact support.';
};
