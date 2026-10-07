// [CS.06] RFC 9562 UUIDv7 generator: 48-bit Big-Endian Unix millisecond timestamp + monotonic sequence counter
// Enables chronological lexicographical sorting, optimal for B-Trees, IndexedDB, and database primary keys.

let lastTime = -1;
let sequenceCounter = 0;

export function createUuidV7(timeSource?: () => number): string {
  const now = timeSource ? timeSource() : Date.now();

  if (now > lastTime) {
    lastTime = now;
    sequenceCounter = 0;
  } else {
    // Clock did not advance or moved backwards; increment sequence counter
    sequenceCounter = (sequenceCounter + 1) & 0xfff;
  }

  const bytes = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // 48-bit timestamp in big-endian order (bytes 0..5)
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7: high 4 bits of byte 6 must be 0b0111 (0x70)
  // Low 4 bits of byte 6 + byte 7 hold the 12-bit sequence counter (rand_a)
  bytes[6] = 0x70 | ((sequenceCounter >> 8) & 0x0f);
  bytes[7] = sequenceCounter & 0xff;

  // Variant: high 2 bits of byte 8 must be 0b10 (0x80)
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

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
