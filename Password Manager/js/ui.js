/**
 * ui.js - UI Rendering and DOM Manipulation
 * Handles all user interface updates and interactions
 */

class UI {
    constructor() {
        this.currentView = 'welcome';
        this.currentFilter = 'All';
        this.currentSort = { field: 'name', ascending: true };
        this.editingEntryId = null;
        this.clipboardTimeout = null;
        this.CLIPBOARD_CLEAR_TIME = 30000; // 30 seconds
        this.originalTitle = document.title;
        this.titleBlinkInterval = null;
        this.requestNotificationPermission();
    }

    /**
     * Request browser notification permission
     */
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    /**
     * Send browser notification
     */
    sendBrowserNotification(title, body, urgent = false) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '🔒',
                badge: '⚠️',
                requireInteraction: urgent,
                tag: 'clipboard-warning'
            });

            // Play sound for urgent notifications
            if (urgent) {
                this.playAlertSound();
            }

            // Auto-close after 10 seconds if not urgent
            if (!urgent) {
                setTimeout(() => notification.close(), 10000);
            }
        }
    }

    /**
     * Play alert sound
     */
    playAlertSound() {
        // Create a simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio playback not supported');
        }
    }

    /**
     * Start blinking page title
     */
    startTitleBlink(warningText) {
        if (this.titleBlinkInterval) {
            clearInterval(this.titleBlinkInterval);
        }

        let showWarning = true;
        this.titleBlinkInterval = setInterval(() => {
            document.title = showWarning ? '⚠️ ' + warningText : this.originalTitle;
            showWarning = !showWarning;
        }, 1000);
    }

    /**
     * Stop blinking page title
     */
    stopTitleBlink() {
        if (this.titleBlinkInterval) {
            clearInterval(this.titleBlinkInterval);
            this.titleBlinkInterval = null;
        }
        document.title = this.originalTitle;
    }

    /**
     * Show a specific view
     */
    showView(viewName) {
        // Hide all views in main app
        const views = document.querySelectorAll('.views-container .view');
        views.forEach(view => view.classList.remove('active'));

        // Show requested view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // Update view title
        const viewTitle = document.getElementById('view-title');
        if (viewTitle) {
            const titles = {
                'vault': 'Vault',
                'generator': 'Password Generator',
                'audit': 'Security Audit',
                'backup': 'Backup & Restore',
                'settings': 'Settings'
            };
            viewTitle.textContent = titles[viewName] || 'Vault';
        }

        // Update nav active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Load view-specific data
        this.loadViewData(viewName);
    }

    /**
     * Load data for specific view
     */
    async loadViewData(viewName) {
        switch (viewName) {
            case 'vault':
                this.renderVaultList();
                break;
            case 'generator':
                // Auto-generate a password on view load
                if (typeof app !== 'undefined' && app.generatePassword) {
                    app.generatePassword();
                }
                break;
            case 'audit':
                await this.renderSecurityAudit();
                break;
            case 'backup':
                // Backup view is static
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    /**
     * Render vault list
     */
    renderVaultList() {
        const container = document.getElementById('vault-list');
        if (!container) return;

        // Check if vault is locked
        if (vault.isLocked) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔒</div>
                    <h3>Vault is locked</h3>
                    <p>Unlock your vault to view passwords</p>
                </div>
            `;
            return;
        }

        let entries = vault.getEntries();

        // Apply filter
        if (this.currentFilter !== 'All') {
            entries = entries.filter(e => e.category === this.currentFilter);
        }

        // Apply sort
        entries = this.sortEntries(entries);

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔐</div>
                    <h3>No passwords yet</h3>
                    <p>Click "Add New Entry" to get started</p>
                </div>
            `;
            return;
        }

        // Group by category
        const grouped = this.groupByCategory(entries);

        let html = '';
        for (const [category, categoryEntries] of Object.entries(grouped)) {
            html += `
                <div class="category-group">
                    <h3 class="category-header">${category}</h3>
                    <div class="entries-grid">
                        ${categoryEntries.map(entry => this.renderEntryCard(entry)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Render single entry card
     */
    renderEntryCard(entry) {
        const initial = entry.name.charAt(0).toUpperCase();
        const strength = passwordGenerator.calculateStrength(entry.password);
        const age = this.getPasswordAge(entry.lastUpdatedAt);

        return `
            <div class="entry-card" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <div class="entry-icon">${initial}</div>
                    <div class="entry-info">
                        <h4 class="entry-name">${this.escapeHtml(entry.name)}</h4>
                        <p class="entry-username">${this.escapeHtml(entry.username)}</p>
                    </div>
                </div>
                <div class="entry-details">
                    ${entry.url ? `<a href="${this.escapeHtml(entry.url)}" target="_blank" class="entry-url" onclick="event.stopPropagation()">${this.escapeHtml(entry.url)}</a>` : ''}
                    <div class="password-field">
                        <input type="password" value="${this.escapeHtml(entry.password)}" readonly class="password-display" id="pwd-${entry.id}">
                        <button class="icon-btn toggle-password" onclick="ui.togglePassword('${entry.id}')" title="Show/Hide">
                            <span class="icon">👁️</span>
                        </button>
                    </div>
                    <div class="entry-meta">
                        <span class="strength-badge strength-${strength.score}">${strength.label}</span>
                        <span class="age-badge ${age.old ? 'old' : ''}">${age.text}</span>
                    </div>
                </div>
                <div class="entry-actions">
                    <button class="btn-icon" onclick="ui.copyToClipboard('${entry.id}', 'username')" title="Copy Username">
                        <span class="icon">👤</span>
                    </button>
                    <button class="btn-icon" onclick="ui.copyToClipboard('${entry.id}', 'password')" title="Copy Password">
                        <span class="icon">📋</span>
                    </button>
                    <button class="btn-icon" onclick="ui.editEntry('${entry.id}')" title="Edit">
                        <span class="icon">✏️</span>
                    </button>
                    <button class="btn-icon btn-danger" onclick="ui.deleteEntry('${entry.id}')" title="Delete">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Group entries by category
     */
    groupByCategory(entries) {
        const grouped = {};
        entries.forEach(entry => {
            const category = entry.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(entry);
        });
        return grouped;
    }

    /**
     * Sort entries
     */
    sortEntries(entries) {
        return [...entries].sort((a, b) => {
            const aVal = (a[this.currentSort.field] || '').toLowerCase();
            const bVal = (b[this.currentSort.field] || '').toLowerCase();
            const comparison = aVal.localeCompare(bVal);
            return this.currentSort.ascending ? comparison : -comparison;
        });
    }

    /**
     * Toggle password visibility
     */
    togglePassword(entryId) {
        const input = document.getElementById(`pwd-${entryId}`);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    /**
     * Copy to clipboard with auto-clear
     */
    async copyToClipboard(entryId, field) {
        const entry = vault.getEntry(entryId);
        if (!entry) return;

        const value = field === 'password' ? entry.password : entry.username;

        try {
            await navigator.clipboard.writeText(value);
            
            const label = field === 'password' ? 'Password' : 'Username';
            this.showNotification(`${label} copied to clipboard`, 'success');

            // Auto-clear for passwords
            if (field === 'password') {
                if (this.clipboardTimeout) {
                    clearTimeout(this.clipboardTimeout);
                }
                if (this.clipboardCountdown) {
                    clearInterval(this.clipboardCountdown);
                }
                
                this.clipboardTimeout = setTimeout(() => {
                    this.showNotification('⚠️ SECURITY: Password still in clipboard! Clear it manually!', 'error', 10000);
                    
                    // Send browser notification
                    this.sendBrowserNotification(
                        '🔐 VaultGuard Security Alert',
                        'Password still in clipboard! Please clear it manually.',
                        true
                    );

                    // Start blinking page title
                    this.startTitleBlink('CLEAR CLIPBOARD!');
                    
                    this.showClipboardWarning();
                }, this.CLIPBOARD_CLEAR_TIME);

                this.showNotification(`⚠️ Remember to clear clipboard after use! Auto-reminder in ${this.CLIPBOARD_CLEAR_TIME / 1000}s`, 'warning', 4000);
            }
        } catch (error) {
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    /**
     * Show add/edit entry modal
     */
    showEntryModal(entryId = null) {
        this.editingEntryId = entryId;
        const modal = document.getElementById('entry-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('entry-form');

        if (entryId) {
            // Edit mode
            const entry = vault.getEntry(entryId);
            if (!entry) return;

            title.textContent = 'Edit Entry';
            document.getElementById('entry-name').value = entry.name;
            document.getElementById('entry-username').value = entry.username;
            document.getElementById('entry-password').value = entry.password;
            document.getElementById('entry-url').value = entry.url;
            document.getElementById('entry-category').value = entry.category;
            document.getElementById('entry-notes').value = entry.notes;
        } else {
            // Add mode
            title.textContent = 'Add New Entry';
            form.reset();
        }

        modal.classList.add('active');
        this.updatePasswordStrength();
    }

    /**
     * Hide entry modal
     */
    hideEntryModal() {
        const modal = document.getElementById('entry-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.editingEntryId = null;
        
        // Clear breach result
        const breachResult = document.getElementById('breach-result');
        if (breachResult) {
            breachResult.innerHTML = '';
        }

        // Hide generated password display
        const generatedPasswordDisplay = document.getElementById('generated-password-display');
        if (generatedPasswordDisplay) {
            generatedPasswordDisplay.style.display = 'none';
        }

        // Clear clipboard timer
        const clipboardTimer = document.getElementById('clipboard-timer');
        if (clipboardTimer) {
            clipboardTimer.textContent = '';
        }

        // Clear any active clipboard timeouts
        if (this.clipboardTimeout) {
            clearTimeout(this.clipboardTimeout);
            this.clipboardTimeout = null;
        }
        if (this.clipboardCountdown) {
            clearInterval(this.clipboardCountdown);
            this.clipboardCountdown = null;
        }

        // Stop title blinking
        this.stopTitleBlink();
    }

    /**
     * Save entry from modal
     */
    async saveEntry() {
        const name = document.getElementById('entry-name').value.trim();
        const username = document.getElementById('entry-username').value.trim();
        const password = document.getElementById('entry-password').value;
        const url = document.getElementById('entry-url').value.trim();
        const category = document.getElementById('entry-category').value;
        const notes = document.getElementById('entry-notes').value.trim();

        if (!name || !username || !password) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const entryData = { name, username, password, url, category, notes };

            if (this.editingEntryId) {
                await vault.updateEntry(this.editingEntryId, entryData);
                this.showNotification('Entry updated successfully', 'success');
            } else {
                await vault.addEntry(entryData);
                this.showNotification('Entry added successfully', 'success');
            }

            this.hideEntryModal();
            this.renderVaultList();
        } catch (error) {
            console.error('Save entry error:', error);
            this.showNotification('Failed to save entry: ' + error.message, 'error');
        }
    }

    /**
     * Edit entry
     */
    editEntry(entryId) {
        this.showEntryModal(entryId);
    }

    /**
     * Delete entry
     */
    async deleteEntry(entryId) {
        const entry = vault.getEntry(entryId);
        if (!entry) return;

        if (confirm(`Delete "${entry.name}"? This cannot be undone.`)) {
            try {
                await vault.deleteEntry(entryId);
                this.showNotification('Entry deleted successfully', 'success');
                this.renderVaultList();
            } catch (error) {
                this.showNotification('Failed to delete entry: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update password strength meter
     */
    updatePasswordStrength() {
        const passwordInput = document.getElementById('entry-password');
        const strengthMeter = document.getElementById('strength-meter');
        const strengthText = document.getElementById('strength-text');
        const strengthBar = strengthMeter?.querySelector('.strength-bar-fill');

        if (!passwordInput || !strengthMeter) return;

        const password = passwordInput.value;
        const strength = passwordGenerator.calculateStrength(password);

        strengthBar.style.width = strength.percentage + '%';
        strengthBar.className = `strength-bar-fill strength-${strength.score}`;
        strengthText.textContent = `${strength.label} (${strength.entropy} bits)`;
    }

    /**
     * Generate password in modal
     */
    generatePasswordInModal() {
        const length = parseInt(document.getElementById('gen-length')?.value || 16);
        const uppercase = document.getElementById('gen-uppercase')?.checked ?? true;
        const lowercase = document.getElementById('gen-lowercase')?.checked ?? true;
        const digits = document.getElementById('gen-digits')?.checked ?? true;
        const symbols = document.getElementById('gen-symbols')?.checked ?? true;

        const password = passwordGenerator.generate({
            length, uppercase, lowercase, digits, symbols
        });

        const passwordInput = document.getElementById('entry-password');
        if (passwordInput) {
            passwordInput.value = password;
            passwordInput.type = 'text'; // Show password when generated
            this.updatePasswordStrength();
        }

        // Show the generated password display
        const displayBox = document.getElementById('generated-password-display');
        const displayText = document.getElementById('generated-password-text');
        if (displayBox && displayText) {
            displayText.textContent = password;
            displayBox.style.display = 'block';
        }

        this.showNotification('Password generated! Click Copy to use it.', 'success');
    }

    /**
     * Copy generated password to clipboard with auto-clear
     */
    async copyGeneratedPasswordToClipboard() {
        const passwordText = document.getElementById('generated-password-text')?.textContent;
        if (!passwordText) return;

        try {
            await navigator.clipboard.writeText(passwordText);
            this.showNotification('Password copied to clipboard!', 'success');

            // Clear any existing timeout
            if (this.clipboardTimeout) {
                clearTimeout(this.clipboardTimeout);
            }
            if (this.clipboardCountdown) {
                clearInterval(this.clipboardCountdown);
            }

            // Show countdown timer
            const timerDisplay = document.getElementById('clipboard-timer');
            if (timerDisplay) {
                let secondsLeft = 30;
                timerDisplay.textContent = `⏱ Password in clipboard - Please clear manually after use (${secondsLeft}s)`;
                timerDisplay.style.color = 'var(--warning)';
                
                const countdownInterval = setInterval(() => {
                    secondsLeft--;
                    if (secondsLeft > 0) {
                        timerDisplay.textContent = `⏱ Password in clipboard - Please clear manually after use (${secondsLeft}s)`;
                    } else {
                        timerDisplay.textContent = '⚠️ SECURITY WARNING: Password still in clipboard! Clear it manually now!';
                        timerDisplay.style.color = 'var(--error)';
                        timerDisplay.style.fontWeight = 'bold';
                        clearInterval(countdownInterval);
                    }
                }, 1000);

                // Store interval so we can clear it if needed
                this.clipboardCountdown = countdownInterval;
            }

            // After 30 seconds, show prominent warning
            this.clipboardTimeout = setTimeout(() => {
                this.showNotification('⚠️ SECURITY WARNING: Password still in clipboard! Clear it manually!', 'error', 10000);
                
                // Send browser notification
                this.sendBrowserNotification(
                    '🔐 VaultGuard Security Alert',
                    'Password still in clipboard! Please clear it manually for security.',
                    true // urgent
                );

                // Start blinking page title
                this.startTitleBlink('CLEAR CLIPBOARD!');
                
                // Also show a modal warning
                this.showClipboardWarning();
            }, 30000);

        } catch (error) {
            console.error('Copy to clipboard error:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    /**
     * Show prominent clipboard warning modal
     */
    showClipboardWarning() {
        // Create warning overlay if it doesn't exist
        let warningOverlay = document.getElementById('clipboard-warning-overlay');
        
        if (!warningOverlay) {
            warningOverlay = document.createElement('div');
            warningOverlay.id = 'clipboard-warning-overlay';
            warningOverlay.innerHTML = `
                <div class="clipboard-warning-modal">
                    <div class="warning-icon">⚠️</div>
                    <h2>Security Warning</h2>
                    <p>Your password is still in the clipboard!</p>
                    <p><strong>For security, please clear your clipboard manually:</strong></p>
                    <ul>
                        <li>Copy some other text, OR</li>
                        <li>Press Ctrl+C on empty space, OR</li>
                        <li>Restart your browser</li>
                    </ul>
                    <button id="clipboard-warning-dismiss" class="btn btn-primary btn-lg">I Understand - Dismiss</button>
                </div>
            `;
            document.body.appendChild(warningOverlay);

            // Add dismiss handler
            document.getElementById('clipboard-warning-dismiss').addEventListener('click', () => {
                warningOverlay.remove();
                this.stopTitleBlink();
            });

            // Add page visibility listener to stop blinking when user returns
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && warningOverlay.style.display === 'flex') {
                    // User returned to page and warning is visible
                    this.stopTitleBlink();
                }
            });
        }

        warningOverlay.style.display = 'flex';
        
        // Stop blinking when modal is shown (user is back on page)
        if (!document.hidden) {
            this.stopTitleBlink();
        }
    }

    /**
     * Clear clipboard using multiple methods
     */
    async clearClipboard() {
        // Since browser restrictions prevent reliable clearing,
        // just show the warning to user
        this.showNotification('⚠️ Please clear your clipboard manually for security', 'warning', 5000);
    }

    /**
     * Check password breach in modal
     */
    async checkPasswordBreach() {
        const passwordInput = document.getElementById('entry-password');
        const breachResult = document.getElementById('breach-result');
        
        if (!passwordInput || !breachResult) return;

        const password = passwordInput.value;
        if (!password) {
            breachResult.innerHTML = '<p class="breach-info">Enter a password first</p>';
            return;
        }

        breachResult.innerHTML = '<p class="breach-checking">Checking...</p>';

        try {
            const result = await passwordGenerator.checkBreached(password);

            if (result.breached) {
                breachResult.innerHTML = `
                    <p class="breach-found">⚠️ This password appears in ${result.count.toLocaleString()} known data breaches!</p>
                `;
            } else {
                breachResult.innerHTML = `
                    <p class="breach-safe">✅ This password does not appear in known breaches</p>
                `;
            }
        } catch (error) {
            breachResult.innerHTML = `<p class="breach-error">Failed to check: ${error.message}</p>`;
        }
    }

    /**
     * Render security audit
     */
    async renderSecurityAudit(checkBreaches = false) {
        const container = document.getElementById('audit-content');
        if (!container) return;

        container.innerHTML = '<div class="loading">Analyzing vault security...</div>';

        try {
            const entries = vault.getEntries();
            
            // If vault is locked, show message
            if (vault.isLocked) {
                container.innerHTML = '<div class="empty-state"><p>Unlock vault to view security audit</p></div>';
                return;
            }
            
            const audit = await securityAudit.performAudit(entries);

            // Optionally check for breaches
            if (checkBreaches && entries.length > 0) {
                const breachBtn = document.getElementById('check-breaches-btn');
                if (breachBtn) {
                    breachBtn.disabled = true;
                    breachBtn.textContent = 'Checking...';
                }

                await securityAudit.batchCheckBreaches(entries);
                audit.breachedCount = securityAudit.breachedPasswords.length;
                audit.breachedPasswords = securityAudit.breachedPasswords;
                audit.score = securityAudit.calculateSecurityScore(entries.length);
                audit.grade = securityAudit.getGrade(audit.score);
                audit.recommendations = securityAudit.generateRecommendations();
            }

            container.innerHTML = this.renderAuditReport(audit);
        } catch (error) {
            container.innerHTML = `<div class="error">Failed to generate audit: ${error.message}</div>`;
        }
    }

    /**
     * Render audit report HTML
     */
    renderAuditReport(audit) {
        return `
            <div class="audit-score">
                <div class="score-circle score-${audit.grade.toLowerCase()}">
                    <div class="score-value">${audit.score}</div>
                    <div class="score-label">Security Score</div>
                </div>
                <div class="score-grade">Grade: ${audit.grade}</div>
            </div>

            <div class="audit-summary">
                <div class="audit-stat">
                    <div class="stat-value">${audit.weakCount}</div>
                    <div class="stat-label">Weak</div>
                </div>
                <div class="audit-stat">
                    <div class="stat-value">${audit.reusedCount}</div>
                    <div class="stat-label">Reused</div>
                </div>
                <div class="audit-stat">
                    <div class="stat-value">${audit.oldCount}</div>
                    <div class="stat-label">Old</div>
                </div>
                <div class="audit-stat">
                    <div class="stat-value">${audit.breachedCount}</div>
                    <div class="stat-label">Breached</div>
                </div>
            </div>

            <div class="audit-recommendations">
                <h3>Recommendations</h3>
                ${audit.recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <strong>${rec.message}</strong>
                        <p>${rec.action}</p>
                    </div>
                `).join('')}
            </div>

            <div class="audit-details">
                ${this.renderAuditSection('Weak Passwords', audit.weakPasswords, 'weak')}
                ${this.renderAuditSection('Reused Passwords', audit.reusedPasswords, 'reused')}
                ${this.renderAuditSection('Old Passwords', audit.oldPasswords, 'old')}
                ${this.renderAuditSection('Breached Passwords', audit.breachedPasswords, 'breached')}
            </div>

            ${audit.breachedCount === 0 && audit.totalPasswords > 0 ? `
                <button class="btn btn-primary" id="check-breaches-btn" onclick="ui.checkAllBreaches()">
                    Check All for Breaches
                </button>
            ` : ''}
        `;
    }

    /**
     * Render audit section
     */
    renderAuditSection(title, items, type) {
        if (items.length === 0) return '';

        return `
            <div class="audit-section">
                <h4>${title} (${items.length})</h4>
                <div class="audit-items">
                    ${items.map(item => `
                        <div class="audit-item">
                            <div class="audit-item-info">
                                <strong>${this.escapeHtml(item.name)}</strong>
                                <span>${this.escapeHtml(item.username)}</span>
                                <span class="issue-badge">${this.escapeHtml(item.issue)}</span>
                            </div>
                            <button class="btn btn-sm" onclick="ui.editEntry('${item.id}')">Fix</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Check all passwords for breaches
     */
    async checkAllBreaches() {
        await this.renderSecurityAudit(true);
    }

    /**
     * Search vault
     */
    searchVault() {
        const query = document.getElementById('search-input')?.value || '';
        
        if (!query || vault.isLocked) {
            this.renderVaultList();
            return;
        }

        const container = document.getElementById('vault-list');
        if (!container) return;
        
        const results = vault.searchEntries(query);

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="category-group">
                <h3 class="category-header">Search Results (${results.length})</h3>
                <div class="entries-grid">
                    ${results.map(entry => this.renderEntryCard(entry)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Apply filter
     */
    applyFilter(category) {
        this.currentFilter = category;
        this.renderVaultList();
    }

    /**
     * Export vault
     */
    async exportVault() {
        if (vault.isLocked) {
            this.showNotification('Please unlock vault first', 'error');
            return;
        }
        
        try {
            const exportData = await vault.exportVault();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vaultguard-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Vault exported successfully', 'success');
        } catch (error) {
            this.showNotification('Export failed: ' + error.message, 'error');
        }
    }

    /**
     * Import vault
     */
    async importVault(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            const password = prompt('Enter master password for this backup:');
            if (!password) return;

            await vault.importVault(importData, password);
            this.showNotification('Vault imported successfully. Please reload the page.', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            this.showNotification('Import failed: ' + error.message, 'error');
        }
    }

    /**
     * Get password age
     */
    getPasswordAge(lastUpdated) {
        const now = new Date();
        const updated = new Date(lastUpdated);
        const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

        if (days === 0) return { text: 'Today', old: false };
        if (days === 1) return { text: '1 day ago', old: false };
        if (days < 30) return { text: `${days} days ago`, old: false };
        if (days < 90) return { text: `${Math.floor(days / 30)} months ago`, old: false };
        
        return { text: `${Math.floor(days / 30)} months ago`, old: true };
    }

    /**
     * Load settings
     */
    loadSettings() {
        const autoLock = localStorage.getItem('autoLockMinutes') || '5';
        const theme = localStorage.getItem('theme') || 'dark';
        
        const autoLockInput = document.getElementById('auto-lock-time');
        if (autoLockInput) autoLockInput.value = autoLock;
        
        this.applyTheme(theme);
    }

    /**
     * Save settings
     */
    saveSettings() {
        const autoLock = document.getElementById('auto-lock-time')?.value || '5';
        localStorage.setItem('autoLockMinutes', autoLock);
        
        this.showNotification('Settings saved', 'success');
        app.resetAutoLockTimer();
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    /**
     * Apply theme
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('.theme-toggle .icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${this.escapeHtml(message)}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update auto-lock timer display
     */
    updateLockTimer(seconds) {
        const timerDisplay = document.getElementById('lock-timer');
        if (!timerDisplay) return;

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `Auto-lock: ${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export singleton instance
const ui = new UI();
