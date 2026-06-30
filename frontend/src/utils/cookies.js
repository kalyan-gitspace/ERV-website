/**
 * Helper to get a cookie value by name
 * @param {string} name - Name of the cookie
 * @returns {string|null} - Cookie value or null if not found
 */
export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    return decodeURIComponent(match[2]);
  }
  return null;
}
