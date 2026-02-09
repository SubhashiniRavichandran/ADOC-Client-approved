// ADOC Chrome Extension - Encryption Utility
// AES-256-GCM encryption for secure token storage

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Generate encryption key from password
   */
  async generateKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('adoc-extension-salt-v1'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(plaintext, password) {
    try {
      const encoder = new TextEncoder();
      const key = await this.generateKey(password);

      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encoder.encode(plaintext)
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData, password) {
    try {
      const key = await this.generateKey(password);

      // Convert base64 back to array buffer
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Store encrypted data in Chrome storage
   */
  async secureStore(key, value, password = 'adoc-default-key-v1') {
    const encrypted = await this.encrypt(JSON.stringify(value), password);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: encrypted }, resolve);
    });
  }

  /**
   * Retrieve and decrypt data from Chrome storage
   */
  async secureRetrieve(key, password = 'adoc-default-key-v1') {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], async (result) => {
        if (result[key]) {
          try {
            const decrypted = await this.decrypt(result[key], password);
            resolve(JSON.parse(decrypted));
          } catch (error) {
            console.error('Failed to decrypt:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Remove encrypted data from storage
   */
  async secureRemove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  }
}

// Export singleton instance
const encryptionService = new EncryptionService();
