import crypto from 'crypto';

/**
 * Generates a UUID v7 (RFC 9562) — a time-ordered UUID.
 *
 * Structure (128 bits):
 *   - Bits 0–47:   Unix timestamp in milliseconds
 *   - Bits 48–51:  Version (0111 = 7)
 *   - Bits 52–63:  Random (rand_a)
 *   - Bits 64–65:  Variant (10)
 *   - Bits 66–127: Random (rand_b)
 *
 * @returns {string} UUID v7 string in canonical format (xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx)
 */
export function generateUUIDv7() {
  const timestamp = BigInt(Date.now());
  const randomBytes = crypto.randomBytes(10);

  // 6 bytes for timestamp (48 bits)
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  // Build the 16-byte UUID
  const bytes = Buffer.alloc(16);

  // Bytes 0-5: timestamp (big-endian)
  bytes[0] = parseInt(timestampHex.slice(0, 2), 16);
  bytes[1] = parseInt(timestampHex.slice(2, 4), 16);
  bytes[2] = parseInt(timestampHex.slice(4, 6), 16);
  bytes[3] = parseInt(timestampHex.slice(6, 8), 16);
  bytes[4] = parseInt(timestampHex.slice(8, 10), 16);
  bytes[5] = parseInt(timestampHex.slice(10, 12), 16);

  // Bytes 6-7: version (7) + rand_a
  bytes[6] = (0x70) | (randomBytes[0] & 0x0f); // Version 7
  bytes[7] = randomBytes[1];

  // Bytes 8-15: variant (10) + rand_b
  bytes[8] = (0x80) | (randomBytes[2] & 0x3f); // Variant 10
  bytes[9] = randomBytes[3];
  bytes[10] = randomBytes[4];
  bytes[11] = randomBytes[5];
  bytes[12] = randomBytes[6];
  bytes[13] = randomBytes[7];
  bytes[14] = randomBytes[8];
  bytes[15] = randomBytes[9];

  // Format as canonical UUID string
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
