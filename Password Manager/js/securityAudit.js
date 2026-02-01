/**
 * securityAudit.js - Security Audit and Analysis
 * Analyzes vault for weak, reused, old, and breached passwords
 */

class SecurityAudit {
    constructor() {
        this.OLD_PASSWORD_THRESHOLD = 90; // days
        this.weakPasswords = [];
        this.reusedPasswords = [];
        this.oldPasswords = [];
        this.breachedPasswords = [];
    }

    /**
     * Perform comprehensive security audit
     * @param {Array} entries - Vault entries
     * @returns {Promise<Object>}
     */
    async performAudit(entries) {
        if (!entries || entries.length === 0) {
            return this.getEmptyAuditResult();
        }

        // Reset results
        this.weakPasswords = [];
        this.reusedPasswords = [];
        this.oldPasswords = [];
        this.breachedPasswords = [];

        // Run all checks
        this.checkWeakPasswords(entries);
        this.checkReusedPasswords(entries);
        this.checkOldPasswords(entries);

        // Calculate overall score
        const score = this.calculateSecurityScore(entries.length);

        return {
            score: score,
            grade: this.getGrade(score),
            totalPasswords: entries.length,
            weakCount: this.weakPasswords.length,
            reusedCount: this.reusedPasswords.length,
            oldCount: this.oldPasswords.length,
            breachedCount: this.breachedPasswords.length,
            weakPasswords: this.weakPasswords,
            reusedPasswords: this.reusedPasswords,
            oldPasswords: this.oldPasswords,
            breachedPasswords: this.breachedPasswords,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Check for weak passwords
     */
    checkWeakPasswords(entries) {
        entries.forEach(entry => {
            const strength = passwordGenerator.calculateStrength(entry.password);
            if (strength.score < 3) { // Less than "Strong"
                this.weakPasswords.push({
                    id: entry.id,
                    name: entry.name,
                    username: entry.username,
                    strength: strength,
                    issue: 'Weak password'
                });
            }
        });
    }

    /**
     * Check for reused passwords
     */
    checkReusedPasswords(entries) {
        const passwordMap = new Map();

        // Count password occurrences
        entries.forEach(entry => {
            if (!passwordMap.has(entry.password)) {
                passwordMap.set(entry.password, []);
            }
            passwordMap.get(entry.password).push(entry);
        });

        // Find reused passwords
        passwordMap.forEach((entryList, password) => {
            if (entryList.length > 1) {
                entryList.forEach(entry => {
                    this.reusedPasswords.push({
                        id: entry.id,
                        name: entry.name,
                        username: entry.username,
                        issue: `Reused in ${entryList.length} accounts`,
                        reusedCount: entryList.length
                    });
                });
            }
        });
    }

    /**
     * Check for old passwords
     */
    checkOldPasswords(entries) {
        const now = new Date();

        entries.forEach(entry => {
            const lastUpdated = new Date(entry.lastUpdatedAt);
            const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

            if (daysSinceUpdate > this.OLD_PASSWORD_THRESHOLD) {
                this.oldPasswords.push({
                    id: entry.id,
                    name: entry.name,
                    username: entry.username,
                    daysSinceUpdate: daysSinceUpdate,
                    lastUpdated: entry.lastUpdatedAt,
                    issue: `Not changed in ${daysSinceUpdate} days`
                });
            }
        });
    }

    /**
     * Check specific password for breach
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async checkPasswordBreached(password) {
        return await passwordGenerator.checkBreached(password);
    }

    /**
     * Batch check passwords for breaches (with rate limiting)
     * @param {Array} entries
     * @returns {Promise<Array>}
     */
    async batchCheckBreaches(entries) {
        const results = [];
        const delay = 1500; // 1.5 second delay between requests to respect API rate limits

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            try {
                const result = await this.checkPasswordBreached(entry.password);
                
                if (result.breached) {
                    const breachedEntry = {
                        id: entry.id,
                        name: entry.name,
                        username: entry.username,
                        breachCount: result.count,
                        issue: `Found in ${result.count.toLocaleString()} breaches`
                    };
                    results.push(breachedEntry);
                    this.breachedPasswords.push(breachedEntry);
                }

                // Wait before next request (except for last one)
                if (i < entries.length - 1) {
                    await this.sleep(delay);
                }
            } catch (error) {
                console.error(`Breach check failed for ${entry.name}:`, error);
            }
        }

        return results;
    }

    /**
     * Calculate overall security score
     */
    calculateSecurityScore(totalPasswords) {
        if (totalPasswords === 0) return 100;

        let score = 100;

        // Deduct points for issues
        const weakPenalty = (this.weakPasswords.length / totalPasswords) * 30;
        const reusedPenalty = (this.reusedPasswords.length / totalPasswords) * 25;
        const oldPenalty = (this.oldPasswords.length / totalPasswords) * 20;
        const breachedPenalty = (this.breachedPasswords.length / totalPasswords) * 25;

        score -= weakPenalty;
        score -= reusedPenalty;
        score -= oldPenalty;
        score -= breachedPenalty;

        return Math.max(0, Math.round(score));
    }

    /**
     * Get letter grade from score
     */
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Generate recommendations based on audit
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.weakPasswords.length > 0) {
            recommendations.push({
                type: 'weak',
                priority: 'high',
                message: `${this.weakPasswords.length} weak password(s) detected`,
                action: 'Generate stronger passwords with at least 12 characters and mixed character types'
            });
        }

