/**
 * Client-Side Zero-Knowledge AES-256-GCM File Encryption Engine
 * Uses Web Crypto API (SubtleCrypto) to encrypt files in memory with authenticated integrity tags before upload.
 */

export class ClientFileEncryptor {
  /**
   * Generate a random 256-bit AES-GCM encryption key
   * @returns {Promise<CryptoKey>}
   */
  async generateKey() {
    const cryptoObj = this._getCrypto();
    return await cryptoObj.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive AES-256 key from a user passphrase using PBKDF2
   * @param {string} passphrase - User master passphrase
   * @param {Uint8Array} salt - 16-byte random salt
   * @param {number} [iterations=100000] - Hash iterations
   * @returns {Promise<CryptoKey>}
   */
  async deriveKeyFromPassphrase(passphrase, salt, iterations = 100000) {
    const cryptoObj = this._getCrypto();
    const encoder = new TextEncoder();
    const keyMaterial = await cryptoObj.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await cryptoObj.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt an ArrayBuffer or binary file using AES-256-GCM
   * @param {ArrayBuffer|Uint8Array} fileData - Cleartext binary buffer
   * @param {CryptoKey} key - AES-GCM 256-bit key
   * @returns {Promise<Object>} Encrypted package with IV and ciphertext
   */
  async encrypt(fileData, key) {
    const cryptoObj = this._getCrypto();
    // 96-bit (12-byte) initialization vector (standard for GCM)
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));

    const ciphertextBuffer = await cryptoObj.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128 // 128-bit authentication tag
      },
      key,
      fileData
    );

    // Pack into standardized envelope: [12-byte IV][Ciphertext + 16-byte Tag]
    const ciphertextArray = new Uint8Array(ciphertextBuffer);
    const envelope = new Uint8Array(iv.length + ciphertextArray.length);
    envelope.set(iv, 0);
    envelope.set(ciphertextArray, iv.length);

    return {
      envelopeBuffer: envelope.buffer,
      iv: Array.from(iv),
      originalSize: fileData.byteLength || fileData.length,
      encryptedSize: envelope.length,
      algorithm: 'AES-256-GCM'
    };
  }

  /**
   * Decrypt an encrypted envelope package back to cleartext binary
   * @param {ArrayBuffer|Uint8Array} envelopeData - Encrypted package
   * @param {CryptoKey} key - AES-GCM 256-bit key
   * @returns {Promise<ArrayBuffer>} Decrypted cleartext buffer
   */
  async decrypt(envelopeData, key) {
    const cryptoObj = this._getCrypto();
    const rawEnvelope = new Uint8Array(envelopeData);

    // Extract 12-byte IV
    const iv = rawEnvelope.slice(0, 12);
    const ciphertext = rawEnvelope.slice(12);

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128
      },
      key,
      ciphertext
    );

    return decryptedBuffer;
  }

  /**
   * Export CryptoKey to Base64 string for URL sharing/passphrase distribution
   */
  async exportKeyToBase64(key) {
    const cryptoObj = this._getCrypto();
    const exportedRaw = await cryptoObj.subtle.exportKey('raw', key);
    const uint8 = new Uint8Array(exportedRaw);
    let binary = '';
    for (let i = 0; i < uint8.byteLength; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  /**
   * Import Base64 string back into CryptoKey
   */
  async importKeyFromBase64(base64Key) {
    const cryptoObj = this._getCrypto();
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return await cryptoObj.subtle.importKey(
      'raw',
      bytes.buffer,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  _getCrypto() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      return globalThis.crypto;
    }
    throw new Error('Web Crypto API (crypto.subtle) is not supported in this runtime environment');
  }
}

export default ClientFileEncryptor;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClientFileEncryptor;
  module.exports.ClientFileEncryptor = ClientFileEncryptor;
}
