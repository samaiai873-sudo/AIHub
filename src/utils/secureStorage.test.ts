import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  encryptData, 
  decryptData, 
  isSecureStorageAvailable, 
  reEncryptAll,
  secureStorage 
} from '../utils/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isSecureStorageAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      expect(isSecureStorageAvailable()).toBe(true);
    });
  });

  describe('encryptData / decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'test-api-key-12345';

      const encrypted = await encryptData(plaintext);
      
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('version');
      expect(encrypted.version).toBe(2);

      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (random IV)', async () => {
      const plaintext = 'test-data';

      const encrypted1 = await encryptData(plaintext);
      const encrypted2 = await encryptData(plaintext);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should fail to decrypt with tampered ciphertext', async () => {
      const plaintext = 'test-data';

      const encrypted = await encryptData(plaintext);
      const tampered = { ...encrypted, ciphertext: 'tampered-data' };
      
      await expect(decryptData(tampered)).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      const plaintext = '';

      const encrypted = await encryptData(plaintext);
      const decrypted = await decryptData(encrypted);
      
      expect(decrypted).toBe('');
    });

    it('should handle special characters and unicode', async () => {
      const plaintext = '🔐 API Key: «redacted:sk-…»!@#$%^&*()';

      const encrypted = await encryptData(plaintext);
      const decrypted = await decryptData(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('secureStorage (integration)', () => {
    it('should store and retrieve encrypted data', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await secureStorage.setItem(key, value);
      const retrieved = await secureStorage.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await secureStorage.getItem('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should remove item', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await secureStorage.setItem(key, value);
      secureStorage.removeItem(key);
      
      const retrieved = await secureStorage.getItem(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('reEncryptAll', () => {
    it('should complete without error (no-op with current design)', async () => {
      await reEncryptAll();
      expect(true).toBe(true);
    });
  });
});