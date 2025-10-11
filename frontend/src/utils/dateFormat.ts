/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

export type DateFormatType = 'relative' | 'absolute' | 'both';

/**
 * Format a date string to a relative format with specific formatting:
 * - < 60s: "Xs ago"
 * - < 60m: "X minutes ago"
 * - < 24h: "X hours ago"
 * - yesterday: "yesterday HH:MM"
 * - older: "MM/DD/YY HH:MM"
 */
export function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Less than 60 seconds
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    // Less than 60 minutes
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }

    // Less than 24 hours
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    // Yesterday - show "yesterday HH:MM"
    if (diffDays === 1) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `yesterday ${hours}:${minutes}`;
    }

    // Older than yesterday - show "MM/DD/YY HH:MM"
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
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
