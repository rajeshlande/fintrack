// Date Utility Functions for FinTrack
// Handles UTC storage and local display consistently

/**
 * Converts UTC timestamp to local timezone for display
 * @param utcString - ISO string or Date object in UTC
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted local date string
 */
export function formatUTCToLocal(
  utcString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const date = typeof utcString === 'string' ? new Date(utcString) : utcString
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

/**
 * Formats a date for consistent display across the app
 * @param date - Date object or ISO string
 * @param format - Format type ('short', 'long', 'time', 'datetime')
 * @returns Formatted date string
 */
export function formatDateTime(
  date: string | Date,
  format: 'short' | 'long' | 'time' | 'datetime' = 'datetime'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric' as const,
      month: 'short' as const,
      day: 'numeric' as const,
    },
    long: {
      weekday: 'long' as const,
      year: 'numeric' as const,
      month: 'long' as const,
      day: 'numeric' as const,
    },
    time: {
      hour: '2-digit' as const,
      minute: '2-digit' as const,
    },
    datetime: {
      year: 'numeric' as const,
      month: 'short' as const,
      day: 'numeric' as const,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
    },
  }
  
  return new Intl.DateTimeFormat(undefined, formats[format]).format(dateObj)
}

/**
 * Gets current UTC timestamp for database storage
 * @returns ISO string in UTC
 */
export function getUTCTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Converts local date to UTC for database storage
 * @param localDate - Local date object
 * @returns ISO string in UTC
 */
export function localToUTC(localDate: Date): string {
  return new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000).toISOString()
}

/**
 * Checks if a date is today (in local timezone)
 * @param date - Date to check
 * @returns Boolean indicating if date is today
 */
export function isToday(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return checkDate.toDateString() === today.toDateString()
}

/**
 * Gets relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return formatDateTime(dateObj, 'short')
}
