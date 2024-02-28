import * as crypto from 'crypto';

/**
 * Generate a nonce 
 * @returns {string} The generated nonce for scripts
 */
export function generateNonce() {
    return crypto.randomBytes(64).toString('base64')
}