// Currency mapping for different countries/regions
export const CURRENCY_MAP: Record<string, { symbol: string; code: string; name: string }> = {
  // North America
  'united states': { symbol: '$', code: 'USD', name: 'US Dollar' },
  'usa': { symbol: '$', code: 'USD', name: 'US Dollar' },
  'us': { symbol: '$', code: 'USD', name: 'US Dollar' },
  'canada': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  'mexico': { symbol: '$', code: 'MXN', name: 'Mexican Peso' },
  
  // Europe
  'united kingdom': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'uk': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'britain': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'england': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'scotland': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'wales': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'ireland': { symbol: '€', code: 'EUR', name: 'Euro' },
  'germany': { symbol: '€', code: 'EUR', name: 'Euro' },
  'france': { symbol: '€', code: 'EUR', name: 'Euro' },
  'spain': { symbol: '€', code: 'EUR', name: 'Euro' },
  'italy': { symbol: '€', code: 'EUR', name: 'Euro' },
  'netherlands': { symbol: '€', code: 'EUR', name: 'Euro' },
  'belgium': { symbol: '€', code: 'EUR', name: 'Euro' },
  'austria': { symbol: '€', code: 'EUR', name: 'Euro' },
  'portugal': { symbol: '€', code: 'EUR', name: 'Euro' },
  'greece': { symbol: '€', code: 'EUR', name: 'Euro' },
  'finland': { symbol: '€', code: 'EUR', name: 'Euro' },
  'sweden': { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
  'norway': { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
  'denmark': { symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
  'switzerland': { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
  'poland': { symbol: 'zł', code: 'PLN', name: 'Polish Złoty' },
  
  // Asia Pacific
  'australia': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  'new zealand': { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
  'japan': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  'south korea': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  'korea': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  'china': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  'india': { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  'singapore': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  'hong kong': { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
  'thailand': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
  'malaysia': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
  'philippines': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
  'indonesia': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
  
  // Middle East & Africa
  'israel': { symbol: '₪', code: 'ILS', name: 'Israeli Shekel' },
  'saudi arabia': { symbol: 'SR', code: 'SAR', name: 'Saudi Riyal' },
  'uae': { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  'united arab emirates': { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  'south africa': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  'egypt': { symbol: 'E£', code: 'EGP', name: 'Egyptian Pound' },
  
  // South America
  'brazil': { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  'argentina': { symbol: '$', code: 'ARS', name: 'Argentine Peso' },
  'chile': { symbol: '$', code: 'CLP', name: 'Chilean Peso' },
  'colombia': { symbol: '$', code: 'COP', name: 'Colombian Peso' },
  'peru': { symbol: 'S/', code: 'PEN', name: 'Peruvian Sol' },
};

// Pincode/Postal code patterns for different countries
const POSTAL_CODE_PATTERNS: Record<string, { pattern: RegExp; country: string; currency: { symbol: string; code: string; name: string } }> = {
  // US ZIP codes (5 digits or 5+4 format)
  'us_zip': { 
    pattern: /^\d{5}(-\d{4})?$/, 
    country: 'United States',
    currency: { symbol: '$', code: 'USD', name: 'US Dollar' }
  },
  
  // UK postcodes (various formats like SW1A 1AA, M1 1AA, B33 8TH)
  'uk_postcode': { 
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i, 
    country: 'United Kingdom',
    currency: { symbol: '£', code: 'GBP', name: 'British Pound' }
  },
  
  // Canadian postal codes (A1A 1A1 format)
  'ca_postal': { 
    pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, 
    country: 'Canada',
    currency: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' }
  },
  
  // Australian postcodes (4 digits)
  'au_postcode': { 
    pattern: /^[0-9]{4}$/, 
    country: 'Australia',
    currency: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' }
  },
  
  // German postal codes (5 digits)
  'de_plz': { 
    pattern: /^[0-9]{5}$/, 
    country: 'Germany',
    currency: { symbol: '€', code: 'EUR', name: 'Euro' }
  },
  
  // French postal codes (5 digits)
  'fr_postal': { 
    pattern: /^[0-9]{5}$/, 
    country: 'France',
    currency: { symbol: '€', code: 'EUR', name: 'Euro' }
  },
  
  // Indian PIN codes (6 digits)
  'in_pin': { 
    pattern: /^[0-9]{6}$/, 
    country: 'India',
    currency: { symbol: '₹', code: 'INR', name: 'Indian Rupee' }
  },
  
  // Japanese postal codes (7 digits with optional hyphen: 1234567 or 123-4567)
  'jp_postal': { 
    pattern: /^[0-9]{3}-?[0-9]{4}$/, 
    country: 'Japan',
    currency: { symbol: '¥', code: 'JPY', name: 'Japanese Yen' }
  },
  
  // Netherlands postal codes (4 digits + 2 letters: 1234 AB)
  'nl_postal': { 
    pattern: /^[0-9]{4}\s?[A-Z]{2}$/i, 
    country: 'Netherlands',
    currency: { symbol: '€', code: 'EUR', name: 'Euro' }
  },
  
  // Swiss postal codes (4 digits)
  'ch_postal': { 
    pattern: /^[0-9]{4}$/, 
    country: 'Switzerland',
    currency: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' }
  },
  
  // Singapore postal codes (6 digits)
  'sg_postal': { 
    pattern: /^[0-9]{6}$/, 
    country: 'Singapore',
    currency: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' }
  },
  
  // New Zealand postal codes (4 digits)
  'nz_postal': { 
    pattern: /^[0-9]{4}$/, 
    country: 'New Zealand',
    currency: { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' }
  },
  
  // South Korean postal codes (5 digits)
  'kr_postal': { 
    pattern: /^[0-9]{5}$/, 
    country: 'South Korea',
    currency: { symbol: '₩', code: 'KRW', name: 'South Korean Won' }
  },
  
  // Brazilian CEP (8 digits with optional hyphen: 12345678 or 12345-678)
  'br_cep': { 
    pattern: /^[0-9]{5}-?[0-9]{3}$/, 
    country: 'Brazil',
    currency: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' }
  }
};

// Get currency info for a location (enhanced with pincode detection)
export function getCurrencyForLocation(location: string): { symbol: string; code: string; name: string } {
  const trimmedLocation = location.trim();
  
  // First, try to detect if it's a postal/pin code
  for (const [key, config] of Object.entries(POSTAL_CODE_PATTERNS)) {
    if (config.pattern.test(trimmedLocation)) {
      return config.currency;
    }
  }
  
  // If not a postal code, try text-based matching
  const normalizedLocation = location.toLowerCase().trim();
  
  // Try exact match first
  if (CURRENCY_MAP[normalizedLocation]) {
    return CURRENCY_MAP[normalizedLocation];
  }
  
  // Try partial match
  for (const [country, currency] of Object.entries(CURRENCY_MAP)) {
    if (normalizedLocation.includes(country) || country.includes(normalizedLocation)) {
      return currency;
    }
  }
  
  // Check for common city/state combinations
  if (normalizedLocation.includes('new york') || normalizedLocation.includes('california') || 
      normalizedLocation.includes('texas') || normalizedLocation.includes('florida')) {
    return { symbol: '$', code: 'USD', name: 'US Dollar' };
  }
  
  if (normalizedLocation.includes('london') || normalizedLocation.includes('manchester') || 
      normalizedLocation.includes('birmingham') || normalizedLocation.includes('glasgow')) {
    return { symbol: '£', code: 'GBP', name: 'British Pound' };
  }
  
  if (normalizedLocation.includes('toronto') || normalizedLocation.includes('vancouver') || 
      normalizedLocation.includes('montreal') || normalizedLocation.includes('ontario')) {
    return { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' };
  }
  
  if (normalizedLocation.includes('sydney') || normalizedLocation.includes('melbourne') || 
      normalizedLocation.includes('brisbane') || normalizedLocation.includes('perth')) {
    return { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' };
  }
  
  if (normalizedLocation.includes('mumbai') || normalizedLocation.includes('delhi') || 
      normalizedLocation.includes('bangalore') || normalizedLocation.includes('chennai') ||
      normalizedLocation.includes('maharashtra') || normalizedLocation.includes('karnataka')) {
    return { symbol: '₹', code: 'INR', name: 'Indian Rupee' };
  }
  
  // Default to USD if no match found
  return { symbol: '$', code: 'USD', name: 'US Dollar' };
}

// Format currency amount
export function formatCurrency(amount: number, currencyInfo: { symbol: string; code: string }): string {
  // Special formatting for certain currencies
  switch (currencyInfo.code) {
    case 'JPY':
    case 'KRW':
    case 'IDR':
      // These currencies typically don't use decimal places
      return `${currencyInfo.symbol}${Math.round(amount).toLocaleString()}`;
    default:
      return `${currencyInfo.symbol}${amount.toLocaleString()}`;
  }
}

// Get suggested budget ranges for different currencies
export function getSuggestedBudgets(currencyCode: string): number[] {
  switch (currencyCode) {
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'NZD':
      return [25, 50, 100, 200, 500];
    case 'GBP':
      return [20, 40, 80, 150, 400];
    case 'EUR':
      return [25, 45, 90, 180, 450];
    case 'JPY':
      return [3000, 6000, 12000, 25000, 60000];
    case 'KRW':
      return [30000, 60000, 120000, 250000, 600000];
    case 'INR':
      return [2000, 4000, 8000, 16000, 40000];
    case 'CNY':
      return [180, 350, 700, 1400, 3500];
    case 'BRL':
      return [130, 260, 520, 1000, 2600];
    case 'MXN':
      return [500, 1000, 2000, 4000, 10000];
    case 'ZAR':
      return [400, 800, 1600, 3200, 8000];
    case 'CHF':
      return [25, 50, 100, 200, 500];
    case 'SGD':
      return [35, 70, 140, 280, 700];
    default:
      return [25, 50, 100, 200, 500]; // Default to USD-like values
  }
}

// Get location display name from input
export function getLocationDisplayName(input: string): string {
  const trimmedInput = input.trim();
  
  // Check if it's a recognized postal code
  for (const [key, config] of Object.entries(POSTAL_CODE_PATTERNS)) {
    if (config.pattern.test(trimmedInput)) {
      return `${trimmedInput}, ${config.country}`;
    }
  }
  
  // Return as-is if not a postal code
  return trimmedInput;
}