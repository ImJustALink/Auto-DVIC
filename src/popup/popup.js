import { fillDVICForm } from '../utils/pdf-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dvicForm');
    const daNameInput = document.getElementById('daName');
    const inspectionTypeSelect = document.getElementById('inspectionType');
    const inspDateInput = document.getElementById('inspDate');
    const inspTimeInput = document.getElementById('inspTime');
    const odoInput = document.getElementById('odo');
    const diffLocationCheckbox = document.getElementById('diffLocation');
    const locationGroup = document.getElementById('locationGroup');
    const inspLocInput = document.getElementById('inspLoc');
    const satisfyCondCheckbox = document.getElementById('satisfyCond');
    const issuesContainer = document.getElementById('issuesContainer');
    const statusDiv = document.getElementById('status');
    const settingsBtn = document.getElementById('settingsBtn');
    const driverList = document.getElementById('driverList');
    const driverTooltip = document.getElementById('driverTooltip');
    const importCsvLink = document.getElementById('importCsvLink');

    // Vehicle info elements
    const infoToggle = document.querySelector('.info-toggle');
    const infoContent = document.querySelector('.info-content');
    const vehicleLicense = document.getElementById('vehicleLicense');
    const vehicleState = document.getElementById('vehicleState');
    const vehicleVin = document.getElementById('vehicleVin');
    const vehicleType = document.getElementById('vehicleType');
    // Inspection type toggle radios
    const inspectionTypeRadios = document.getElementsByName('inspectionType');

    // Toggle vehicle info section
    infoToggle.addEventListener('click', () => {
        const isExpanded = infoContent.classList.contains('active');
        infoContent.classList.toggle('active');
        infoToggle.querySelector('.toggle-icon').textContent = isExpanded ? '▶' : '▼';
    });

    // Load vehicle info from storage
    async function loadVehicleInfo() {
        try {
            const result = await chrome.storage.local.get(['vehicleInfo']);
            if (result.vehicleInfo) {
                const { lic, lic_state, vin, odo, asset_type } = result.vehicleInfo;
                vehicleLicense.textContent = lic || '-';
                vehicleState.textContent = lic_state || '-';
                vehicleVin.textContent = vin || '-';
                vehicleType.textContent = asset_type || '-';
                
                // Populate odometer field if available
                if (odo) {
                    odoInput.value = odo;
                }
            }
        } catch (error) {
            console.error('Error loading vehicle info:', error);
        }
    }

    // Load vehicle info on popup open
    loadVehicleInfo();

    // Listen for vehicle info updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'vehicleInfoUpdated' && message.data) {
            const { lic, lic_state, vin, odo, asset_type } = message.data;
            vehicleLicense.textContent = lic || '-';
            vehicleState.textContent = lic_state || '-';
            vehicleVin.textContent = vin || '-';
            vehicleType.textContent = asset_type || '-';
            
            // Update odometer field if available
            if (odo) {
                odoInput.value = odo;
            }
        } else if (message.action === 'submissionError') {
            console.error('Submission error:', message.error);
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
            statusDiv.textContent = 'Error during submission: ' + message.error;
            statusDiv.className = 'status-error';
        }
    });

    // Set default date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    inspDateInput.value = formattedDate;
    inspDateInput.max = formattedDate; // Prevent future dates
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    inspTimeInput.value = `${hours}:${minutes}`;
    
    // Load and populate driver list
    async function loadDriverList() {
        try {
            const result = await chrome.storage.local.get(['driverList']);
            if (result.driverList && result.driverList.length > 0) {
                driverList.innerHTML = '';
                result.driverList.forEach(driver => {
                    const option = document.createElement('option');
                    option.value = driver.name;
                    option.dataset.transporterId = driver.transporterId;
                    driverList.appendChild(option);
                });
                driverTooltip.classList.remove('show');
            } else {
                driverTooltip.classList.add('show');
            }
        } catch (error) {
            console.error('Error loading driver list:', error);
            driverTooltip.classList.add('show');
        }
    }

    // Load driver list on popup open
    loadDriverList();

    // Check for DSP and Station codes
    async function checkSettings() {
        const { dspCode, stationCode } = await chrome.storage.sync.get({
            dspCode: '',
            stationCode: ''
        });

        if (!dspCode || !stationCode) {
            statusDiv.textContent = 'Please set your DSP Code and Station Code in the extension settings before submitting DVICs.';
            statusDiv.className = 'status-warning';
            form.querySelector('button[type="submit"]').disabled = true;
        }
    }

    // Run settings check
    checkSettings();

    // Handle satisfactory condition checkbox
    satisfyCondCheckbox.addEventListener('change', function() {
        issuesContainer.style.display = this.checked ? 'none' : 'block';
        
        // If switching to satisfactory, uncheck all issue checkboxes
        if (this.checked) {
            document.querySelectorAll('input[type="checkbox"][id^="1_"], input[type="checkbox"][id^="2_"], input[type="checkbox"][id^="3_"], input[type="checkbox"][id^="4_"], input[type="checkbox"][id^="5_"]')
                .forEach(checkbox => {
                    checkbox.checked = false;
                });
        }
    });

    // Handle issue checkboxes
    document.querySelectorAll('input[type="checkbox"][id^="1_"], input[type="checkbox"][id^="2_"], input[type="checkbox"][id^="3_"], input[type="checkbox"][id^="4_"], input[type="checkbox"][id^="5_"]')
        .forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // If any issue is checked, uncheck satisfactory condition
                    satisfyCondCheckbox.checked = false;
                    issuesContainer.style.display = 'block';
                }
                
            });
        });

    // Form submission handler
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validate checkbox consistency
        const issueCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="1_"], input[type="checkbox"][id^="2_"], input[type="checkbox"][id^="3_"], input[type="checkbox"][id^="4_"], input[type="checkbox"][id^="5_"]');
        const hasIssues = Array.from(issueCheckboxes).some(checkbox => checkbox.checked);
        
        if (hasIssues && satisfyCondCheckbox.checked) {
            statusDiv.textContent = 'Error: Cannot mark issues and satisfy all conditions';
            statusDiv.className = 'status-error';
            return;
        }
        
        // Get form inputs
        const daNameInput = document.getElementById('daName');
        const inspectionTypeSelect = document.getElementById('inspectionType');
        const inspDateInput = document.getElementById('inspDate');
        const inspTimeInput = document.getElementById('inspTime');
        
        // Validate required fields
        let inspectionType = '';
        for (const radio of inspectionTypeRadios) {
            if (radio.checked) {
                inspectionType = radio.value;
                break;
            }
        }
        if (!daNameInput.value || !inspectionType || !inspDateInput.value || !inspTimeInput.value) {
            statusDiv.textContent = 'Please fill in all required fields';
            statusDiv.className = 'status-error';
            return;
        }
        
        try {
            // Get DSP and Station codes from sync storage
            const { dspCode, stationCode } = await chrome.storage.sync.get({
                dspCode: '',
                stationCode: ''
            });
            
            if (!dspCode || !stationCode) {
                throw new Error('DSP Code and Station Code are required. Please set them in the extension settings.');
            }

            // Get vehicle info from storage
            const { vehicleInfo } = await chrome.storage.local.get(['vehicleInfo']);
            if (!vehicleInfo) {
                throw new Error('Vehicle information not found. Please try clicking the Auto DVIC button again.');
            }

            // Get transporter ID from datalist
            const driverOption = Array.from(driverList.options).find(opt => opt.value === daNameInput.value);
            const transporterId = driverOption ? driverOption.dataset.transporterId : '';
            
            if (!transporterId) {
                throw new Error('Transporter ID not found for selected driver. Please make sure the driver is in the list.');
            }

            // Prepare form data
            const formData = {
                daName: daNameInput.value,
                transporterId: transporterId,
                inspectionType: inspectionType.toLowerCase(), // Just send 'pre' or 'post'
                inspDate: inspDateInput.value,
                inspTime: inspTimeInput.value,
                satisfyCond: satisfyCondCheckbox.checked,
                dsp: dspCode,
                station: stationCode,
                inspLoc: diffLocationCheckbox.checked ? inspLocInput.value : stationCode, // Use custom location if checked
                ...vehicleInfo
            };

            // Create a separate issues object and maintain checkbox states
            const issues = {};
            issueCheckboxes.forEach(checkbox => {
                // Keep the original checkbox state for PDF handling
                formData[checkbox.id] = checkbox.checked;
                
                // Add to issues object if checked (for fleet portal)
                if (checkbox.checked) {
                    const label = document.querySelector(`label[for="${checkbox.id}"]`);
                    issues[checkbox.id] = label ? label.textContent.trim() : checkbox.id;
                }
            });
            formData.issues = issues;

            // Fill and save PDF
            const result = await fillDVICForm(formData);
            
            // Auto-download to downloads folder
            const downloadLink = document.createElement('a');
            downloadLink.href = result.url;
            downloadLink.download = result.filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(result.url), 100);
            
            // Send message to background script to start submission
            chrome.runtime.sendMessage({
                action: 'startSubmission',
                data: {
                    daName: daNameInput.value,
                    transporterId: transporterId, // Add transporter ID to message
                    inspectionType: inspectionType,
                    inspDate: inspDateInput.value,
                    inspTime: inspTimeInput.value,
                    satisfyCondition: satisfyCondCheckbox.checked,
                    issues: formData.issues // Send the issues object with descriptions
                }
            });
            
            // Close the popup after a short delay to ensure download starts
            setTimeout(() => window.close(), 500);
            
        } catch (error) {
            console.error('Error processing form:', error);
            statusDiv.textContent = 'Error: ' + (error.message || 'Unknown error occurred');
            statusDiv.className = 'status-error';
        }
    });

    // Handle different location checkbox
    diffLocationCheckbox.addEventListener('change', function() {
        locationGroup.style.display = this.checked ? 'block' : 'none';
        inspLocInput.required = this.checked;
        if (!this.checked) {
            inspLocInput.value = ''; // Clear the input when unchecked
        }
    });

    // Handle settings button click
    settingsBtn.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });

    // Menu Handling
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = menuDropdown.classList.contains('show');
            if (isShown) {
                menuDropdown.classList.remove('show');
                menuBtn.classList.remove('active');
            } else {
                menuDropdown.classList.add('show');
                menuBtn.classList.add('active');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('show');
                menuBtn.classList.remove('active');
            }
        });
    }

    // Handle collapsible sections
    document.querySelectorAll('.section-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const isActive = button.classList.contains('active');
            
            // Close other sections
            document.querySelectorAll('.section-toggle.active').forEach(activeButton => {
                if (activeButton !== button) {
                    activeButton.classList.remove('active');
                    activeButton.nextElementSibling.classList.remove('active');
                }
            });
            
            // Toggle current section
            button.classList.toggle('active');
            content.classList.toggle('active');
            
            // Scroll section into view if opening
            if (!isActive) {
                button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });

    // Feedback Handling
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeModal = document.querySelector('.close-modal');
    const feedbackOptions = document.querySelectorAll('.feedback-option');

    if (feedbackBtn && feedbackModal) {
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.style.display = 'flex';
            // Small delay to allow display:flex to apply before adding opacity class
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
                chrome.tabs.create({ url: mailtoLink });
                
                closeFeedback();
            });
        });
    }

    // Notify content script when popup is closing
    window.addEventListener('beforeunload', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'popupClosed'});
            }
        });
    });

    // Listen for storage changes to update driver list
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && changes.driverList) {
            loadDriverList();
        }
    });

    // Load saved settings including theme
    chrome.storage.sync.get({
        theme: 'system'
    }, function(items) {
        updateTheme(items.theme);
        updateThemeIcon(items.theme);
    });

    // Theme toggle handler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            chrome.storage.sync.get({ theme: 'system' }, function(items) {
                const current = items.theme;
                let next = 'system';
                if (current === 'system') next = 'light';
                else if (current === 'light') next = 'dark';
                else if (current === 'dark') next = 'system';
                
                chrome.storage.sync.set({ theme: next }, function() {
                    updateTheme(next);
                    updateThemeIcon(next);
                });
            });
        });
    }

    // Settings button handler (in menu)
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    }

    function updateTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    function updateThemeIcon(theme) {
        const sun = document.querySelector('.sun-icon');
        const moon = document.querySelector('.moon-icon');
        const auto = document.querySelector('.auto-icon');
        
        if (!sun || !moon || !auto) return;

        sun.style.display = 'none';
        moon.style.display = 'none';
        auto.style.display = 'none';

        if (theme === 'light') sun.style.display = 'block';
        else if (theme === 'dark') moon.style.display = 'block';
        else auto.style.display = 'block';
    }

    // Connection Health Check
    const checkConnection = async () => {
        try {
            // Get the stored source tab ID
            const { sourceTabId } = await chrome.storage.local.get(['sourceTabId']);
            
            if (!sourceTabId) {
                // If no source tab ID, we can't check connection effectively
                return;
            }

            try {
                // Get the tab to verify it still exists
                const tab = await chrome.tabs.get(sourceTabId);
                
                // Only check connection on Amazon Fleet Portal pages
                if (tab.url && tab.url.includes('logistics.amazon.com/fleet-management')) {
                    try {
                        // Use promise-based message sending
                        const response = await chrome.tabs.sendMessage(sourceTabId, { action: 'ping' });
                        
                        if (!response || response.status !== 'pong') {
                            throw new Error('Invalid ping response');
                        }
                    } catch (err) {
                        // This catches both chrome.runtime.lastError and invalid responses
                        showConnectionError();
                    }
                }
            } catch (err) {
                // Tab might not exist anymore
                console.log('Source tab not found or inaccessible');
            }
        } catch (error) {
            console.error('Connection check failed:', error);
        }
    };

    const showConnectionError = () => {
        const errorOverlay = document.getElementById('connectionError');
        if (errorOverlay) {
            errorOverlay.classList.add('visible');
        }
    };

    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', async () => {
            try {
                const { sourceTabId } = await chrome.storage.local.get(['sourceTabId']);
                if (sourceTabId) {
                    await chrome.tabs.reload(sourceTabId);
                }
            } catch (error) {
                console.error('Error reloading tab:', error);
            }
            window.close();
        });
    }

    // Run check on load
    checkConnection();

    // Changelog System
    const CHANGELOG = [
        "New Dark Theme (Change via Menu)",
        "New Menu System (Access settings, feedback, recent changes)",
        "Improved Connection Reliability",
        "Bug Fixes"
    ];
    const UPDATE_ID = 'update_2026_02_02_v1_1_6';
    
    // Elements
    const updateBadgeContainer = document.getElementById('updateBadgeContainer');
    const badgeChangelogList = document.getElementById('badgeChangelogList');
    const modalChangelogList = document.getElementById('modalChangelogList');
    const changelogBtn = document.getElementById('changelogBtn');
    const changelogModal = document.getElementById('changelogModal');
    const closeChangelogModal = document.querySelector('.close-modal-changelog');

    // Populate Lists
    const populateList = (listElement) => {
        if (!listElement) return;
        listElement.innerHTML = CHANGELOG.map(item => `<li>${item}</li>`).join('');
    };
    
    populateList(badgeChangelogList);
    populateList(modalChangelogList);

    // Check Visibility Logic
    chrome.storage.local.get([`firstSeen_${UPDATE_ID}`], function(result) {
        const firstSeen = result[`firstSeen_${UPDATE_ID}`];
        const now = Date.now();
        
        if (!firstSeen) {
            // First time seeing this update
            chrome.storage.local.set({ [`firstSeen_${UPDATE_ID}`]: now });
            if (updateBadgeContainer) updateBadgeContainer.style.display = 'flex';
        } else {
            // Check if 3 days have passed (3 * 24 * 60 * 60 * 1000 = 259200000 ms)
            const threeDaysMs = 259200000;
            if (now - firstSeen < threeDaysMs) {
                if (updateBadgeContainer) updateBadgeContainer.style.display = 'flex';
            } else {
                if (updateBadgeContainer) updateBadgeContainer.style.display = 'none';
            }
        }
    });

    // Modal Logic
    if (changelogBtn && changelogModal) {
        changelogBtn.addEventListener('click', () => {
            // Close menu first
            if (menuDropdown) menuDropdown.classList.remove('show');
            if (menuBtn) menuBtn.classList.remove('active');
            
            changelogModal.style.display = 'flex';
            requestAnimationFrame(() => {
                changelogModal.classList.add('show');
            });
        });

        const closeChangelog = () => {
            changelogModal.classList.remove('show');
            setTimeout(() => {
                changelogModal.style.display = 'none';
            }, 200);
        };

        if (closeChangelogModal) {
            closeChangelogModal.addEventListener('click', closeChangelog);
        }

        changelogModal.addEventListener('click', (e) => {
            if (e.target === changelogModal) {
                closeChangelog();
            }
        });
    }
});
