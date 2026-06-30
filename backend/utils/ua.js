/**
 * Parses browser, platform, and device name from a User-Agent string.
 * This is a lightweight, zero-dependency implementation.
 * 
 * @param {string} uaString - Raw User-Agent header from the request
 * @returns {Object} Parsed device session metadata
 */
export function parseUserAgent(uaString) {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      platform: 'Unknown OS',
      device_name: 'Unknown Device'
    };
  }

  let browser = 'Unknown Browser';
  let platform = 'Unknown OS';
  let device_name = 'Desktop';

  // 1. Detect Platform / Operating System
  if (uaString.includes('Windows NT 10.0')) {
    platform = 'Windows 10/11';
  } else if (uaString.includes('Windows NT 6.1')) {
    platform = 'Windows 7';
  } else if (uaString.includes('Windows')) {
    platform = 'Windows';
  } else if (uaString.includes('Android')) {
    platform = 'Android';
    device_name = 'Mobile Device';
  } else if (uaString.includes('iPhone')) {
    platform = 'iOS';
    device_name = 'iPhone';
  } else if (uaString.includes('iPad')) {
    platform = 'iOS';
    device_name = 'iPad';
  } else if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) {
    platform = 'macOS';
  } else if (uaString.includes('Linux')) {
    platform = 'Linux';
  }

  // 2. Detect Browser Name
  if (uaString.includes('Edg/')) {
    browser = 'Edge';
  } else if (uaString.includes('Chrome/') && uaString.includes('Safari/')) {
    browser = 'Chrome';
  } else if (uaString.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (uaString.includes('Safari/') && !uaString.includes('Chrome/')) {
    browser = 'Safari';
  } else if (uaString.includes('MSIE') || uaString.includes('Trident/')) {
    browser = 'Internet Explorer';
  }

  return { browser, platform, device_name };
}
