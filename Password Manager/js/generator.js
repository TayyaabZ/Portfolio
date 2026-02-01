/**
 * generator.js - Password Generator and Strength Meter
 * Generates secure personalized passwords and evaluates password strength
 */

class PasswordGenerator {
    constructor() {
        this.defaultLength = 16;
        this.minLength = 8;
        this.maxLength = 64;
    }

    /**
     * Generate a personalized password
     * @param {Object} options - Generation options
     * @returns {string}
     */
    generate(options = {}) {
        const {
            length = this.defaultLength,
            uppercase = true,
            lowercase = true,
            digits = true,
            symbols = true,
            personalWords = []
        } = options;

        if (length < this.minLength || length > this.maxLength) {
            throw new Error(`Length must be between ${this.minLength} and ${this.maxLength}`);
        }

        // If no character types selected, use all
        if (!uppercase && !lowercase && !digits && !symbols) {
            options.uppercase = options.lowercase = options.digits = options.symbols = true;
        }

        let password = '';

        // If personal words provided, incorporate them
        if (personalWords && personalWords.length > 0) {
            password = this.incorporatePersonalWords(personalWords, length, options);
        } else {
            password = cryptoManager.generateSecureRandom(length, options);
        }

        // Ensure password meets requirements
        password = this.ensureRequirements(password, options);

        return password;
    }

    /**
     * Incorporate personal words into password
     */
    incorporatePersonalWords(words, totalLength, options) {
        // Filter and clean words
        const cleanWords = words
            .filter(w => w && w.trim())
            .map(w => w.trim());

        if (cleanWords.length === 0) {
            return cryptoManager.generateSecureRandom(totalLength, options);
        }

        // Combine words with separators for better structure
        let baseWord = cleanWords.join('');
        
        // Transform the word while keeping it recognizable
        baseWord = this.transformWordRecognizable(baseWord, options);

        // Calculate how many extra characters we need
        const baseLength = baseWord.length;
        
        if (baseLength >= totalLength) {
            // If base word is already long enough, just return it (trimmed if needed)
            return baseWord.substring(0, totalLength);
        }

        // Need to add more characters
        const remaining = totalLength - baseLength;
        
        // Add suffix: numbers and/or symbols
        let suffix = '';
        
        // Add random digits
        const digitCount = Math.ceil(remaining / 2);
        for (let i = 0; i < digitCount && suffix.length < remaining; i++) {
            const randomValues = crypto.getRandomValues(new Uint8Array(1));
            suffix += randomValues[0] % 10;
        }
        
        // Add symbols if needed and enabled
        if (options.symbols && suffix.length < remaining) {
            const symbols = '!@#$%^&*';
            const randomValues = crypto.getRandomValues(new Uint8Array(remaining - suffix.length));
            for (let i = 0; i < randomValues.length; i++) {
                suffix += symbols[randomValues[i] % symbols.length];
            }
        } else if (suffix.length < remaining) {
            // Add more digits if no symbols
            const randomValues = crypto.getRandomValues(new Uint8Array(remaining - suffix.length));
            for (let i = 0; i < randomValues.length; i++) {
                suffix += randomValues[i] % 10;
            }
        }

        // Combine: base word + suffix
        return baseWord + suffix;
    }

    /**
     * Transform word while keeping it recognizable
     */
    transformWordRecognizable(word, options) {
        let transformed = word;

        // Apply leetspeak substitutions to some letters
        const substitutions = {
            'a': '@',
            'A': '@',
            'e': '3',
            'E': '3',
            'i': '1',
            'I': '1',
            'o': '0',
            'O': '0',
            's': '$',
            'S': '$',
            't': '7',
            'T': '7'
        };

        const chars = transformed.split('');
        const randomValues = crypto.getRandomValues(new Uint8Array(chars.length));
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            // Apply substitution to about 40% of eligible characters
            if (substitutions[char] && randomValues[i] % 10 < 4) {
                chars[i] = substitutions[char];
            }
        }

        transformed = chars.join('');

        // Apply random capitalization if uppercase is enabled
        if (options.uppercase && options.lowercase) {
            transformed = this.mixedCaseRecognizable(transformed);
        } else if (options.uppercase) {
            transformed = transformed.toUpperCase();
        } else if (options.lowercase) {
            transformed = transformed.toLowerCase();
        }

