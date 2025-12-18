/**
 * Browser API utilities for the extension.
 * Uses webextension-polyfill for cross-browser compatibility (Chrome & Firefox).
 */
import browser from 'webextension-polyfill';

/**
 * Fetches all Bandcamp cookies from the browser.
 * Returns a map of cookie names to values.
 */
export async function getBandcampCookies(): Promise<Record<string, string>> {
  try {
    const cookies = await browser.cookies.getAll({ domain: '.bandcamp.com' });
    return cookies.reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Failed to fetch Bandcamp cookies:', error);
    return {};
  }
}

/**
 * Check if the extension has access to Bandcamp cookies.
 * Useful for debugging or showing UI warnings.
 */
export async function hasBandcampAccess(): Promise<boolean> {
  try {
    const cookies = await browser.cookies.getAll({ domain: '.bandcamp.com' });
    return cookies.length > 0;
  } catch (error) {
    console.error('Failed to check Bandcamp access:', error);
    return false;
  }
}
