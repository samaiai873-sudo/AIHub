/**
 * Secure Storage Utility using Web Crypto API (AES-GCM)
 * 
 * Encrypts data before storing in localStorage.
 * Uses a machine-specific key derived from device fingerprint + user-defined secret.
 * 
 * Key derivation: PBKDF2 (SHA-256, 100,000 iterations)
 * Encryption: AES-GCM (256-bit key, 96-bit IV)
 * 
 * Note: This provides at-rest encryption. The key is derived from device fingerprint,
 * so data can only be decrypted on the same machine/browser profile.
 */

// Salt stored alongside encrypted data (16 bytes = 128 bits)
const SALT_LENGTH = 16;
// IV length for AES-GCM (12 bytes = 96 bits, recommended for GCM)
const IV_LENGTH = 12;
// PBKDF2 iterations
const PBKDF2_ITERATIONS = 100_000;
// Key length for AES-256
const KEY_LENGTH = 256;
// Algorithm identifiers
const PBKDF2_ALGO = "PBKDF2";
const AES_GCM_ALGO = "AES-GCM";
const HASH_ALGO = "SHA-256";

interface EncryptedData {
  /** Base64 encoded salt (16 bytes) */
  salt: string;
  /** Base64 encoded IV (12 bytes) */
  iv: string;
  /** Base64 encoded ciphertext + auth tag */
  ciphertext: string;
  /** Version for future migration */
  version: number;
}

const ENCRYPTION_VERSION = 1;

/**
 * Derive encryption key from device fingerprint + optional user secret
 * The device fingerprint includes: userAgent, screen resolution, timezone, language, color depth
 */
async function deriveKey(userSecret: string = "", salt?: Uint8Array): Promise<CryptoKey> {
  // Create device fingerprint
  const fingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.languages?.join(","),
  ].join("|");

  // Combine fingerprint with user secret
  const keyMaterial = fingerprint + "|" + userSecret;
  
  // Convert to ArrayBuffer
  const encoder = new TextEncoder();
  const keyMaterialBuffer = encoder.encode(keyMaterial);

  // Import as raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyMaterialBuffer,
    PBKDF2_ALGO,
    false,
    ["deriveKey"]
  );

  // Ensure we have a proper ArrayBuffer (not SharedArrayBuffer)
  function toArrayBuffer(buf: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
    if (buf.constructor.name === "ArrayBuffer") {
      return buf as ArrayBuffer;
    }
    // Copy to new ArrayBuffer
    const view = new Uint8Array(buf);
    const copy = new ArrayBuffer(view.length);
    new Uint8Array(copy).set(view);
    return copy;
  }

  // Convert salt to a proper ArrayBuffer
  const saltArrayBuffer: ArrayBuffer = salt
    ? toArrayBuffer(salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength))
    : (() => {
        const randomValues = new Uint8Array(SALT_LENGTH);
        crypto.getRandomValues(randomValues);
        const buf = new ArrayBuffer(randomValues.length);
        new Uint8Array(buf).set(randomValues);
        return buf;
      })();

  // Derive AES-GCM key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGO,
      salt: new Uint8Array(saltArrayBuffer),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    baseKey,
    { name: AES_GCM_ALGO, length: KEY_LENGTH },
    false, // not extractable
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Derive key with a specific salt (for decryption)
 */
