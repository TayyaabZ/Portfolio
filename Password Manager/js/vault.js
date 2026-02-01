/**
 * vault.js - Vault Structure and CRUD Operations
 * Manages password entries, storage, and vault operations
 */

class Vault {
    constructor() {
        this.entries = [];
        this.metadata = {
            version: '1.0',
            createdAt: null,
            lastUpdatedAt: null
        };
        this.masterKey = null;
        this.hmacKey = null;
        this.isLocked = true;
        this.DB_NAME = 'VaultGuardDB';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'vault';
    }

    /**
     * Initialize IndexedDB
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }

    /**
     * Check if vault exists
     */
    async vaultExists() {
        try {
            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get('vaultData');

            return new Promise((resolve) => {
                request.onsuccess = () => resolve(!!request.result);
                request.onerror = () => resolve(false);
            });
        } catch (error) {
            console.error('Error checking vault existence:', error);
            return false;
        }
    }

    /**
     * Create new vault with master password
     */
    async createVault(masterPassword, hint = '') {
        try {
            // Check if vault already exists
            const exists = await this.vaultExists();
            if (exists) {
                return { success: false, error: 'Vault already exists. Please unlock it or delete it first.' };
            }

            const salt = cryptoManager.generateSalt();
            this.masterKey = await cryptoManager.deriveKey(masterPassword, salt);
            this.hmacKey = await cryptoManager.deriveHMACKey(masterPassword, salt);

            this.entries = [];
            this.metadata = {
                version: '1.0',
                createdAt: new Date().toISOString(),
                lastUpdatedAt: new Date().toISOString(),
                hint: hint
            };

            await this.saveVault(salt);
            this.isLocked = false;
            return { success: true };
        } catch (error) {
            console.error('Vault creation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unlock vault with master password
     */
    async unlockVault(masterPassword) {
        try {
            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get('vaultData');

            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    try {
                        const vaultData = request.result;
                        if (!vaultData) {
                            reject(new Error('No vault found'));
                            return;
                        }

                        const salt = cryptoManager.base64ToArrayBuffer(vaultData.salt);
                        this.masterKey = await cryptoManager.deriveKey(masterPassword, new Uint8Array(salt));

                        // Derive HMAC key
                        this.hmacKey = await cryptoManager.deriveHMACKey(masterPassword, new Uint8Array(salt));

                        // Verify HMAC first
                        const isValid = await cryptoManager.verifyHMAC(
                            vaultData.ciphertext,
                            vaultData.hmac,
                            this.hmacKey
                        );

                        if (!isValid) {
                            reject(new Error('Vault integrity check failed - possible tampering detected'));
                            return;
                        }

                        // Decrypt vault
                        // Derive HMAC key
                        this.hmacKey = await cryptoManager.deriveHMACKey(masterPassword, cryptoManager.base64ToArrayBuffer(vaultData.salt));

                        const decrypted = await cryptoManager.decrypt(
                            vaultData.ciphertext,
                            vaultData.iv,
                            this.masterKey
                        );

                        const vaultContent = JSON.parse(decrypted);
                        this.entries = vaultContent.entries;
                        this.metadata = vaultContent.metadata;
                        this.isLocked = false;

                        resolve({ success: true, metadata: this.metadata });
                    } catch (error) {
                        reject(new Error('Wrong master password or corrupted vault'));
                    }
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Unlock error:', error);
            throw error;
        }
    }

    /**
     * Save vault to IndexedDB
     */
    async saveVault(salt = null) {
        try {
            if (!this.masterKey) {
                throw new Error('Vault is locked');
            }

            this.metadata.lastUpdatedAt = new Date().toISOString();

            const vaultContent = {
                entries: this.entries,
                metadata: this.metadata
            };

            const plaintext = JSON.stringify(vaultContent);
            const encrypted = await cryptoManager.encrypt(plaintext, this.masterKey);

            // Generate HMAC for integrity
            const hmac = await cryptoManager.generateHMAC(encrypted.ciphertext, this.hmacKey);

            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            // Get existing salt if not provided
            let saltToStore = salt;
            if (!saltToStore) {
                const existing = await new Promise((resolve) => {
                    const req = store.get('vaultData');
                    req.onsuccess = () => resolve(req.result);
                });
                saltToStore = existing ? cryptoManager.base64ToArrayBuffer(existing.salt) : cryptoManager.generateSalt();
            }

            const vaultData = {
                ciphertext: encrypted.ciphertext,
                iv: encrypted.iv,
                salt: cryptoManager.arrayBufferToBase64(saltToStore),
                hmac: hmac,
                timestamp: new Date().toISOString()
            };

            return new Promise((resolve, reject) => {
                const request = store.put(vaultData, 'vaultData');
                request.onsuccess = () => resolve({ success: true });
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Save vault error:', error);
            throw error;
        }
    }

    /**
     * Lock the vault
     */
    lockVault() {
        this.entries = [];
        this.metadata = { version: '1.0', createdAt: null, lastUpdatedAt: null };
        this.masterKey = null;
        this.isLocked = true;
    }

    /**
     * Add new entry
     */
    async addEntry(entry) {
        if (this.isLocked) throw new Error('Vault is locked');

        const newEntry = {
            id: this.generateId(),
            name: entry.name,
            username: entry.username,
            password: entry.password,
            url: entry.url || '',
            category: entry.category || 'Other',
            notes: entry.notes || '',
            createdAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString()
        };

        this.entries.push(newEntry);
        await this.saveVault();
        return newEntry;
    }

    /**
     * Update existing entry
     */
    async updateEntry(id, updates) {
        if (this.isLocked) throw new Error('Vault is locked');

        const index = this.entries.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Entry not found');

        // Only update lastUpdatedAt if password changed
        if (updates.password && updates.password !== this.entries[index].password) {
            updates.lastUpdatedAt = new Date().toISOString();
        }

        this.entries[index] = { ...this.entries[index], ...updates };
        await this.saveVault();
        return this.entries[index];
    }

    /**
     * Delete entry
     */
    async deleteEntry(id) {
        if (this.isLocked) throw new Error('Vault is locked');

        const index = this.entries.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Entry not found');

        this.entries.splice(index, 1);
        await this.saveVault();
        return { success: true };
    }

    /**
     * Get all entries
     */
    getEntries() {
        if (this.isLocked) return [];
        return [...this.entries];
    }

    /**
     * Get entry by ID
     */
    getEntry(id) {
        if (this.isLocked) return null;
        return this.entries.find(e => e.id === id);
    }

    /**
     * Search entries
     */
    searchEntries(query) {
        if (this.isLocked) return [];
        
        const lowerQuery = query.toLowerCase();
        return this.entries.filter(entry => 
            entry.name.toLowerCase().includes(lowerQuery) ||
            entry.username.toLowerCase().includes(lowerQuery) ||
            entry.url.toLowerCase().includes(lowerQuery) ||
            entry.notes.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Filter entries by category
     */
    filterByCategory(category) {
        if (this.isLocked) return [];
        if (category === 'All') return this.entries;
        return this.entries.filter(e => e.category === category);
    }

    /**
     * Sort entries
     */
    sortEntries(field, ascending = true) {
        if (this.isLocked) return [];
        
        const sorted = [...this.entries].sort((a, b) => {
            const aVal = a[field]?.toLowerCase() || '';
            const bVal = b[field]?.toLowerCase() || '';
            return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        
        return sorted;
    }

    /**
     * Export encrypted vault
     */
    async exportVault() {
        try {
            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get('vaultData');

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const vaultData = request.result;
                    if (!vaultData) {
                        reject(new Error('No vault data found'));
                        return;
                    }

                    const exportData = {
                        version: '1.0',
                        exportDate: new Date().toISOString(),
                        vault: vaultData
                    };

                    resolve(exportData);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    /**
     * Import encrypted vault
     */
    async importVault(importData, masterPassword) {
        try {
            if (!importData.vault) {
                throw new Error('Invalid import file');
            }

            // Try to decrypt with provided password to verify
            const salt = cryptoManager.base64ToArrayBuffer(importData.vault.salt);
            const tempKey = await cryptoManager.deriveKey(masterPassword, new Uint8Array(salt));
            const tempHMACKey = await cryptoManager.deriveHMACKey(masterPassword, new Uint8Array(salt));

            // Verify integrity
            const isValid = await cryptoManager.verifyHMAC(
                importData.vault.ciphertext,
                importData.vault.hmac,
                tempHMACKey
            );

            if (!isValid) {
                throw new Error('Import file integrity check failed');
            }

            // Verify we can decrypt
            await cryptoManager.decrypt(
                importData.vault.ciphertext,
                importData.vault.iv,
                tempKey
            );

            // Save to database
            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            return new Promise((resolve, reject) => {
                const request = store.put(importData.vault, 'vaultData');
                request.onsuccess = () => resolve({ success: true });
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Import error:', error);
            throw new Error('Failed to import vault - ' + error.message);
        }
    }

    /**
     * Get vault hint
     */
    async getHint() {
        try {
            const db = await this.initDB();
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get('vaultData');

            return new Promise(async (resolve) => {
                request.onsuccess = async () => {
                    const vaultData = request.result;
                    if (!vaultData) {
                        resolve('');
                        return;
                    }

                    // Try to extract hint from metadata (if stored separately)
                    // For now, return empty as hint might be in encrypted data
                    resolve('');
                };
                request.onerror = () => resolve('');
            });
        } catch (error) {
            return '';
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Export singleton instance
const vault = new Vault();
