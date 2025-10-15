/**
 * Error handling utilities for parsing and mapping error messages
 * to user-friendly messages with recovery suggestions.
 */

export interface ErrorDetails {
  message: string;
  suggestion?: string;
  canRetry?: boolean;
}

/**
 * Common Git error patterns and their user-friendly messages
 */
const GIT_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => ErrorDetails;
}> = [
  {
    pattern: /fatal: not a git repository/i,
    handler: () => ({
      message: 'This directory is not a Git repository',
      suggestion: 'Please open a folder that contains a Git repository',
      canRetry: false,
    }),
  },
  {
    pattern: /fatal: unable to access .+: (.+)/i,
    handler: (match) => ({
      message: `Cannot access remote repository: ${match[1]}`,
      suggestion: 'Check your network connection and repository URL',
      canRetry: true,
    }),
  },
  {
    pattern: /error: Your local changes to the following files would be overwritten/i,
    handler: () => ({
      message: 'Local changes would be overwritten',
      suggestion: 'Stash or commit your changes before proceeding',
      canRetry: false,
    }),
  },
  {
    pattern: /fatal: Could not read from remote repository/i,
    handler: () => ({
      message: 'Could not read from remote repository',
      suggestion: 'Verify you have the correct access rights and the repository exists',
      canRetry: true,
    }),
  },
  {
    pattern: /error: failed to push some refs/i,
    handler: () => ({
      message: 'Failed to push changes',
      suggestion: 'Pull the latest changes first, then try pushing again',
      canRetry: true,
    }),
  },
  {
    pattern: /fatal: refusing to merge unrelated histories/i,
    handler: () => ({
      message: 'Cannot merge unrelated histories',
      suggestion: 'Use the --allow-unrelated-histories flag if you are sure about merging',
      canRetry: false,
    }),
  },
  {
    pattern: /error: pathspec '(.+)' did not match any file/i,
    handler: (match) => ({
      message: `File not found: ${match[1]}`,
      suggestion: 'The file may have been deleted or moved',
      canRetry: false,
    }),
  },
  {
    pattern: /fatal: destination path '(.+)' already exists/i,
    handler: (match) => ({
      message: `Directory already exists: ${match[1]}`,
      suggestion: 'Choose a different location or remove the existing directory',
      canRetry: false,
    }),
  },
  {
    pattern: /error: cannot lock ref '(.+)'/i,
    handler: (match) => ({
      message: `Cannot lock reference: ${match[1]}`,
      suggestion: 'Another Git process may be running. Wait and try again',
      canRetry: true,
    }),
  },
  {
    pattern: /fatal: Unable to create .+\.lock': File exists/i,
    handler: () => ({
      message: 'Git operation is locked',
      suggestion:
        'Another Git operation may be in progress. Wait and try again, or remove the .git/*.lock file manually',
      canRetry: true,
    }),
  },
];

/**
 * Common file system error patterns
 */
const FILE_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => ErrorDetails;
}> = [
  {
    pattern: /ENOENT: no such file or directory/i,
    handler: () => ({
      message: 'File or directory not found',
      suggestion: 'The file may have been moved or deleted',
      canRetry: false,
    }),
  },
  {
    pattern: /EACCES: permission denied/i,
    handler: () => ({
      message: 'Permission denied',
      suggestion: 'Check file permissions or run with appropriate privileges',
      canRetry: false,
    }),
  },
  {
    pattern: /EEXIST: file already exists/i,
    handler: () => ({
      message: 'File already exists',
      suggestion: 'Choose a different name or remove the existing file',
      canRetry: false,
    }),
  },
  {
    pattern: /ENOSPC: no space left on device/i,
    handler: () => ({
      message: 'No space left on disk',
      suggestion: 'Free up disk space and try again',
      canRetry: true,
    }),
  },
];

/**
 * Network error patterns
 */
const NETWORK_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => ErrorDetails;
}> = [
  {
    pattern: /ENOTFOUND|getaddrinfo failed/i,
    handler: () => ({
      message: 'Network connection failed',
      suggestion: 'Check your internet connection and try again',
      canRetry: true,
    }),
  },
  {
    pattern: /ETIMEDOUT|timeout/i,
    handler: () => ({
      message: 'Request timed out',
      suggestion: 'The server took too long to respond. Please try again',
      canRetry: true,
    }),
  },
  {
    pattern: /ECONNREFUSED|connection refused/i,
    handler: () => ({
      message: 'Connection refused',
      suggestion: 'The service may be unavailable. Please try again later',
      canRetry: true,
    }),
  },
];

/**
 * Parse Git stderr output to extract meaningful error messages
 */
export function parseGitError(stderr: string): ErrorDetails {
  const allPatterns = [...GIT_ERROR_PATTERNS, ...FILE_ERROR_PATTERNS, ...NETWORK_ERROR_PATTERNS];

  for (const { pattern, handler } of allPatterns) {
    const match = stderr.match(pattern);
    if (match) {
      return handler(match);
    }
  }

  // Default fallback for unparsed errors
  return {
    message: 'Git operation failed',
    suggestion: 'Please check the error details and try again',
    canRetry: true,
  };
}

/**
 * Format an error object into a user-friendly message
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Get enhanced error details from an error object
 */
export function getErrorDetails(error: unknown): ErrorDetails {
  const message = formatError(error);

  // Try to parse Git errors
  const gitDetails = parseGitError(message);
  if (gitDetails.message !== 'Git operation failed') {
    return gitDetails;
  }

  // Default error details
  return {
    message,
    suggestion: 'If the problem persists, please contact support',
    canRetry: false,
  };
}

/**
 * Log error to console with additional context
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';

  console.error(`[${timestamp}]${contextStr} Error:`, error);

  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Create a retry-able error handler
 */
export function createRetryHandler(
  operation: () => Promise<void>,
  maxRetries = 3,
  delay = 1000
): () => Promise<void> {
  let attempts = 0;

  return async function retryHandler(): Promise<void> {
    try {
      await operation();
      attempts = 0; // Reset on success
    } catch (error) {
      attempts++;

      if (attempts >= maxRetries) {
        attempts = 0;
        throw error;
      }

      const details = getErrorDetails(error);
      if (!details.canRetry) {
        attempts = 0;
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempts));

      // Retry
      return retryHandler();
    }
  };
}
