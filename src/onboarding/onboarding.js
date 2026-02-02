document.addEventListener('DOMContentLoaded', async function() {
    // Get form elements
    const dspCodeInput = document.getElementById('dspCode');
    const stationCodeInput = document.getElementById('stationCode');
    const driverCsvInput = document.getElementById('driverCsv');
    const showNotificationsToggle = document.getElementById('showNotifications');
    const askSaveLocationToggle = document.getElementById('askSaveLocation');
    const themeSelect = document.getElementById('themeSelect');
    const devModeToggle = document.getElementById('devMode');
    const saveButton = document.getElementById('saveSettings');
    
    // Get error/success message elements
    const dspError = document.getElementById('dspError');
    const stationError = document.getElementById('stationError');
    const csvError = document.getElementById('csvError');
    const csvSuccess = document.getElementById('csvSuccess');
    const driverPreview = document.getElementById('driverPreview');
    const driverList = document.getElementById('driverList');

    // Get onboarding checklist elements
    const onboardingChecklist = document.getElementById('onboardingChecklist');
    const closeChecklistButton = document.getElementById('closeChecklist');
    const restartOnboardingButton = document.getElementById('restartOnboarding');
    const checklistItems = document.querySelectorAll('.checklist-item');

    // Onboarding state
    let onboardingState = {
        dsp: false,
        station: false,
        drivers: false,
        save: false
    };

    // Load saved settings
    chrome.storage.sync.get({
        dspCode: '',
        stationCode: '',
        showNotifications: true,
        askSaveLocation: false,
        devMode: false,
        onboardingComplete: false
    }, function(items) {
        dspCodeInput.value = items.dspCode;
        stationCodeInput.value = items.stationCode;
        showNotificationsToggle.checked = items.showNotifications;
        askSaveLocationToggle.checked = items.askSaveLocation;
        devModeToggle.checked = items.devMode;
        
        // Check if onboarding is already complete
        if (items.onboardingComplete) {
            hideOnboardingChecklist();
        } else {
            showOnboardingChecklist();
            updateOnboardingState();
        }
    });

    // Load driver list if exists
    chrome.storage.local.get(['driverList'], function(result) {
        if (result.driverList && result.driverList.length > 0) {
            showDriverPreview(result.driverList);
            updateOnboardingState('drivers', true);
        }
    });

    // Handle CSV file processing
    let driverData = null;
    driverCsvInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            hideError(csvError);
            const text = await file.text();
            const rows = text.split('\n')
                .map(row => row.split(','))
                .filter(row => row.length >= 2);
            
            if (rows.length < 2) {
                throw new Error('CSV file is empty or invalid');
            }
            
            driverData = rows.slice(1)
                .map(row => ({
                    name: row[0].trim().replace(/^["']|["']$/g, ''), // Remove quotes from start and end
                    transporterId: row[1].trim().replace(/^["']|["']$/g, '') // Remove quotes from start and end
                }))
                .filter(driver => driver.name && driver.transporterId);

            if (driverData.length === 0) {
                throw new Error('No valid driver data found');
            }

            // Show preview and success message
            showDriverPreview(driverData);
            showSuccess(csvSuccess, `Successfully imported ${driverData.length} drivers`);
            
            // Update onboarding state
            updateOnboardingState('drivers', true);

        } catch (error) {
            console.error('CSV Processing Error:', error);
            showError(csvError, 'Error processing CSV file: ' + error.message);
            driverData = null;
            hideDriverPreview();
            updateOnboardingState('drivers', false);
        }
    });

    // Handle theme change
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }

    // Listen for theme changes from other contexts (like the popup)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.theme) {
            const newTheme = changes.theme.newValue;
            applyTheme(newTheme);
            if (themeSelect) {
                themeSelect.value = newTheme;
            }
        }
    });

    function applyTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    // Handle input changes for onboarding state
    dspCodeInput.addEventListener('input', function() {
        updateOnboardingState('dsp', !!this.value.trim());
    });

    stationCodeInput.addEventListener('input', function() {
        updateOnboardingState('station', !!this.value.trim());
    });

    // Handle save button click
    saveButton.addEventListener('click', async function() {
        // Clear previous error messages
        dspError.textContent = '';
        stationError.textContent = '';
        
        // Validate DSP code
        if (!dspCodeInput.value.trim()) {
            showError(dspError, 'DSP code is required');
            return;
        }

        // Validate station code
        if (!stationCodeInput.value.trim()) {
            showError(stationError, 'Station code is required');
            return;
        }

        // Save all settings
        try {
            await chrome.storage.sync.set({
                dspCode: dspCodeInput.value.trim(),
                stationCode: stationCodeInput.value.trim(),
                showNotifications: showNotificationsToggle.checked,
                askSaveLocation: askSaveLocationToggle.checked,
                theme: themeSelect ? themeSelect.value : 'system',
                devMode: devModeToggle.checked,
                setupComplete: true,
                onboardingComplete: true
            });

            // Save driver list if we have one
            if (driverData) {
                await chrome.storage.local.set({ driverList: driverData });
            }

            // Update onboarding state
            updateOnboardingState('save', true);

            // Show success message
            const status = document.createElement('div');
            status.textContent = 'Settings saved successfully!';
            status.className = 'success-message';
            saveButton.parentNode.insertBefore(status, saveButton.nextSibling);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                status.remove();
            }, 3000);

            // Hide checklist after saving
            setTimeout(() => {
                hideOnboardingChecklist();
            }, 1500);

            // Close the tab after saving
            setTimeout(() => {
                window.close();
            }, 3000);

        } catch (error) {
            console.error('Save Error:', error);
            alert('Error saving settings. Please try again.');
        }
    });

    // Handle close checklist button
    closeChecklistButton.addEventListener('click', function() {
        hideOnboardingChecklist();
    });

    // Handle restart onboarding button
    restartOnboardingButton.addEventListener('click', function() {
        // Reset onboarding state
        onboardingState = {
            dsp: !!dspCodeInput.value.trim(),
            station: !!stationCodeInput.value.trim(),
            drivers: !!driverData,
            save: false
        };
        
        // Show checklist and update UI
        showOnboardingChecklist();
        updateChecklistUI();
        
        // Save that onboarding is not complete
        chrome.storage.sync.set({ onboardingComplete: false });
    });

    // Feedback Handling
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeModal = document.querySelector('.close-modal');
    const feedbackOptions = document.querySelectorAll('.feedback-option');

    if (feedbackBtn && feedbackModal) {
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.style.display = 'flex';
            requestAnimationFrame(() => {
                feedbackModal.classList.add('show');
            });
        });

        const closeFeedback = () => {
            feedbackModal.classList.remove('show');
            setTimeout(() => {
                feedbackModal.style.display = 'none';
            }, 200);
        };

        if (closeModal) {
            closeModal.addEventListener('click', closeFeedback);
        }

        // Close on click outside
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                closeFeedback();
            }
        });

        // Handle options
        feedbackOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const subject = `[${type}] Auto-DVIC Feedback`;
                const email = 'dev@harveyrustman.com';
                const body = 'Please describe your feedback here...';
                
                const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // Open mailto link
                window.location.href = mailtoLink;
                
                closeFeedback();
            });
        });
    }

    // Helper functions
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }

    function showSuccess(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }

    function showDriverPreview(drivers) {
        driverPreview.style.display = 'block';
        driverList.innerHTML = '';
        
        drivers.slice(0, 5).forEach(driver => {
            const item = document.createElement('div');
            item.className = 'driver-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'driver-name';
            nameSpan.textContent = driver.name;
            
            const idSpan = document.createElement('span');
            idSpan.className = 'driver-id';
            idSpan.textContent = driver.transporterId;
            
            item.appendChild(nameSpan);
            item.appendChild(idSpan);
            
            driverList.appendChild(item);
        });

        if (drivers.length > 5) {
            const more = document.createElement('div');
            more.className = 'driver-item';
            more.innerHTML = `<span class="driver-name">And ${drivers.length - 5} more drivers...</span>`;
            driverList.appendChild(more);
        }
    }

    function hideDriverPreview() {
        driverPreview.style.display = 'none';
        driverList.innerHTML = '';
    }

    // Onboarding functions
    function updateOnboardingState(step, completed) {
        if (step) {
            onboardingState[step] = completed;
        } else {
            // Initialize state based on current form values
            onboardingState.dsp = !!dspCodeInput.value.trim();
            onboardingState.station = !!stationCodeInput.value.trim();
            onboardingState.drivers = !!driverData;
            onboardingState.save = false;
        }
        
        updateChecklistUI();
    }

    function updateChecklistUI() {
        // Reset all highlights
        removeAllHighlights();
        
        // Update each checklist item
        checklistItems.forEach(item => {
            const step = item.getAttribute('data-step');
            
            // Remove all classes first
            item.classList.remove('active', 'completed');
            
            if (onboardingState[step]) {
                // Step is completed
                item.classList.add('completed');
            } else {
                // Find the first incomplete step and make it active
                const firstIncompleteStep = Object.keys(onboardingState).find(key => !onboardingState[key]);
                
                if (step === firstIncompleteStep) {
                    item.classList.add('active');
                    highlightActiveField(step);
                }
            }
        });
    }

    function highlightActiveField(step) {
        // Remove any existing highlights
        removeAllHighlights();
        
        // Add highlight to the appropriate field
        switch(step) {
            case 'dsp':
                dspCodeInput.classList.add('highlight-field');
                break;
            case 'station':
                stationCodeInput.classList.add('highlight-field');
                break;
            case 'drivers':
                document.querySelector('.file-input-label').classList.add('highlight-field');
                break;
            case 'save':
                saveButton.classList.add('highlight-field');
                break;
        }
    }

    function removeAllHighlights() {
        // Remove highlight class from all potential elements
        dspCodeInput.classList.remove('highlight-field');
        stationCodeInput.classList.remove('highlight-field');
        document.querySelector('.file-input-label').classList.remove('highlight-field');
        saveButton.classList.remove('highlight-field');
    }

    function showOnboardingChecklist() {
        onboardingChecklist.classList.remove('hidden');
    }

    function hideOnboardingChecklist() {
        onboardingChecklist.classList.add('hidden');
    }
});
