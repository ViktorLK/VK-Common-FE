// [CS.06] RFC 4122 v4 UUID generator using Web Crypto with deterministic fallback

export function createUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for environments lacking crypto.randomUUID
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Version 4: 0100xxxx
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Variant RFC 4122: 10xxxxxx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let hex = '';
  for (let i = 0; i < 16; i++) {
    const b = bytes[i].toString(16).padStart(2, '0');
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      hex += '-';
    }
    hex += b;
  }
  return hex;
}