        if (this.reusedPasswords.length > 0) {
            recommendations.push({
                type: 'reused',
                priority: 'high',
                message: `${this.reusedPasswords.length} reused password(s) detected`,
                action: 'Use unique passwords for each account to prevent credential stuffing attacks'
            });
        }

        if (this.breachedPasswords.length > 0) {
            recommendations.push({
                type: 'breached',
                priority: 'critical',
                message: `${this.breachedPasswords.length} breached password(s) detected`,
                action: 'Change these passwords immediately - they have appeared in known data breaches'
            });
        }

        if (this.oldPasswords.length > 0) {
            recommendations.push({
                type: 'old',
                priority: 'medium',
                message: `${this.oldPasswords.length} old password(s) detected`,
                action: 'Consider updating passwords that haven\'t been changed in over 90 days'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: 'success',
                priority: 'info',
                message: 'Your password security looks great!',
                action: 'Keep monitoring and updating passwords regularly'
            });
        }

        return recommendations;
    }

    /**
     * Get statistics for dashboard
     */
    getStatistics(entries) {
        if (!entries || entries.length === 0) {
            return {
                total: 0,
                byCategory: {},
                averageStrength: 0,
                strongCount: 0
            };
        }

        const byCategory = {};
        let totalStrength = 0;
        let strongCount = 0;

        entries.forEach(entry => {
            // Count by category
            if (!byCategory[entry.category]) {
                byCategory[entry.category] = 0;
            }
            byCategory[entry.category]++;

            // Calculate strength
            const strength = passwordGenerator.calculateStrength(entry.password);
            totalStrength += strength.score;
            if (strength.score >= 3) {
                strongCount++;
            }
        });

        return {
            total: entries.length,
            byCategory: byCategory,
            averageStrength: totalStrength / entries.length,
            strongCount: strongCount,
            strongPercentage: Math.round((strongCount / entries.length) * 100)
        };
    }

    /**
     * Get empty audit result
     */
    getEmptyAuditResult() {
        return {
            score: 100,
            grade: 'A',
            totalPasswords: 0,
            weakCount: 0,
            reusedCount: 0,
            oldCount: 0,
            breachedCount: 0,
            weakPasswords: [],
            reusedPasswords: [],
            oldPasswords: [],
            breachedPasswords: [],
            recommendations: [{
                type: 'info',
                priority: 'info',
                message: 'No passwords to audit yet',
                action: 'Start adding passwords to your vault'
            }]
        };
    }

    /**
     * Helper: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const securityAudit = new SecurityAudit();