async function deriveKeyWithSalt(
  userSecret: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const fingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.languages?.join(","),
  ].join("|");

  const keyMaterial = fingerprint + "|" + userSecret;
  const encoder = new TextEncoder();
  const keyMaterialBuffer = encoder.encode(keyMaterial);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyMaterialBuffer,
    PBKDF2_ALGO,
    false,
    ["deriveKey"]
  );

  function toArrayBuffer(buf: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
    if (buf.constructor.name === "ArrayBuffer") {
      return buf as ArrayBuffer;
    }
    // Copy to new ArrayBuffer
    const view = new Uint8Array(buf);
    const copy = new ArrayBuffer(view.length);
    new Uint8Array(copy).set(view);
    return copy;
  }

  // Ensure salt is a proper ArrayBuffer (not SharedArrayBuffer)
  const saltArrayBuffer: ArrayBuffer = toArrayBuffer(
    salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength)
  ) as ArrayBuffer;

  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGO,
      salt: new Uint8Array(saltArrayBuffer),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    baseKey,
    { name: AES_GCM_ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data using AES-GCM
 * @param plaintext Data to encrypt (will be JSON stringified)
 * @param userSecret Optional additional secret (e.g., user password)
 * @returns Encrypted data object (salt, iv, ciphertext, version)
 */
export async function encryptData(
  plaintext: string,
  userSecret: string = ""
): Promise<EncryptedData> {
  // Generate salt for key derivation (will be stored for decryption)
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(userSecret, salt);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGO,
      iv,
    },
    key,
    plaintextBuffer
  );

  // The ciphertext includes the auth tag appended (AES-GCM behavior)
  const ciphertext = new Uint8Array(ciphertextBuffer);

  return {
    version: ENCRYPTION_VERSION,
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
  };
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData Encrypted data object
 * @param userSecret Optional additional secret (must match encryption)
 * @returns Decrypted plaintext string
 */
export async function decryptData(
  encryptedData: EncryptedData,
  userSecret: string = ""
): Promise<string> {
  // Version check for future migration
  if (encryptedData.version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${encryptedData.version}`);
  }

  // Decode base64 components
  const salt = new Uint8Array(
    atob(encryptedData.salt).split("").map((c) => c.charCodeAt(0))
  );
  const iv = new Uint8Array(
    atob(encryptedData.iv).split("").map((c) => c.charCodeAt(0))
  );
  const ciphertext = new Uint8Array(
    atob(encryptedData.ciphertext).split("").map((c) => c.charCodeAt(0))
  );

  // Derive key with stored salt
  const key = await deriveKeyWithSalt(userSecret, salt);

  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGO,
      iv,
    },
    key,
    ciphertext
  );

  // Decode
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Secure Storage API - wraps localStorage with encryption
 */
export const secureStorage = {
  /**
   * Store encrypted data in localStorage
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   * @param userSecret Optional additional secret
   */
  async setItem(key: string, value: string, userSecret?: string): Promise<void> {
    try {
      const encrypted = await encryptData(value, userSecret);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error(`Failed to encrypt and store ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve and decrypt data from localStorage
   * @param key Storage key
   * @param userSecret Optional additional secret (must match encryption)
   * @returns Decrypted value or null if not found/failed
   */
  async getItem(key: string, userSecret?: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const encryptedData: EncryptedData = JSON.parse(stored);
      const decrypted = await decryptData(encryptedData, userSecret);
      return decrypted;
    } catch (error) {
      console.error(`Failed to decrypt and retrieve ${key}:`, error);
      // On decryption failure, remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all secure storage items (use with caution)
   */
  clear(): void {
    localStorage.clear();
  },
};

/**
 * Migration helper: re-encrypt all stored items with new secret
 * Useful when user changes their "master password"
 */
export async function reEncryptAll(
  oldSecret: string,
  newSecret: string
): Promise<void> {
  const keys = Object.keys(localStorage);
  
  for (const key of keys) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const encryptedData: EncryptedData = JSON.parse(stored);
      
      // Decrypt with old secret
      const plaintext = await decryptData(encryptedData, oldSecret);
      
      // Re-encrypt with new secret
      const newEncrypted = await encryptData(plaintext, newSecret);
      
      localStorage.setItem(key, JSON.stringify(newEncrypted));
    } catch (error) {
      console.warn(`Failed to re-encrypt ${key}:`, error);
      // Don't throw - continue with other keys
    }
  }
}

/**
 * Check if secure storage is available (Web Crypto API support)
 */
export function isSecureStorageAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  );
}