        return transformed;
    }

    /**
     * Apply mixed case while keeping it somewhat predictable
     */
    mixedCaseRecognizable(str) {
        const chars = str.split('');
        
        for (let i = 0; i < chars.length; i++) {
            // Capitalize every 2nd or 3rd character pattern
            if (i % 2 === 1 || i % 3 === 0) {
                chars[i] = chars[i].toUpperCase();
            } else {
                chars[i] = chars[i].toLowerCase();
            }
        }

        return chars.join('');
    }

    /**
     * Shuffle string characters
     */
    shuffleString(str) {
        const array = str.split('');
        const randomValues = crypto.getRandomValues(new Uint8Array(array.length));
        
        for (let i = array.length - 1; i > 0; i--) {
            const j = randomValues[i] % (i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        return array.join('');
    }

    /**
     * Ensure password meets character requirements
     */
    ensureRequirements(password, options) {
        let result = password;
        const chars = result.split('');

        if (options.uppercase && !/[A-Z]/.test(result)) {
            const pos = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
            chars[pos] = String.fromCharCode(65 + (crypto.getRandomValues(new Uint8Array(1))[0] % 26));
        }

        if (options.lowercase && !/[a-z]/.test(result)) {
            const pos = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
            chars[pos] = String.fromCharCode(97 + (crypto.getRandomValues(new Uint8Array(1))[0] % 26));
        }

        if (options.digits && !/[0-9]/.test(result)) {
            const pos = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
            chars[pos] = String.fromCharCode(48 + (crypto.getRandomValues(new Uint8Array(1))[0] % 10));
        }

        if (options.symbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result)) {
            const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const pos = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
            chars[pos] = symbols[crypto.getRandomValues(new Uint8Array(1))[0] % symbols.length];
        }

        return chars.join('');
    }

    /**
     * Calculate password strength
     * @param {string} password
     * @returns {Object} - { score: 0-4, label: string, feedback: array }
     */
    calculateStrength(password) {
        if (!password) {
            return { score: 0, label: 'Too weak', percentage: 0, feedback: ['Enter a password'] };
        }

        let score = 0;
        const feedback = [];

        // Length scoring (0-4 points)
        const length = password.length;
        if (length < 8) {
            feedback.push('Use at least 8 characters');
            score = 0;
        } else if (length >= 8 && length < 12) {
            score += 1;
        } else if (length >= 12 && length < 16) {
            score += 2;
        } else if (length >= 16 && length < 20) {
            score += 3;
        } else {
            score += 4; // 20+ characters
        }

        // Character variety (0-4 points)
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/\\]/.test(password);

        let varietyCount = 0;
        if (hasLower) varietyCount++;
        if (hasUpper) varietyCount++;
        if (hasDigit) varietyCount++;
        if (hasSymbol) varietyCount++;

        if (varietyCount < 2) {
            feedback.push('Use a mix of character types');
            score += 0;
        } else if (varietyCount === 2) {
            score += 1;
        } else if (varietyCount === 3) {
            score += 2;
        } else if (varietyCount === 4) {
            score += 3;
        }

        // Check for patterns (deductions)
        if (this.hasCommonPatterns(password)) {
            score = Math.max(0, score - 2);
            feedback.push('Avoid common patterns');
        }

        // Check for repeated characters (deductions)
        if (this.hasRepeatedCharacters(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Avoid repeated characters');
        }

        // Check for sequential characters (deductions)
        if (this.hasSequentialCharacters(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Avoid sequential characters');
        }

        // Entropy bonus (0-2 points)
        const entropy = this.calculateEntropy(password);
        if (entropy < 28) {
            score = Math.max(0, score - 1);
        } else if (entropy >= 60) {
            score = Math.min(score + 2, 10); // Bonus for high entropy
        } else if (entropy >= 50) {
            score = Math.min(score + 1, 10);
        }

        // Map total score (0-10) to strength level (0-4)
        let finalScore;
        if (score <= 2) {
            finalScore = 0; // Too weak
        } else if (score <= 4) {
            finalScore = 1; // Weak
        } else if (score <= 6) {
            finalScore = 2; // Fair
        } else if (score <= 8) {
            finalScore = 3; // Strong
        } else {
            finalScore = 4; // Very strong
        }

        const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
        const percentages = [0, 25, 50, 75, 100];

        if (feedback.length === 0) {
            feedback.push('Great password!');
        }

        return {
            score: finalScore,
            label: labels[finalScore],
            percentage: percentages[finalScore],
            feedback: feedback,
            entropy: Math.round(entropy)
        };
    }

    /**
     * Calculate password entropy
     */
    calculateEntropy(password) {
        let charsetSize = 0;
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/[0-9]/.test(password)) charsetSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

        if (charsetSize === 0) return 0;

        return password.length * Math.log2(charsetSize);
    }

    /**
     * Check for common patterns
     */
    hasCommonPatterns(password) {
        const commonPatterns = [
            /password/i,
            /12345/,
            /qwerty/i,
            /abc123/i,
            /admin/i,
            /letmein/i,
            /welcome/i,
            /monkey/i,
            /dragon/i,
            /master/i
        ];

        return commonPatterns.some(pattern => pattern.test(password));
    }

    /**
     * Check for repeated characters
     */
    hasRepeatedCharacters(password) {
        return /(.)\1{2,}/.test(password);
    }

    /**
     * Check for sequential characters
     */
    hasSequentialCharacters(password) {
        const lower = password.toLowerCase();
        const sequences = [
            'abcdefghijklmnopqrstuvwxyz',
            '0123456789',
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm'
        ];

        for (const seq of sequences) {
            for (let i = 0; i < seq.length - 2; i++) {
                const pattern = seq.substring(i, i + 3);
                const reversePattern = pattern.split('').reverse().join('');
                if (lower.includes(pattern) || lower.includes(reversePattern)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check password against Have I Been Pwned API
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async checkBreached(password) {
        try {
            // Hash the password with SHA-1
            const hash = await cryptoManager.sha1Hash(password);
            const hashUpper = hash.toUpperCase();
            const prefix = hashUpper.substring(0, 5);
            const suffix = hashUpper.substring(5);

            // Call HIBP API with k-anonymity
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            
            if (!response.ok) {
                throw new Error('Failed to contact breach database');
            }

            const text = await response.text();
            const lines = text.split('\n');

            // Check if our suffix is in the results
            for (const line of lines) {
                const [hashSuffix, count] = line.split(':');
                if (hashSuffix === suffix) {
                    return {
                        breached: true,
                        count: parseInt(count.trim(), 10)
                    };
                }
            }

            return { breached: false, count: 0 };
        } catch (error) {
            console.error('Breach check error:', error);
            return { breached: null, error: error.message };
        }
    }
}

// Export singleton instance
const passwordGenerator = new PasswordGenerator();
