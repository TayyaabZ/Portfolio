/**
 * app.js - Main Application Logic
 * Handles initialization, event wiring, and application state
 */

class App {
    constructor() {
        this.autoLockTimer = null;
        this.autoLockSeconds = 300; // 5 minutes default
        this.autoLockInterval = null;
        this.activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        this.panicMode = false;
        this.panicKey = 'Escape'; // Triple press ESC
        this.panicPressCount = 0;
        this.panicPressTimer = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('VaultGuard Password Manager - Initializing...');

        try {
            // Check if vault exists
            const exists = await vault.vaultExists();

            // Setup UI
            this.setupEventListeners();
            this.loadTheme();
            this.loadAutoLockSettings();

            if (exists) {
                this.showUnlockScreen();
            } else {
                this.showWelcomeScreen();
            }

            // Setup panic mode
            this.setupPanicMode();

        } catch (error) {
            console.error('Initialization error:', error);
            ui.showNotification('Failed to initialize application', 'error');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) ui.showView(view);
            });
        });

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => ui.toggleTheme());
        }

        // Lock button
        const lockBtn = document.getElementById('lock-btn');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => this.lockVault());
        }

        // Welcome screen buttons
        const createVaultBtn = document.getElementById('create-vault-btn');
        if (createVaultBtn) {
            createVaultBtn.addEventListener('click', () => this.showCreateScreen());
        }

        const unlockVaultBtn = document.getElementById('unlock-vault-btn');
        if (unlockVaultBtn) {
            unlockVaultBtn.addEventListener('click', () => this.showUnlockScreen());
        }

        // Create vault form
        const createForm = document.getElementById('create-vault-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createVault();
            });
        }

        // Master password strength
        const masterPasswordInput = document.getElementById('master-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        if (masterPasswordInput) {
            masterPasswordInput.addEventListener('input', () => this.updateMasterPasswordStrength());
        }
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.checkPasswordMatch());
        }

        // Unlock form
        const unlockForm = document.getElementById('unlock-form');
        if (unlockForm) {
            unlockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.unlockVault();
            });
        }

        // Add entry button
        const addEntryBtn = document.getElementById('add-entry-btn');
        if (addEntryBtn) {
            addEntryBtn.addEventListener('click', () => ui.showEntryModal());
        }

        // Entry modal
        const entryForm = document.getElementById('entry-form');
        if (entryForm) {
            entryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                ui.saveEntry();
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => ui.hideEntryModal());
        });

        // Click outside modal to close
        const entryModal = document.getElementById('entry-modal');
        if (entryModal) {
            entryModal.addEventListener('click', (e) => {
                if (e.target === entryModal) {
                    ui.hideEntryModal();
                }
            });
        }

        // Entry password field
        const entryPassword = document.getElementById('entry-password');
        if (entryPassword) {
            entryPassword.addEventListener('input', () => ui.updatePasswordStrength());
        }

        // Generate password in modal
        const genPasswordBtn = document.getElementById('gen-password-btn');
        if (genPasswordBtn) {
            genPasswordBtn.addEventListener('click', () => ui.generatePasswordInModal());
        }

        // Copy generated password
        const copyGeneratedBtn = document.getElementById('copy-generated-btn');
        if (copyGeneratedBtn) {
            copyGeneratedBtn.addEventListener('click', () => ui.copyGeneratedPasswordToClipboard());
        }

        // Regenerate password
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => ui.generatePasswordInModal());
        }

        // Toggle password visibility in modal
        const togglePasswordVisibility = document.getElementById('toggle-password-visibility');
        if (togglePasswordVisibility) {
            togglePasswordVisibility.addEventListener('click', () => {
                const passwordInput = document.getElementById('entry-password');
                if (passwordInput) {
                    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                }
            });
        }

        // Breach check in modal
        const breachCheckBtn = document.getElementById('breach-check-btn');
        if (breachCheckBtn) {
            breachCheckBtn.addEventListener('click', () => ui.checkPasswordBreach());
        }

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => ui.searchVault());
        }

        // Filter
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => ui.applyFilter(e.target.value));
        }

        // Generator view
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generatePassword());
        }

        const copyGenBtn = document.getElementById('copy-gen-btn');
        if (copyGenBtn) {
            copyGenBtn.addEventListener('click', () => this.copyGeneratedPassword());
        }

        const generatorInputs = document.querySelectorAll('#generator-options input');
        generatorInputs.forEach(input => {
            input.addEventListener('change', () => this.updateGeneratorPreview());
        });

        // Export/Import
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => ui.exportVault());
        }

        const importInput = document.getElementById('import-input');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    ui.importVault(e.target.files[0]);
                }
            });
        }

        // Settings
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => ui.saveSettings());
        }

        // Activity tracking for auto-lock
        this.setupActivityTracking();
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        const welcomeView = document.getElementById('welcome-view');
        const mainApp = document.getElementById('main-app');
        const createView = document.getElementById('create-view');
        const unlockView = document.getElementById('unlock-view');
        
        // Show welcome, hide everything else
        if (welcomeView) {
            welcomeView.style.display = 'flex';
            welcomeView.classList.add('active');
        }
        if (createView) {
            createView.style.display = 'none';
            createView.classList.remove('active');
        }
        if (unlockView) {
            unlockView.style.display = 'none';
            unlockView.classList.remove('active');
        }
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.remove('active');
        }
    }

    /**
     * Show create vault screen
     */
    showCreateScreen() {
        const welcomeView = document.getElementById('welcome-view');
        const createView = document.getElementById('create-view');
        const unlockView = document.getElementById('unlock-view');
        const mainApp = document.getElementById('main-app');
        
        // Hide welcome, show create
        if (welcomeView) {
            welcomeView.style.display = 'none';
            welcomeView.classList.remove('active');
        }
        if (createView) {
            createView.style.display = 'flex';
            createView.classList.add('active');
        }
        if (unlockView) {
            unlockView.style.display = 'none';
            unlockView.classList.remove('active');
        }
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.remove('active');
        }
    }

    /**
     * Show unlock screen
     */
    showUnlockScreen() {
        const welcomeView = document.getElementById('welcome-view');
        const createView = document.getElementById('create-view');
        const unlockView = document.getElementById('unlock-view');
        const mainApp = document.getElementById('main-app');
        
        // Hide welcome & create, show unlock
        if (welcomeView) {
            welcomeView.style.display = 'none';
            welcomeView.classList.remove('active');
        }
        if (createView) {
            createView.style.display = 'none';
            createView.classList.remove('active');
        }
        if (unlockView) {
            unlockView.style.display = 'flex';
            unlockView.classList.add('active');
        }
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.remove('active');
        }
    }

    /**
     * Create new vault
     */
    async createVault() {
        console.log('createVault called');
        const password = document.getElementById('master-password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const hint = document.getElementById('password-hint')?.value || '';

        console.log('Password values:', { hasPassword: !!password, hasConfirm: !!confirm });

        if (!password || !confirm) {
            ui.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirm) {
            ui.showNotification('Passwords do not match', 'error');
            return;
        }

        const strength = passwordGenerator.calculateStrength(password);
        console.log('Password strength:', strength);
        
        if (strength.score < 3) {
            if (!window.confirm('Your master password is not very strong. Continue anyway?')) {
                return;
            }
        }

        try {
            console.log('Calling vault.createVault...');
            const result = await vault.createVault(password, hint);
            console.log('Vault creation result:', result);
            
            if (result.success) {
                ui.showNotification('Vault created successfully!', 'success');
                this.showMainApp();
            } else {
                ui.showNotification('Failed to create vault: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Create vault exception:', error);
            ui.showNotification('Failed to create vault: ' + error.message, 'error');
        }
    }

    /**
     * Unlock vault
     */
    async unlockVault() {
        const password = document.getElementById('unlock-password')?.value;

        if (!password) {
            ui.showNotification('Please enter your master password', 'error');
            return;
        }

        const unlockBtn = document.querySelector('#unlock-form button[type="submit"]');
        if (unlockBtn) {
            unlockBtn.disabled = true;
            unlockBtn.textContent = 'Unlocking...';
        }

        try {
            const result = await vault.unlockVault(password);
            
            if (result.success) {
                ui.showNotification('Vault unlocked!', 'success');
                this.showMainApp();
                this.startAutoLock();
            }
        } catch (error) {
            ui.showNotification('Wrong password or corrupted vault', 'error');
            
            // Track failed attempts
            const attempts = parseInt(sessionStorage.getItem('failedAttempts') || '0') + 1;
            sessionStorage.setItem('failedAttempts', attempts.toString());
            
            if (attempts >= 5) {
                ui.showNotification('Too many failed attempts. Please wait before trying again.', 'error');
                setTimeout(() => {
                    sessionStorage.setItem('failedAttempts', '0');
                }, 60000); // 1 minute lockout
            }
        } finally {
            if (unlockBtn) {
                unlockBtn.disabled = false;
                unlockBtn.textContent = 'Unlock Vault';
            }
        }
    }

    /**
     * Show main app
     */
    showMainApp() {
        const welcomeView = document.getElementById('welcome-view');
        const createView = document.getElementById('create-view');
        const unlockView = document.getElementById('unlock-view');
        const mainApp = document.getElementById('main-app');
        
        // Hide all auth screens, show main app
        if (welcomeView) {
            welcomeView.style.display = 'none';
            welcomeView.classList.remove('active');
        }
        if (createView) {
            createView.style.display = 'none';
            createView.classList.remove('active');
        }
        if (unlockView) {
            unlockView.style.display = 'none';
            unlockView.classList.remove('active');
        }
        if (mainApp) {
            mainApp.style.display = 'flex';
            mainApp.classList.add('active');
        }
        
        ui.showView('vault');
    }

    /**
     * Lock vault
     */
    lockVault() {
        vault.lockVault();
        this.stopAutoLock();
        
        document.getElementById('main-app')?.classList.remove('active');
        this.showUnlockScreen();
        
        ui.showNotification('Vault locked', 'info');
    }

    /**
     * Update master password strength display
     */
    updateMasterPasswordStrength() {
        const passwordInput = document.getElementById('master-password');
        const strengthMeter = document.getElementById('master-strength-meter');
        const strengthText = document.getElementById('master-strength-text');
        const strengthBar = strengthMeter?.querySelector('.strength-bar-fill');

        if (!passwordInput || !strengthMeter) return;

        const password = passwordInput.value;
        const strength = passwordGenerator.calculateStrength(password);

        strengthBar.style.width = strength.percentage + '%';
        strengthBar.className = `strength-bar-fill strength-${strength.score}`;
        strengthText.textContent = strength.label;

        // Show feedback
        const feedbackDiv = document.getElementById('master-password-feedback');
        if (feedbackDiv && strength.feedback.length > 0) {
            feedbackDiv.innerHTML = strength.feedback.map(f => `<li>${f}</li>`).join('');
        }
    }

    /**
     * Check password match
     */
    checkPasswordMatch() {
        const password = document.getElementById('master-password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const matchIndicator = document.getElementById('password-match');

        if (!matchIndicator) return;

        if (!confirm) {
            matchIndicator.textContent = '';
            return;
        }

        if (password === confirm) {
            matchIndicator.textContent = '✓ Passwords match';
            matchIndicator.className = 'match-indicator match';
        } else {
            matchIndicator.textContent = '✗ Passwords do not match';
            matchIndicator.className = 'match-indicator no-match';
        }
    }

    /**
     * Generate password in generator view
     */
    generatePassword() {
        const length = parseInt(document.getElementById('generator-length')?.value || 16);
        const uppercase = document.getElementById('generator-uppercase')?.checked ?? true;
        const lowercase = document.getElementById('generator-lowercase')?.checked ?? true;
        const digits = document.getElementById('generator-digits')?.checked ?? true;
        const symbols = document.getElementById('generator-symbols')?.checked ?? true;
        
        const personalWords = [];
        const word1 = document.getElementById('personal-word1')?.value.trim();
        const word2 = document.getElementById('personal-word2')?.value.trim();
        const word3 = document.getElementById('personal-word3')?.value.trim();
        
        if (word1) personalWords.push(word1);
        if (word2) personalWords.push(word2);
        if (word3) personalWords.push(word3);

        try {
            const password = passwordGenerator.generate({
                length, uppercase, lowercase, digits, symbols, personalWords
            });

            const outputField = document.getElementById('generated-password');
            if (outputField) {
                outputField.value = password;
            }

            // Update strength
            const strength = passwordGenerator.calculateStrength(password);
            const strengthDisplay = document.getElementById('generated-strength');
            if (strengthDisplay) {
                strengthDisplay.innerHTML = `
                    <div class="strength-bar">
                        <div class="strength-bar-fill strength-${strength.score}" style="width: ${strength.percentage}%"></div>
                    </div>
                    <div class="strength-label">${strength.label} (${strength.entropy} bits)</div>
                `;
            }
        } catch (error) {
            ui.showNotification('Failed to generate password: ' + error.message, 'error');
        }
    }

    /**
     * Copy generated password
     */
    async copyGeneratedPassword() {
        const outputField = document.getElementById('generated-password');
        if (!outputField || !outputField.value) {
            ui.showNotification('Generate a password first', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputField.value);
            ui.showNotification('Password copied to clipboard', 'success');
        } catch (error) {
            ui.showNotification('Failed to copy password', 'error');
        }
    }

    /**
     * Update generator preview
     */
    updateGeneratorPreview() {
        // Auto-generate when options change
        this.generatePassword();
    }

    /**
     * Setup activity tracking for auto-lock
     */
    setupActivityTracking() {
        this.activityEvents.forEach(event => {
            document.addEventListener(event, () => this.resetAutoLockTimer(), { passive: true });
        });
    }

    /**
     * Start auto-lock timer
     */
    startAutoLock() {
        this.stopAutoLock();
        this.resetAutoLockTimer();
    }

    /**
     * Stop auto-lock timer
     */
    stopAutoLock() {
        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
            this.autoLockTimer = null;
        }
        if (this.autoLockInterval) {
            clearInterval(this.autoLockInterval);
            this.autoLockInterval = null;
        }
    }

    /**
     * Reset auto-lock timer
     */
    resetAutoLockTimer() {
        if (vault.isLocked) return;

        this.stopAutoLock();

        let remainingSeconds = this.autoLockSeconds;

        // Update display every second
        this.autoLockInterval = setInterval(() => {
            remainingSeconds--;
            ui.updateLockTimer(remainingSeconds);

            if (remainingSeconds <= 0) {
                clearInterval(this.autoLockInterval);
            }
        }, 1000);

        // Set the actual lock timer
        this.autoLockTimer = setTimeout(() => {
            this.lockVault();
        }, this.autoLockSeconds * 1000);

        ui.updateLockTimer(remainingSeconds);
    }

    /**
     * Load auto-lock settings
     */
    loadAutoLockSettings() {
        const minutes = parseInt(localStorage.getItem('autoLockMinutes') || '5');
        this.autoLockSeconds = minutes * 60;
    }

    /**
     * Load theme
     */
    loadTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        ui.applyTheme(theme);
    }

    /**
     * Setup panic mode
     */
    setupPanicMode() {
        document.addEventListener('keydown', (e) => {
            if (e.key === this.panicKey) {
                this.panicPressCount++;

                if (this.panicPressTimer) {
                    clearTimeout(this.panicPressTimer);
                }

                if (this.panicPressCount >= 3) {
                    this.activatePanicMode();
                    this.panicPressCount = 0;
                    return;
                }

                this.panicPressTimer = setTimeout(() => {
                    this.panicPressCount = 0;
                }, 1000);
            }
        });
    }

    /**
     * Activate panic mode
     */
    activatePanicMode() {
        if (this.panicMode) return;

        this.panicMode = true;
        this.lockVault();
        
        // Replace page with decoy
        document.body.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                .decoy-page {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    padding: 2rem;
                }
                
                .decoy-container {
                    text-align: center;
                    max-width: 800px;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 4rem 3rem;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: fadeIn 0.5s ease-out;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .decoy-icon {
                    font-size: 5rem;
                    margin-bottom: 1.5rem;
                    animation: bounce 2s infinite;
                }
                
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                
                h1 {
                    font-size: 2.5rem;
                    color: #2d3748;
                    margin-bottom: 1rem;
                    font-weight: 700;
                }
                
                .subtitle {
                    font-size: 1.25rem;
                    color: #4a5568;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }
                
                .feature-card {
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border-radius: 12px;
                    transition: transform 0.3s ease;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                }
                
                .feature-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                
                .feature-title {
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 0.25rem;
                }
                
                .feature-text {
                    font-size: 0.875rem;
                    color: #718096;
                }
                
                .restore-hint {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: rgba(103, 126, 234, 0.1);
                    border-radius: 8px;
                    color: #667eea;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                
                .restore-hint kbd {
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                    font-weight: bold;
                    margin: 0 0.25rem;
                }
            </style>
            
            <div class="decoy-page">
                <div class="decoy-container">
                    <div class="decoy-icon">📚</div>
                    <h1>Student Portfolio</h1>
                    <p class="subtitle">Welcome to my academic showcase and project archive</p>
                    
                    <div class="features">
                        <div class="feature-card">
                            <div class="feature-icon">🎓</div>
                            <div class="feature-title">Education</div>
                            <div class="feature-text">Computer Science</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💻</div>
                            <div class="feature-title">Projects</div>
                            <div class="feature-text">Web Development</div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🚀</div>
                            <div class="feature-title">Skills</div>
                            <div class="feature-text">Full Stack Dev</div>
                        </div>
                    </div>
                    
                    <div class="restore-hint">
                        Press <kbd>F5</kbd> to refresh and continue browsing
                    </div>
                </div>
            </div>
        `;

        ui.showNotification('Panic mode activated', 'info');
    }
}

// Initialize app when DOM is ready
const app = new App();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
