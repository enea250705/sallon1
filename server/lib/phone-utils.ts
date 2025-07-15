/**
 * Utility functions for phone number formatting and validation
 * Specifically designed for Italian phone numbers with automatic +39 addition
 */

/**
 * Formats phone number for storage in database
 * Automatically adds +39 for Italian numbers
 */
export function formatPhoneForStorage(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add Italian country code
  if (!formatted.startsWith('+')) {
    // If it's a 10-digit number starting with 3, assume it's Italian mobile
    if (formatted.length === 10 && formatted.startsWith('3')) {
      formatted = '+39' + formatted;
    }
    // If it already has 39 prefix, just add +
    else if (formatted.startsWith('39') && formatted.length === 12) {
      formatted = '+' + formatted;
    }
    // For shorter numbers, assume Italian and add +39
    else if (formatted.length >= 9 && formatted.length <= 10) {
      formatted = '+39' + formatted;
    }
    // For other cases, add + prefix
    else {
      formatted = '+' + formatted;
    }
  }
  
  return formatted;
}

/**
 * Formats phone number for display in UI
 * Returns a nicely formatted version for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const formatted = formatPhoneForStorage(phone);
  
  // Format +393761024080 as +39 376 102 4080
  if (formatted.startsWith('+39') && formatted.length === 13) {
    return formatted.replace(/(\+39)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // For other international numbers, return as is
  return formatted;
}

/**
 * Validates phone number format
 * Accepts Italian mobile numbers and international format
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces for validation
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Italian mobile number patterns
  const italianMobileRegex = /^3\d{9}$/; // 10 digits starting with 3
  const italianWithCountryRegex = /^39\d{10}$/; // 39 + 10 digits
  const internationalRegex = /^\+39\d{10}$/; // +39 + 10 digits
  const generalInternationalRegex = /^\+[1-9]\d{8,14}$/; // General international format
  
  return italianMobileRegex.test(cleanPhone) || 
         italianWithCountryRegex.test(cleanPhone) ||
         internationalRegex.test(cleanPhone) ||
         generalInternationalRegex.test(cleanPhone);
}

/**
 * Extracts just the digits from phone number (for display in frontend input)
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