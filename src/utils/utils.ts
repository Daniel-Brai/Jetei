import * as crypto from 'crypto';

/**
 * Generate a nonce
 * @returns {string} The generated nonce for scripts
 */
export function generateNonce() {
  return crypto.randomBytes(64).toString('base64');
}

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return; // Remove circular reference
      }
      seen.add(value);
    }
    return value;
  };
};
