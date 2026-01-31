import { fillDVICForm } from '../utils/pdf-handler.js';

document.addEventListener('DOMContentLoaded', function () {
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
    const progressContainer = document.getElementById('progress-container');
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
            console.log('Loading vehicle info from storage');
            const result = await chrome.storage.local.get(['vehicleInfo']);
            console.log('Retrieved from storage:', result);

            if (result.vehicleInfo) {
                const { lic, lic_state, vin, odo, asset_type } = result.vehicleInfo;
                console.log('Updating popup with vehicle info:', {
                    lic, lic_state, vin, odo, asset_type
                });

                vehicleLicense.textContent = lic || '-';
                vehicleState.textContent = lic_state || '-';
                vehicleVin.textContent = vin || '-';
                vehicleType.textContent = asset_type || '-';

                // Populate odometer field if available
                if (odo) {
                    console.log('Setting odometer value:', odo);
                    odoInput.value = odo;
                }
            } else {
                console.log('No vehicle info found in storage');
            }
        } catch (error) {
            console.error('Error loading vehicle info:', error);
        }
    }

    // Load vehicle info on popup open
    loadVehicleInfo();

    // Listen for vehicle info updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Received message in popup:', message);

        if (message.action === 'vehicleInfoUpdated' && message.data) {
            console.log('Updating popup with new vehicle info:', message.data);

            const { lic, lic_state, vin, odo, asset_type } = message.data;
            vehicleLicense.textContent = lic || '-';
            vehicleState.textContent = lic_state || '-';
            vehicleVin.textContent = vin || '-';
            vehicleType.textContent = asset_type || '-';

            // Update odometer field if available
            if (odo) {
                console.log('Setting new odometer value:', odo);
                odoInput.value = odo;
            }
        } else if (message.action === 'submissionError') {
            console.error('Submission error:', message.error);
            if (progressContainer) progressContainer.style.display = 'none';
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
            showStatus('error', 'Error during submission', message.error);
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

    console.log('Setting default date and time:', {
        date: formattedDate,
        time: `${hours}:${minutes}`,
        rawDate: now.toString()
    });

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

    // Helper to show enhanced status messages
    function showStatus(type, message, details = null) {
        statusDiv.className = `status-${type}`;
        statusDiv.style.display = 'flex';

        const icon = type === 'error' ? '❌' :
            type === 'warning' ? '⚠️' :
                type === 'success' ? '✓' : 'ℹ️';

        let html = `
            <div class="status-icon">${icon}</div>
            <div class="status-content">
                <div>${message}</div>
        `;

        if (details) {
            html += `
                <button class="status-details-toggle" type="button">Show details</button>
                <div class="status-details">${details}</div>
            `;
        }

        html += `</div>`;
        statusDiv.innerHTML = html;

        if (details) {
            const toggle = statusDiv.querySelector('.status-details-toggle');
            const detailsDiv = statusDiv.querySelector('.status-details');
            if (toggle && detailsDiv) {
                toggle.addEventListener('click', () => {
                    const isVisible = detailsDiv.style.display === 'block';
                    detailsDiv.style.display = isVisible ? 'none' : 'block';
                    toggle.textContent = isVisible ? 'Show details' : 'Hide details';
                });
            }
        }
    }

    // Check for DSP and Station codes
    async function checkSettings() {
        const { dspCode, stationCode } = await chrome.storage.sync.get({
            dspCode: '',
            stationCode: ''
        });

        if (!dspCode || !stationCode) {
            showStatus('warning', 'Please set your DSP Code and Station Code in the extension settings before submitting DVICs.');
            form.querySelector('button[type="submit"]').disabled = true;
        }
    }

    // Run settings check
    checkSettings();

    // Handle satisfactory condition checkbox
    satisfyCondCheckbox.addEventListener('change', function () {
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
            checkbox.addEventListener('change', function () {
                if (this.checked) {
                    // If any issue is checked, uncheck satisfactory condition
                    satisfyCondCheckbox.checked = false;
                    issuesContainer.style.display = 'block';
                }

                // Log checkbox state for debugging
                console.log('Issue checkbox changed:', {
                    id: this.id,
                    checked: this.checked,
                    satisfyCondChecked: satisfyCondCheckbox.checked
                });
            });
        });

    // Form submission handler
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Validate checkbox consistency
        const issueCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="1_"], input[type="checkbox"][id^="2_"], input[type="checkbox"][id^="3_"], input[type="checkbox"][id^="4_"], input[type="checkbox"][id^="5_"]');
        const hasIssues = Array.from(issueCheckboxes).some(checkbox => checkbox.checked);

        if (hasIssues && satisfyCondCheckbox.checked) {
            showStatus('error', 'Cannot mark issues and satisfy all conditions');
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
            showStatus('error', 'Please fill in all required fields');
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

            console.log('Form data being prepared:', {
                ...formData,
                rawInspectionType: inspectionType,
                normalizedType: formData.inspectionType,
                customLocation: diffLocationCheckbox.checked,
                locationValue: inspLocInput.value
            });

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

            console.log('Form data being sent to fillDVICForm:', formData);

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
            showStatus('error', error.message || 'Unknown error occurred', error.stack);
        }
    });

    // Handle different location checkbox
    diffLocationCheckbox.addEventListener('change', function () {
        locationGroup.style.display = this.checked ? 'block' : 'none';
        inspLocInput.required = this.checked;
        if (!this.checked) {
            inspLocInput.value = ''; // Clear the input when unchecked
        }
    });

    // Handle settings button click
    settingsBtn.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });

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

    // Notify content script when popup is closing
    window.addEventListener('beforeunload', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'popupClosed' });
            }
        });
    });

    // Listen for storage changes to update driver list
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'local' && changes.driverList) {
            loadDriverList();
        }
    });
});
