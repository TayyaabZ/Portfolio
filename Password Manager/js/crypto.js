/**
 * crypto.js - Encryption, Decryption, and Key Derivation
 * Uses Web Crypto API for all cryptographic operations
 */

class CryptoManager {
    constructor() {
        this.PBKDF2_ITERATIONS = 600000; // Strong iteration count
        this.SALT_LENGTH = 16;
        this.IV_LENGTH = 12;
        this.KEY_LENGTH = 256;
    }

    /**
     * Generate a random salt
     */
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    }

    /**
     * Generate a random IV for AES-GCM
     */
    generateIV() {
        return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    }

    /**
     * Derive a cryptographic key from master password using PBKDF2
     * @param {string} masterPassword - The master password
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey(masterPassword, salt) {
        try {
            // Convert password to key material
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(masterPassword);
            
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive key using PBKDF2
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: this.PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: 'AES-GCM',
                    length: this.KEY_LENGTH
                },
                false,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (error) {
            console.error('Key derivation error:', error);
            throw new Error('Failed to derive encryption key');
        }
    }

    /**
     * Encrypt data using AES-GCM
     * @param {string} plaintext - Data to encrypt
     * @param {CryptoKey} key - Encryption key
     * @returns {Promise<Object>} - Object containing ciphertext and IV
     */
    async encrypt(plaintext, key) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);
            const iv = this.generateIV();

            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            return {
                ciphertext: this.arrayBufferToBase64(ciphertext),
                iv: this.arrayBufferToBase64(iv)
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt data using AES-GCM
     * @param {string} ciphertextBase64 - Base64 encoded ciphertext
     * @param {string} ivBase64 - Base64 encoded IV
     * @param {CryptoKey} key - Decryption key
     * @returns {Promise<string>} - Decrypted plaintext
     */
    async decrypt(ciphertextBase64, ivBase64, key) {
        try {
            const ciphertext = this.base64ToArrayBuffer(ciphertextBase64);
            const iv = this.base64ToArrayBuffer(ivBase64);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data - wrong password or corrupted data');
        }
    }

    /**
     * Derive HMAC key from master password
     * @param {string} masterPassword - The master password
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>}
     */
    async deriveHMACKey(masterPassword, salt) {
        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(masterPassword);
            
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            const hmacKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: this.PBKDF2_ITERATIONS,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: 'HMAC',
                    hash: 'SHA-256',
                    length: 256
                },
                false,
                ['sign', 'verify']
            );

            return hmacKey;
        } catch (error) {
            console.error('HMAC key derivation error:', error);
            throw new Error('Failed to derive HMAC key');
        }
    }

    /**
     * Generate HMAC for integrity checking
     * @param {string} data - Data to sign
     * @param {CryptoKey} hmacKey - HMAC signing key
     * @returns {Promise<string>} - Base64 encoded HMAC
     */
    async generateHMAC(data, hmacKey) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);

            const signature = await crypto.subtle.sign(
                'HMAC',
                hmacKey,
                dataBuffer
            );

            return this.arrayBufferToBase64(signature);
        } catch (error) {
            console.error('HMAC generation error:', error);
            throw new Error('Failed to generate integrity check');
        }
    }

    /**
     * Verify HMAC for integrity checking
     * @param {string} data - Data to verify
     * @param {string} hmacBase64 - Base64 encoded HMAC
     * @param {CryptoKey} hmacKey - HMAC verification key
     * @returns {Promise<boolean>}
     */
    async verifyHMAC(data, hmacBase64, hmacKey) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hmacBuffer = this.base64ToArrayBuffer(hmacBase64);

            return await crypto.subtle.verify(
                'HMAC',
                hmacKey,
                hmacBuffer,
                dataBuffer
            );
        } catch (error) {
            console.error('HMAC verification error:', error);
            return false;
        }
    }

    /**
     * Hash password with SHA-1 for HIBP API
     * @param {string} password - Password to hash
     * @returns {Promise<string>} - Hex encoded SHA-1 hash
     */
    async sha1Hash(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        return this.arrayBufferToHex(hashBuffer);
    }

    /**
     * Convert ArrayBuffer to Base64
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
     * Convert Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to Hex string
     */
    arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate secure random password
     * @param {number} length - Password length
     * @param {Object} options - Character set options
     * @returns {string}
     */
    generateSecureRandom(length, options) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = '';
        if (options.uppercase) charset += uppercase;
        if (options.lowercase) charset += lowercase;
        if (options.digits) charset += digits;
        if (options.symbols) charset += symbols;

        if (!charset) return '';

        const randomValues = crypto.getRandomValues(new Uint8Array(length));
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        return password;
    }
}

// Export singleton instance
const cryptoManager = new CryptoManager();
