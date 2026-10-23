import { UAParser } from 'ua-parser-js';
import { nanoid } from 'nanoid';

/**
 * Validates if the given string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return false;
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes URL string (adds https:// if missing, removes leading/trailing spaces)
 */
export function normalizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

/**
 * Generates a clean, unique short code (5-6 characters alphanumeric)
 */
export function generateShortCode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitizes a custom alias: converts spaces to hyphens, removes invalid chars
 */
export function sanitizeCustomAlias(alias: string): string {
  return alias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 30);
}

/**
 * Parses user agent string to extract device, OS, and browser
 */
export function parseUserAgent(uaString: string | null | undefined) {
  if (!uaString) {
    return {
      device: 'desktop',
      browser: 'Other',
      os: 'Other',
    };
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  let device = result.device.type || 'desktop';
  if (device === 'mobile' || device === 'tablet') {
    // keep as is
  } else {
    // Check fallback for mobile user agents
    if (/android|iphone|ipad|ipod|mobile/i.test(uaString)) {
      device = /ipad|tablet/i.test(uaString) ? 'tablet' : 'mobile';
    } else {
      device = 'desktop';
    }
  }

  const browser = result.browser.name || 'Other';
  const os = result.os.name || 'Other';

  return {
    device,
    browser,
    os,
  };
}

/**
 * Cleans and categorizes raw referrer URL into friendly source name
 */
export function cleanReferrer(rawReferrer: string | null | undefined): string {
  if (!rawReferrer || rawReferrer === 'null' || rawReferrer === 'undefined' || rawReferrer === '') {
    return 'Direct';
  }

  try {
    const url = new URL(rawReferrer);
    const host = url.hostname.toLowerCase();

    if (host.includes('google')) return 'Google';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('t.me') || host.includes('telegram')) return 'Telegram';
    if (host.includes('twitter') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('bing')) return 'Bing';
    if (host.includes('yahoo')) return 'Yahoo';

    // strip www.
    return host.replace(/^www\./, '');
  } catch {
    return 'Direct';
  }
}

/**
 * Returns country flag emoji from 2-letter ISO code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'Unknown' || countryCode.length !== 2) {
    return '🌐';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Country code to friendly name
 */
const countryMap: Record<string, string> = {
  ID: 'Indonesia',
  US: 'United States',
  SG: 'Singapore',
  MY: 'Malaysia',
  JP: 'Japan',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  NL: 'Netherlands',
  IN: 'India',
  BR: 'Brazil',
  CA: 'Canada',
  KR: 'South Korea',
  PH: 'Philippines',
  VN: 'Vietnam',
  TH: 'Thailand',
};

export function getCountryName(code: string): string {
  if (!code || code === 'Unknown') return 'Tidak Diketahui';
  return countryMap[code.toUpperCase()] || code.toUpperCase();
}

/**
 * Formats relative time (e.g. 5 menit lalu)
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Formats date into readable string
 */
export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Gets base URL of the site (gua.my.id or window.location.origin)
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://gua.my.id';
}
