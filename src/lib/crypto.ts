/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure TypeScript synchronous SHA-256 hashing implementation.
 * Used for client-side password hashing before storing in local state.
 */
export function hashPassword(password: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiLength = password.length * 8;
  
  let i: number, j: number;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1/2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1/3) * maxWord) | 0;
      primeCounter++;
    }
    candidate++;
  }
  
  const asciiBytes: number[] = [];
  for (i = 0; i < password.length; i++) {
    asciiBytes.push(password.charCodeAt(i));
  }
  asciiBytes.push(0x80);
  
  while (asciiBytes.length % 64 !== 56) asciiBytes.push(0);
  for (i = 0; i < 8; i++) {
    asciiBytes.push((asciiLength >>> (56 - i * 8)) & 0xff);
  }
  
  for (i = 0; i < asciiBytes.length; i += 4) {
    words.push((asciiBytes[i] << 24) | (asciiBytes[i+1] << 16) | (asciiBytes[i+2] << 8) | asciiBytes[i+3]);
  }
  
  const h = [...hash];
  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    for (j = w.length; j < 64; j++) {
      const s0 = rightRotate(w[j-15], 7) ^ rightRotate(w[j-15], 18) ^ (w[j-15] >>> 3);
      const s1 = rightRotate(w[j-2], 17) ^ rightRotate(w[j-2], 19) ^ (w[j-2] >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
    }
    
    let [a, b, c, d, e, f, g, hi] = h;
    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (hi + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      
      hi = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hi) | 0;
  }
  
  for (i = 0; i < 8; i++) {
    const hex = (h[i] >>> 0).toString(16);
    result += ('00000000' + hex).slice(-8);
  }
  return result;
}
