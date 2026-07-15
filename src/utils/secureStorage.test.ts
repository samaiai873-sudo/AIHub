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
      const secret = 'test-password';

      const encrypted = await encryptData(plaintext, secret);
      
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('version');
      expect(encrypted.version).toBe(1);

      const decrypted = await decryptData(encrypted, secret);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (random IV)', async () => {
      const plaintext = 'test-data';
      const secret = 'test-secret';

      const encrypted1 = await encryptData(plaintext, secret);
      const encrypted2 = await encryptData(plaintext, secret);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should fail to decrypt with wrong secret', async () => {
      const plaintext = 'test-data';
      const secret = 'correct-secret';
      const wrongSecret = 'wrong-secret';

      const encrypted = await encryptData(plaintext, secret);
      
      await expect(decryptData(encrypted, wrongSecret)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered ciphertext', async () => {
      const plaintext = 'test-data';
      const secret = 'test-secret';

      const encrypted = await encryptData(plaintext, secret);
      const tampered = { ...encrypted, ciphertext: 'tampered-data' };
      
      await expect(decryptData(tampered, secret)).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      const plaintext = '';
      const secret = 'test-secret';

      const encrypted = await encryptData(plaintext, secret);
      const decrypted = await decryptData(encrypted, secret);
      
      expect(decrypted).toBe('');
    });

    it('should handle special characters and unicode', async () => {
      const plaintext = '🔐 API Key: sk-1234567890!@#$%^&*()';
      const secret = 'test-secret';

      const encrypted = await encryptData(plaintext, secret);
      const decrypted = await decryptData(encrypted, secret);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('secureStorage (integration)', () => {
    it('should store and retrieve encrypted data', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const secret = 'test-secret';

      await secureStorage.setItem(key, value, secret);
      const retrieved = await secureStorage.getItem(key, secret);
      
      expect(retrieved).toBe(value);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await secureStorage.getItem('non-existent-key', 'secret');
      expect(retrieved).toBeNull();
    });

    it('should fail to decrypt with wrong secret', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const secret = 'correct-secret';
      const wrongSecret = 'wrong-secret';

      await secureStorage.setItem(key, value, secret);
      const retrieved = await secureStorage.getItem(key, wrongSecret);
      
      expect(retrieved).toBeNull();
    });

    it('should remove item', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const secret = 'test-secret';

      await secureStorage.setItem(key, value, secret);
      secureStorage.removeItem(key);
      
      const retrieved = await secureStorage.getItem(key, secret);
      expect(retrieved).toBeNull();
    });
  });

  describe('reEncryptAll', () => {
    it('should re-encrypt all stored data with new secret', async () => {
      const oldSecret = 'old-secret';
      const newSecret = 'new-secret';
      const testData = { 'api-key': 'test-value' };

      // Store multiple items with old secret
      await secureStorage.setItem('key1', JSON.stringify(testData), oldSecret);
      await secureStorage.setItem('key2', 'another-value', oldSecret);
      
      // Re-encrypt all with new secret
      await reEncryptAll(oldSecret, newSecret);
      
      // Verify items can be decrypted with new secret
      const retrieved1 = await secureStorage.getItem('key1', newSecret);
      expect(retrieved1).toBe(JSON.stringify(testData));
      
      const retrieved2 = await secureStorage.getItem('key2', newSecret);
      expect(retrieved2).toBe('another-value');
    });

    it('should skip items that fail to decrypt', async () => {
      const oldSecret = 'old-secret';
      const newSecret = 'new-secret';
      
      // Store one valid item and one corrupted item
      await secureStorage.setItem('valid-key', 'valid-value', oldSecret);
      localStorage.setItem('corrupted-key', 'not-valid-json');
      
      // Should not throw, just skip corrupted
      await reEncryptAll(oldSecret, newSecret);
      
      // Valid item should be re-encrypted
      const retrieved = await secureStorage.getItem('valid-key', newSecret);
      expect(retrieved).toBe('valid-value');
    });
  });
});