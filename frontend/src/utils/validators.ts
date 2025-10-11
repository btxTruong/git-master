/**
 * Validation utilities for Git operations
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a commit message
 * @param message - The commit message to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateCommitMessage(
  message: string,
  options: {
    minLength?: number;
    maxLength?: number;
    requireSubject?: boolean;
  } = {}
): ValidationResult {
  const { minLength = 1, maxLength = 10000, requireSubject = true } = options;

  // Check if message is empty or only whitespace
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Commit message cannot be empty',
    };
  }

  // Check minimum length
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `Commit message must be at least ${minLength} character${minLength > 1 ? 's' : ''}`,
    };
  }

  // Check maximum length
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Commit message exceeds maximum length of ${maxLength} characters`,
    };
  }

  // Extract subject line (first line)
  const lines = trimmed.split('\n');
  const subject = lines[0].trim();

  if (requireSubject && subject.length === 0) {
    return {
      isValid: false,
      error: 'Commit message must have a subject line',
    };
  }

  // Check subject line length (conventional commits recommend 50 chars, allow up to 72)
  if (subject.length > 72) {
    return {
      isValid: false,
      error: 'Subject line should not exceed 72 characters',
    };
  }

  return { isValid: true };
}

/**
 * Validates a branch name
 * @param name - The branch name to validate
 * @returns Validation result with error message if invalid
 */
export function validateBranchName(name: string): ValidationResult {
  const trimmed = name.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Branch name cannot be empty',
    };
  }

  // Git branch name restrictions
  const invalidPatterns = [
    { pattern: /^\./, message: 'Branch name cannot start with a dot' },
    { pattern: /\.\.|\/\/|@\{|\\/, message: 'Branch name contains invalid characters' },
    { pattern: /\s/, message: 'Branch name cannot contain spaces' },
    { pattern: /[~^:?*[]/, message: 'Branch name contains forbidden characters (~^:?*[)' },
    { pattern: /\.$/, message: 'Branch name cannot end with a dot' },
    { pattern: /\/$/, message: 'Branch name cannot end with a slash' },
    { pattern: /\.lock$/, message: 'Branch name cannot end with .lock' },
  ];

  for (const { pattern, message } of invalidPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: message,
      };
    }
  }

  // Check length (Git supports up to 255, but keep it reasonable)
  if (trimmed.length > 255) {
    return {
      isValid: false,
      error: 'Branch name is too long (max 255 characters)',
    };
  }

  return { isValid: true };
}

/**
 * Validates a remote URL
 * @param url - The remote URL to validate
 * @returns Validation result with error message if invalid
 */
export function validateRemoteUrl(url: string): ValidationResult {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Remote URL cannot be empty',
    };
  }

  // Check for common URL patterns (https, http, git, ssh)
  const urlPatterns = [
    /^https?:\/\/.+/, // HTTP(S)
    /^git@.+:.+/, // SSH (git@host:path)
    /^ssh:\/\/.+/, // SSH URL
    /^git:\/\/.+/, // Git protocol
    /^file:\/\/.+/, // Local file
    /^\.?\.?\/.+/, // Relative or absolute path
  ];

  const isValidUrl = urlPatterns.some((pattern) => pattern.test(trimmed));

  if (!isValidUrl) {
    return {
      isValid: false,
      error: 'Invalid remote URL format',
    };
  }

  return { isValid: true };
}
