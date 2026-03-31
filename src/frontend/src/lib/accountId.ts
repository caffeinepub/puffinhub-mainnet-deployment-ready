import type { Principal } from "@icp-sdk/core/principal";

// CRC32 implementation
function crc32(data: Uint8Array): Uint8Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;

  const result = new Uint8Array(4);
  result[0] = (crc >> 24) & 0xff;
  result[1] = (crc >> 16) & 0xff;
  result[2] = (crc >> 8) & 0xff;
  result[3] = crc & 0xff;
  return result;
}

// SHA-224 implementation (simplified for browser compatibility)
function sha224(data: Uint8Array): Uint8Array {
  // SHA-224 uses SHA-256 with different initial hash values and truncated output
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  // SHA-224 initial hash values (different from SHA-256)
  let h0 = 0xc1059ed8;
  let h1 = 0x367cd507;
  let h2 = 0x3070dd17;
  let h3 = 0xf70e5939;
  let h4 = 0xffc00b31;
  let h5 = 0x68581511;
  let h6 = 0x64f98fa7;
  let h7 = 0xbefa4fa4;

  // Pre-processing
  const msgLen = data.length;
  const bitLen = msgLen * 8;

  // Padding
  const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[msgLen] = 0x80;

  // Append length as 64-bit big-endian
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  // Process each 512-bit chunk
  for (let chunk = 0; chunk < paddedLen; chunk += 64) {
    const w = new Uint32Array(64);

    // Copy chunk into first 16 words
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(chunk + i * 4, false);
    }

    // Extend the first 16 words into the remaining 48 words
    for (let i = 16; i < 64; i++) {
      const s0 =
        rightRotate(w[i - 15], 7) ^
        rightRotate(w[i - 15], 18) ^
        (w[i - 15] >>> 3);
      const s1 =
        rightRotate(w[i - 2], 17) ^
        rightRotate(w[i - 2], 19) ^
        (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    // Initialize working variables
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    // Main loop
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    // Add compressed chunk to current hash value
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // Produce the final hash value (SHA-224 uses only first 7 words = 28 bytes)
  const result = new Uint8Array(28);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);
  resultView.setUint32(20, h5, false);
  resultView.setUint32(24, h6, false);

  return result;
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

// Convert bytes to hex string
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert a Principal to an Account ID (hex string)
 * This is the standard ICP ledger account identifier format
 */
export function principalToAccountId(
  principal: Principal,
  subAccount?: Uint8Array,
): string {
  const principalBytes = principal.toUint8Array();

  // Default subaccount is 32 zero bytes
  const subAccountBytes = subAccount || new Uint8Array(32);

  if (subAccountBytes.length !== 32) {
    throw new Error("Subaccount must be 32 bytes");
  }

  // Build the data to hash: \x0Aaccount-id + principal + subaccount
  const domainSeparator = new TextEncoder().encode("\x0Aaccount-id");
  const data = new Uint8Array(
    domainSeparator.length + principalBytes.length + subAccountBytes.length,
  );
  data.set(domainSeparator, 0);
  data.set(principalBytes, domainSeparator.length);
  data.set(subAccountBytes, domainSeparator.length + principalBytes.length);

  // Hash with SHA-224
  const hashBytes = sha224(data);

  // Calculate CRC32 checksum
  const crc = crc32(hashBytes);

  // Combine CRC32 + hash
  const accountId = new Uint8Array(crc.length + hashBytes.length);
  accountId.set(crc, 0);
  accountId.set(hashBytes, crc.length);

  return toHexString(accountId);
}
