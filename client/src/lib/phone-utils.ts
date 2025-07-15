/**
 * Frontend utility functions for phone number formatting
 * Mirrors the server-side phone utils for consistent display
 */

/**
 * Formats phone number for display in UI
 * Converts +393761024080 to +39 376 102 4080
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  // Format +393761024080 as +39 376 102 4080
  if (phone.startsWith('+39') && phone.length === 13) {
    return phone.replace(/(\+39)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // For other international numbers, return as is
  return phone;
}

/**
 * Extracts just the digits from phone number (for display in input fields with +39 prefix)
 * Converts +393761024080 to 376 102 4080
 */
export function extractPhoneDigits(phone: string): string {
  if (!phone) return '';
  
  // Remove +39 prefix and any non-digits
  const cleaned = phone.replace(/^\+39/, '').replace(/[^\d]/g, '');
  
  // Format as XXX XXX XXXX for display
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return cleaned;
} 