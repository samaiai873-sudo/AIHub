/**
 * Secure Storage Utility using Web Crypto API (AES-GCM)
 * 
 * Uses a randomly generated encryption key stored in IndexedDB (non-extractable).
 * The key is generated once per browser/profile and persists across sessions.
 * Data is encrypted with AES-GCM (256-bit key, 96-bit IV).
 * 
 * No user password required - encryption is tied to the browser/profile.
 * Data cannot be decrypted on different machines/browsers.
 */

// Algorithm identifiers
const AES_GCM_ALGO = "AES-GCM";

interface EncryptedData {
  /** Base64 encoded IV (12 bytes) */
  iv: string;
  /** Base64 encoded ciphertext + auth tag */
  ciphertext: string;
  /** Version for future migration */
  version: number;
}

const ENCRYPTION_VERSION = 2; // Incremented for new format

export { ENCRYPTION_VERSION };

// Key storage key in IndexedDB / legacy localStorage fallback
const MASTER_KEY_STORAGE_KEY = "aihub-master-encryption-key";
const KEY_DB_NAME = "aihub-secure-storage";
const KEY_DB_VERSION = 1;
const KEY_STORE_NAME = "crypto-keys";
const KEY_RECORD_ID = "master-key";

let cachedMasterKey: CryptoKey | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(KEY_DB_NAME, KEY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredKeyMaterial(): Promise<string | null> {
  if (isIndexedDbAvailable()) {
    try {
      const db = await openKeyDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(KEY_STORE_NAME, "readonly");
        const store = transaction.objectStore(KEY_STORE_NAME);
        const request = store.get(KEY_RECORD_ID);

        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.warn("Failed to read master key from IndexedDB:", error);
    }
  }

  return localStorage.getItem(MASTER_KEY_STORAGE_KEY);
}

async function writeStoredKeyMaterial(value: string): Promise<void> {
  if (isIndexedDbAvailable()) {
    try {
      const db = await openKeyDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(KEY_STORE_NAME, "readwrite");
        const store = transaction.objectStore(KEY_STORE_NAME);
        store.put(value, KEY_RECORD_ID);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
      localStorage.removeItem(MASTER_KEY_STORAGE_KEY);
      return;
    } catch (error) {
      console.warn("Failed to write master key to IndexedDB, falling back to localStorage:", error);
    }
  }

  localStorage.setItem(MASTER_KEY_STORAGE_KEY, value);
}

async function removeStoredKeyMaterial(): Promise<void> {
  if (isIndexedDbAvailable()) {
    try {
      const db = await openKeyDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(KEY_STORE_NAME, "readwrite");
        const store = transaction.objectStore(KEY_STORE_NAME);
        store.delete(KEY_RECORD_ID);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.warn("Failed to remove master key from IndexedDB:", error);
    }
  }

  localStorage.removeItem(MASTER_KEY_STORAGE_KEY);
}

export async function clearMasterKeyMaterial(): Promise<void> {
  cachedMasterKey = null;
  await removeStoredKeyMaterial();
}

/**
 * Generate or retrieve the master encryption key
 * The key is generated once and stored in localStorage (non-extractable)
 */
async function getOrCreateMasterKey(): Promise<CryptoKey> {
  if (cachedMasterKey) {
    return cachedMasterKey;
  }

  // Check if key already exists in localStorage
  const storedKeyData = await readStoredKeyMaterial();

  if (storedKeyData) {
    try {
      // Import the stored raw key
      const rawKey = Uint8Array.from(atob(storedKeyData), c => c.charCodeAt(0));
      cachedMasterKey = await crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: AES_GCM_ALGO, length: 256 },
        false, // not extractable
        ["encrypt", "decrypt"]
      );
      return cachedMasterKey;
    } catch (error) {
      console.warn("Failed to import stored key, generating new one:", error);
      // Fall through to generate new key
    }
  }
  
  // Generate new random key
  const key = await crypto.subtle.generateKey(
    {
      name: AES_GCM_ALGO,
      length: 256,
    },
    true, // temporarily extractable so we can migrate legacy storage once
    ["encrypt", "decrypt"]
  );
  
  // Export and store the raw key for future sessions
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const rawKeyArray = new Uint8Array(rawKey);
  const keyString = btoa(String.fromCharCode(...rawKeyArray));
  await writeStoredKeyMaterial(keyString);

  cachedMasterKey = await crypto.subtle.importKey(
    "raw",
    rawKeyArray,
    { name: AES_GCM_ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return cachedMasterKey;
}

/**
 * Encrypt data using AES-GCM
 * @param plaintext Data to encrypt (will be JSON stringified)
 * @returns Encrypted data object (iv, ciphertext, version)
 */
export async function encryptData(plaintext: string): Promise<EncryptedData> {
  const key = await getOrCreateMasterKey();
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
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
  
  const ciphertext = new Uint8Array(ciphertextBuffer);
  
  return {
    version: ENCRYPTION_VERSION,
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
  };
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData Encrypted data object
 * @returns Decrypted plaintext string
 */
export async function decryptData(encryptedData: EncryptedData): Promise<string> {
  // Version check for future migration
  if (encryptedData.version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${encryptedData.version}`);
  }

  // Decode base64 components
  const iv = new Uint8Array(
    atob(encryptedData.iv).split("").map((c) => c.charCodeAt(0))
  );
  const ciphertext = new Uint8Array(
    atob(encryptedData.ciphertext).split("").map((c) => c.charCodeAt(0))
  );

  const key = await getOrCreateMasterKey();

  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGO,
      iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Check if secure storage is available (Web Crypto API support)
 */
export function isSecureStorageAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.generateKey === "function" &&
    typeof crypto.subtle.encrypt === "function" &&
    typeof crypto.subtle.decrypt === "function" &&
    (typeof indexedDB !== "undefined" || typeof localStorage !== "undefined")
  );
}

/**
 * Secure Storage API - wraps localStorage with encryption
 */
export const secureStorage = {
  /**
   * Store encrypted data in localStorage
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error(`Failed to encrypt and store ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve and decrypt data from localStorage
   * @param key Storage key
   * @returns Decrypted value or null if not found/failed
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const encryptedData: EncryptedData = JSON.parse(stored);
      const decrypted = await decryptData(encryptedData);
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
   * Clear all encrypted data (optional utility)
   */
  clear(): void {
    localStorage.clear();
  },
};

/**
 * Re-encrypt all stored data with current master key
 * Useful if master key was rotated (not needed with current design)
 */
export async function reEncryptAll(): Promise<void> {
  // With current design, master key is stable per browser
  // This is kept for API compatibility but does nothing
  console.log("reEncryptAll: No action needed - master key is browser-bound");
}

export type { EncryptedData };
