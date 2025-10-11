/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

export type DateFormatType = 'relative' | 'absolute' | 'both';

/**
 * Format a date string to a relative format (e.g., "2 hours ago")
 */
export function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string to an absolute format (e.g., "Oct 12, 2025 3:30 PM")
 */
export function formatAbsoluteDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string based on the specified format type
 */
export function formatDate(dateStr: string, formatType: DateFormatType = 'relative'): string {
  switch (formatType) {
    case 'relative':
      return formatRelativeDate(dateStr);
    case 'absolute':
      return formatAbsoluteDate(dateStr);
    case 'both':
      return `${formatAbsoluteDate(dateStr)} (${formatRelativeDate(dateStr)})`;
    default:
      return formatRelativeDate(dateStr);
  }
}
