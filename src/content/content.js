// Initialize Chrome storage
const storage = chrome.storage || browser.storage;

// Output debug message
console.log('Auto DVIC: Content script loaded');

// Load selectors configuration
let SELECTORS = {}, TIMING = {}, TEXT_PATTERNS = {};

// Initialize configuration
(async () => {
    try {
        const configUrl = chrome.runtime.getURL('src/config/selectors.js');
        console.log('Auto DVIC: Loading configuration from', configUrl);
        const config = await import(configUrl);

        SELECTORS = config.SELECTORS;
        TIMING = config.TIMING;
        TEXT_PATTERNS = config.TEXT_PATTERNS;

        console.log('Auto DVIC: Configuration loaded successfully');

        // Initialize the extension after config is loaded
        initialize();
    } catch (error) {
        console.error('Auto DVIC: Failed to load configuration:', error);
    }
})();



// Function to gather vehicle information
function gatherVehicleInfo() {
    console.log('Starting vehicle info gathering...');

    // First try to find the main container
    const mainContainer = document.querySelector(SELECTORS.MAIN_CONTAINER);
    if (!mainContainer) {
        console.error('Main container not found');
        showError('Page Error', 'Main vehicle info container not found. Please ensure you are on the correct Amazon Fleet Portal page.');
        return null;
    }

    // Get all pill items
    const pillItems = mainContainer.querySelectorAll(SELECTORS.PILL_ITEMS);
    console.log(`Found ${pillItems.length} pill items`);

    // Helper function to get text from a specific pill item
    const getPillText = (index) => {
        if (index < pillItems.length) {
            const text = pillItems[index].textContent.trim();
            console.log(`Pill ${index + 1} text:`, text);
            return text;
        }
        console.log(`Pill ${index + 1} not found`);
        return '';
    };

    // Get license plate and state from second pill (index 1)
    const licensePillText = getPillText(1);
    console.log('License pill text:', licensePillText);

    // Split on parentheses to separate plate and state
    const parts = licensePillText.split('(');
    const license = parts[0].trim();
    const state = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
    console.log('Extracted:', { license, state });

    // Get VIN from third pill (index 2)
    const vin = getPillText(2);

    // Get mileage from fifth pill (index 4)
    const mileageText = getPillText(4);
    console.log('Checking mileage text:', mileageText);

    let mileage = '';
    let assetType = '';

    // Only process mileage and asset type if mileage starts with numbers
    if (/^\d/.test(mileageText)) {
        console.log('Valid mileage format found');
        const mileageMatch = mileageText.match(/(\d+)\s*miles/);
        mileage = mileageMatch ? mileageMatch[1] : '';

        // Only get asset type if we have valid mileage
        if (mileage) {
            assetType = getPillText(5);
        }
    } else if (mileageText === 'Mileage unknown') {
        console.log('Mileage unknown found');
        // Get asset type even if mileage is unknown
        assetType = getPillText(5);
    } else {
        console.log('Invalid mileage format, skipping mileage and asset type');
    }

    const vehicleInfo = {
        lic: license,
        lic_state: state,
        vin: vin,
        odo: mileage,
        asset_type: assetType
    };

    console.log('Extracted vehicle info:', vehicleInfo);
    return vehicleInfo;
}

// Function to handle DVIC submission flow
async function handleDvicSubmission(formData) {
    console.log('Starting DVIC submission flow with data:', formData);
    console.log('Inspection type from formData:', {
        type: formData.inspectionType,
        typeOf: typeof formData.inspectionType,
        isPostTrip: formData.inspectionType === 'Post-Trip' || formData.inspectionType.toLowerCase() === 'post',
        rawValue: formData.inspectionType
    });

    try {
        // Find and click the upload inspection button
        const uploadButton = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim().toLowerCase() === TEXT_PATTERNS.UPLOAD_INSPECTION
        );

        if (!uploadButton) {
            showError('Missing Button', 'Could not find the "Upload Inspection" button. The page layout may have changed.');
            throw new Error('Upload inspection button not found');
        }

        // Click the upload button
        uploadButton.click();
        console.log('Clicked upload inspection button');

        // Wait for upload dialog to appear
        await new Promise(resolve => setTimeout(resolve, TIMING.DIALOG_LOAD));

        // Find file upload element
        const fileUploadElement = document.querySelector(SELECTORS.FILE_UPLOAD_ELEMENT) ||
            Array.from(document.querySelectorAll('a')).find(a =>
                a.textContent.trim().toLowerCase() === SELECTORS.FILE_UPLOAD_LINK_TEXT
            );

        if (!fileUploadElement) {
            showError('Upload Error', 'Could not find the file upload area. Please try refreshing the page.');
            throw new Error('File upload element not found');
        }

        // Get element position
        const rect = fileUploadElement.getBoundingClientRect();

        // Create dimming overlay (split into two parts)
        const topOverlay = document.createElement('div');
        topOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: ${rect.top - 10}px;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;

        const bottomOverlay = document.createElement('div');
        bottomOverlay.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 10}px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;

        const leftOverlay = document.createElement('div');
        leftOverlay.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: 0;
            width: ${rect.left - 10}px;
            height: ${rect.height + 20}px;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;

        const rightOverlay = document.createElement('div');
        rightOverlay.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: ${rect.right + 10}px;
            right: 0;
            height: ${rect.height + 20}px;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(topOverlay);
        document.body.appendChild(bottomOverlay);
        document.body.appendChild(leftOverlay);
        document.body.appendChild(rightOverlay);

        // Create highlight effect
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 5}px;
            left: ${rect.left - 5}px;
            width: ${rect.width + 10}px;
            height: ${rect.height + 10}px;
            z-index: 9998;
            border: 2px solid #077398;
            border-radius: 8px;
            pointer-events: none;
            animation: pulse 2s infinite;
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(7, 115, 152, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(7, 115, 152, 0); }
                100% { box-shadow: 0 0 0 0 rgba(7, 115, 152, 0); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(highlight);

        // Create floating message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 20}px;
            left: 50%;
            transform: translateX(-50%);
            background: #077398;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none;
        `;
        message.textContent = 'Please select the DVIC PDF that was just downloaded';
        document.body.appendChild(message);

        // Remove elements when file input changes or after timeout
        const cleanup = () => {
            highlight.remove();
            topOverlay.remove();
            bottomOverlay.remove();
            leftOverlay.remove();
            rightOverlay.remove();
            message.remove();
            style.remove();
        };

        // Add listener for file selection
        const fileInput = document.querySelector(SELECTORS.FILE_INPUT);
        if (fileInput) {
            fileInput.addEventListener('change', async () => {
                // Clean up overlay
                cleanup();

                // Wait for file upload to process
                await new Promise(resolve => setTimeout(resolve, TIMING.FILE_PROCESS));

                // Set inspection type if post-trip
                const isPostTrip = formData.inspectionType === 'Post-Trip' ||
                    formData.inspectionType.toLowerCase() === 'post';
                console.log('Checking inspection type:', {
                    formDataType: formData.inspectionType,
                    isPostTrip,
                    typeComparison: formData.inspectionType === 'Post-Trip',
                    lowercaseComparison: formData.inspectionType.toLowerCase() === 'post'
                });

                if (isPostTrip) {
                    console.log('Attempting to select Post-Trip inspection type...');

                    // Wait for radio buttons to be available
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Find all radio buttons first
                    const allRadios = document.querySelectorAll(SELECTORS.RADIO_INPUTS);
                    console.log('Found radio buttons:', Array.from(allRadios).map(r => ({
                        value: r.value,
                        name: r.name,
                        type: r.type,
                        checked: r.checked,
                        ariaChecked: r.getAttribute('aria-checked'),
                        class: r.className,
                        parentText: r.parentElement?.textContent?.trim()
                    })));

                    // Try to find post-trip radio
                    const postTripRadio = Array.from(allRadios).find(radio =>
                        radio.value === SELECTORS.POST_TRIP_RADIO_VALUE &&
                        radio.name === SELECTORS.INSPECTION_TYPE_RADIO_NAME
                    );

                    if (postTripRadio) {
                        console.log('Found post-trip radio:', {
                            value: postTripRadio.value,
                            name: postTripRadio.name,
                            checked: postTripRadio.checked,
                            ariaChecked: postTripRadio.getAttribute('aria-checked')
                        });

                        try {
                            // Try multiple selection methods
                            const methods = [
                                // Method 1: Direct click
                                async () => {
                                    postTripRadio.click();
                                    console.log('Method 1: Clicked radio directly');
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                },
                                // Method 2: Set properties
                                async () => {
                                    postTripRadio.checked = true;
                                    postTripRadio.setAttribute('aria-checked', 'true');
                                    console.log('Method 2: Set radio properties');
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                },
                                // Method 3: Dispatch events
                                async () => {
                                    postTripRadio.dispatchEvent(new Event('change', { bubbles: true }));
                                    postTripRadio.dispatchEvent(new Event('input', { bubbles: true }));
                                    console.log('Method 3: Dispatched events');
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                },
                                // Method 4: Click label
                                async () => {
                                    const label = postTripRadio.closest('label') ||
                                        document.querySelector(`label[for="${postTripRadio.id}"]`);
                                    if (label) {
                                        label.click();
                                        console.log('Method 4: Clicked label');
                                    }
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                            ];

                            // Try each method in sequence
                            for (const method of methods) {
                                await method();
                                // Check if it worked
                                if (postTripRadio.checked) {
                                    console.log('Selection successful after method');
                                    break;
                                }
                            }

                            // Final verification
                            await new Promise(resolve => setTimeout(resolve, TIMING.UI_UPDATE));
                            console.log('Final radio state:', {
                                checked: postTripRadio.checked,
                                ariaChecked: postTripRadio.getAttribute('aria-checked')
                            });

                        } catch (err) {
                            console.error('Error selecting post-trip:', err);
                            showWarning('Selection Error', 'Could not automatically select Post-Trip inspection. Please select it manually.');
                        }
                    } else {
                        console.error('Post-trip radio button not found');
                        showWarning('Selection Error', 'Post-trip radio button not found. Please select inspection type manually.');
                    }
                }

                // Wait for any animations or state updates
                await new Promise(resolve => setTimeout(resolve, TIMING.UI_UPDATE));

                // Fill in driver name with autocomplete handling
                async function fillDriverName(retryCount = 0) {
                    console.log(`Attempting to fill driver name (attempt ${retryCount + 1})`);

                    // Only find the input field on first attempt
                    if (retryCount === 0) {
                        const driverNameInput = document.querySelector(SELECTORS.DRIVER_NAME_INPUT) ||
                            document.querySelector(SELECTORS.DRIVER_NAME_INPUT_ALT);

                        if (!driverNameInput) {
                            console.error('Driver input not found');
                            showError('Form Error', 'Driver name input field not found.');
                            throw new Error('Driver name input not found');
                        }

                        console.log('Found driver input field');

                        // Store the input field for retries
                        fillDriverName.inputField = driverNameInput;

                        // Focus and click the input
                        driverNameInput.focus();
                        driverNameInput.click();
                    }

                    const driverNameInput = fillDriverName.inputField;

                    // Set the value and trigger input event
                    driverNameInput.value = formData.daName;
                    driverNameInput.dispatchEvent(new Event('input', { bubbles: true }));

                    console.log('Set driver name:', formData.daName);
                    console.log('Expected transporter ID:', formData.transporterId);

                    // Function to verify transporter ID
                    const verifyTransporterId = () => {
                        const transporterInput = document.querySelector(SELECTORS.TRANSPORTER_ID_INPUT);
                        if (!transporterInput) {
                            console.log('Transporter ID input not found');
                            return false;
                        }

                        // Extract the transporter ID from the input
                        const currentTransporterId = transporterInput.value.trim();
                        const expectedTransporterId = formData.transporterId.trim();

                        console.log('Current transporter ID:', currentTransporterId);
                        console.log('Expected transporter ID:', expectedTransporterId);

                        // If either ID is empty, return false
                        if (!currentTransporterId || !expectedTransporterId) {
                            console.log('One or both transporter IDs are empty');
                            return false;
                        }

                        // Compare the IDs
                        const isMatch = currentTransporterId === expectedTransporterId;
                        console.log('Transporter ID match:', isMatch);
                        return isMatch;
                    };

                    // Function to get driver options
                    const getDriverOptions = async () => {
                        // First set the driver name to trigger the dropdown
                        driverNameInput.value = formData.daName;
                        driverNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Find the combobox container
                        const container = driverNameInput.closest('[mdn-input-box]');
                        if (!container) {
                            console.log('Could not find combobox container');
                            return [];
                        }

                        // Click the container to open dropdown
                        container.click();
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Focus the input and ensure it has the correct value
                        driverNameInput.focus();
                        if (driverNameInput.value !== formData.daName) {
                            driverNameInput.value = formData.daName;
                            driverNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Make sure aria-expanded is set
                        const input = container.querySelector(SELECTORS.COMBOBOX_INPUT);
                        if (input) {
                            input.setAttribute('aria-expanded', 'true');
                            input.setAttribute('aria-haspopup', 'true');
                        }

                        // Get options and log them
                        const options = Array.from(document.querySelectorAll(SELECTORS.COMBOBOX_OPTIONS));
                        options.forEach((opt, i) => {
                            console.log(`Option ${i + 1}:`, opt.textContent);
                        });

                        return options;
                    };

                    // Create a promise that resolves when the correct driver is found
                    return new Promise(async (resolve) => {
                        let currentAttempt = 0;
                        const maxAttempts = 10;
                        let isResolved = false;

                        const tryDriver = async () => {
                            if (isResolved) return;

                            // Check if current selection is correct
                            await new Promise(resolve => setTimeout(resolve, 300));
                            if (verifyTransporterId()) {
                                console.log('Current selection has correct transporter ID');
                                isResolved = true;
                                resolve();
                                return;
                            }

                            // If not correct, get options and try next one
                            const options = await getDriverOptions();
                            console.log(`Found ${options.length} driver options`);

                            if (currentAttempt < options.length) {
                                // Click the next option
                                options[currentAttempt].click();
                                console.log(`Trying driver option ${currentAttempt + 1} of ${options.length}`);

                                // Wait for selection to take effect
                                await new Promise(resolve => setTimeout(resolve, 300));

                                // Check if this selection is correct
                                if (verifyTransporterId()) {
                                    console.log('Found matching driver with correct transporter ID');
                                    isResolved = true;
                                    resolve();
                                    return;
                                }

                                // Try next option if not resolved
                                if (!isResolved) {
                                    currentAttempt++;
                                    if (currentAttempt < maxAttempts) {
                                        setTimeout(tryDriver, 300);
                                    } else {
                                        promptManualSelection();
                                    }
                                }
                            } else {
                                if (!isResolved) {
                                    promptManualSelection();
                                }
                            }
                        };

                        const promptManualSelection = () => {
                            if (isResolved) return;

                            console.log('Prompting for manual driver selection');
                            const rect = driverNameInput.getBoundingClientRect();
                            const overlay = document.createElement('div');
                            overlay.style.cssText = `
                                position: fixed;
                                top: ${rect.top - 5}px;
                                left: ${rect.left - 5}px;
                                width: ${rect.width + 10}px;
                                height: ${rect.height + 10}px;
                                border: 2px solid #ff6b6b;
                                border-radius: 4px;
                                background: rgba(255, 107, 107, 0.1);
                                z-index: 9999;
                                pointer-events: none;
                            `;
                            document.body.appendChild(overlay);

                            showCustomAlert(
                                'Driver Selection Required',
                                'Please select the correct driver manually.'
                            );

                            // Watch for changes to the transporter ID field
                            const transporterInput = document.querySelector(SELECTORS.TRANSPORTER_ID_INPUT);
                            if (transporterInput) {
                                const observer = new MutationObserver(async () => {
                                    if (isResolved) {
                                        observer.disconnect();
                                        return;
                                    }

                                    if (verifyTransporterId()) {
                                        console.log('Correct driver selected by user');
                                        isResolved = true;
                                        observer.disconnect();
                                        document.body.removeChild(overlay);
                                        resolve();
                                    }
                                });

                                observer.observe(transporterInput, {
                                    subtree: true,
                                    characterData: true,
                                    childList: true,
                                    attributes: true
                                });
                            }
                        };

                        // Start with first attempt
                        tryDriver();
                    });
                }

                // Try to fill driver name with retry
                try {
                    console.log('Starting driver name fill process');
                    await fillDriverName(0);
                } catch (error) {
                    console.error('Error in driver name fill process:', error);
                }

                // Fill in date
                const dateInput = Array.from(document.querySelectorAll('input[type="text"]')).find(input => {
                    const label = input.getAttribute('aria-label') || '';
                    return label.toLowerCase().includes('inspection date');
                });

                if (dateInput) {
                    // Parse the date parts directly to avoid timezone issues
                    const [year, month, day] = formData.inspDate.split('-').map(Number);
                    const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
                    dateInput.value = formattedDate;
                    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('Filled in date:', formattedDate);

                    // Wait for UI to update
                    await new Promise(resolve => setTimeout(resolve, TIMING.UI_UPDATE));
                }

                // Fill in time
                const timeInput = document.querySelector('input[type="time"]') ||
                    Array.from(document.querySelectorAll('input[type="text"]')).find(input => {
                        const label = input.getAttribute('aria-label') || '';
                        const placeholder = input.getAttribute('placeholder') || '';
                        return label.toLowerCase().includes('inspection time') ||
                            placeholder.toLowerCase().includes('time') ||
                            input.id?.toLowerCase().includes('time');
                    });

                if (timeInput) {
                    // Parse the time
                    const [hours, minutes] = formData.inspTime.split(':');
                    const hour = parseInt(hours, 10);

                    // Format time as HHMMam/pm (no colon, no spaces)
                    const hour12 = hour % 12 || 12;
                    const ampm = hour < 12 ? 'AM' : 'PM';
                    const formattedTime = `${hour12.toString().padStart(2, '0')}${minutes}${ampm}`;

                    timeInput.value = formattedTime;
                    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('Filled in time:', formattedTime);

                    // Wait for UI to update
                    await new Promise(resolve => setTimeout(resolve, TIMING.UI_UPDATE));
                }

                // Handle defects radio selection after all inputs are filled
                console.log('Handling defects radio selection...');
                const allRadios = document.querySelectorAll(SELECTORS.RADIO_INPUTS);
                const defectsRadios = Array.from(allRadios).filter(radio =>
                    radio.name === SELECTORS.DEFECTS_RADIO_NAME
                );

                if (defectsRadios.length === 2) {
                    // Check if there are any issues selected
                    const hasIssues = formData.issues && Object.keys(formData.issues).length > 0;
                    console.log('Checking for issues:', { hasIssues, issues: formData.issues });

                    // If no issues were selected, select "No"
                    if (!hasIssues) {
                        const noDefectsRadio = defectsRadios.find(radio => radio.value === 'false');
                        if (noDefectsRadio) {
                            console.log('No issues found, selecting "No" for defects');
                            noDefectsRadio.click();
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    } else {
                        // If issues were selected, select "Yes"
                        const yesDefectsRadio = defectsRadios.find(radio => radio.value === 'true');
                        if (yesDefectsRadio) {
                            console.log('Issues found, selecting "Yes" for defects');
                            yesDefectsRadio.click();
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                } else {
                    console.error('Could not find defects radio buttons');
                    showWarning('Form Warning', 'Could not find defects radio buttons. Please select defects manually.');
                }

                // Wait for any animations or state updates
                await new Promise(resolve => setTimeout(resolve, TIMING.UI_UPDATE));

                // Find and click the Next button
                const nextButton = Array.from(document.querySelectorAll('button')).find(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    return btn.className.includes(SELECTORS.NEXT_BUTTON) && (
                        text.includes(TEXT_PATTERNS.NEXT_REVIEW_SUBMIT) ||
                        text.includes(TEXT_PATTERNS.NEXT_SELECT_DEFECTS)
                    );
                });

                if (nextButton) {
                    console.log('Clicking next button:', nextButton.textContent.trim());
                    nextButton.click();

                    // If we have issues, handle the issue selection page
                    if (formData.issues && Object.keys(formData.issues).length > 0) {
                        console.log('Issues found, waiting for defects page to load...');
                        await new Promise(resolve => setTimeout(resolve, TIMING.DEFECTS_PAGE_LOAD));

                        // First expand all dropdowns
                        const dropdowns = document.querySelectorAll(SELECTORS.DROPDOWNS);
                        console.log('Found dropdowns to expand:', dropdowns.length);

                        for (const dropdown of dropdowns) {
                            const expandButton = dropdown.firstElementChild;
                            if (expandButton) {
                                expandButton.click();
                                await new Promise(resolve => setTimeout(resolve, TIMING.DROPDOWN_EXPAND));
                            }
                        }

                        // Wait for all dropdowns to fully expand
                        await new Promise(resolve => setTimeout(resolve, TIMING.DROPDOWN_SETTLE));

                        const issues = formData.issues || {};
                        console.log('Processing issues:', issues);

                        // Import shared mappings
                        // Note: content.js is injected, so we need access to the module
                        // The build process or import mechanism needs to handle this
                        const { issueMapping, categoryMapping, validateMappings } = await import(chrome.runtime.getURL('src/shared/issue-definitions.js'));

                        // Run validation on load to warn about any inconsistencies
                        const validation = validateMappings();
                        if (!validation.valid) {
                            console.warn('Auto DVIC Issue Mapping Warnings:', validation.errors);
                        }

                        // Keep track of issues we couldn't find
                        const unfoundIssues = [];

                        // Process each issue
                        for (const [issueId, issueText] of Object.entries(issues)) {
                            // Get the exact text from our mapping
                            const fleetPortalText = issueMapping[issueId];
                            if (!fleetPortalText) {
                                console.error('No fleet portal text mapping found for issue:', issueId);
                                showWarning('Mapping Issue', `Could not find mapping for issue ID: ${issueId}. It may need manual selection.`);
                                continue;
                            }

                            // Get category and subcategory from our mapping
                            const mappingInfo = categoryMapping[issueId];
                            if (!mappingInfo) {
                                console.error('No category/subcategory mapping found for issue:', issueId);
                                showWarning('Mapping Issue', `No category defined for issue ID: ${issueId}.`);
                                continue;
                            }

                            console.log('Looking for issue:', {
                                id: issueId,
                                text: fleetPortalText,
                                category: mappingInfo.category,
                                subcategory: mappingInfo.subcategory
                            });

                            let found = false;

                            // Find all category sections
                            const categoryContainers = document.querySelectorAll(SELECTORS.CATEGORY_CONTAINERS);
                            console.log('Found category sections:', categoryContainers.length);

                            // Search through each category section
                            for (const container of categoryContainers) {
                                // Find the category text - try multiple selectors since the structure might vary
                                let categoryText = '';
                                const categoryDiv = container.querySelector(SELECTORS.CATEGORY_DIV);

                                if (categoryDiv) {
                                    categoryText = categoryDiv.textContent?.trim();
                                } else {
                                    console.log('Could not find category text element, skipping section');
                                    continue;
                                }

                                if (!categoryText) {
                                    console.log('Category text is empty, skipping section');
                                    continue;
                                }

                                console.log('Found category text:', categoryText);

                                // Check if this is the matching category
                                if (categoryText === mappingInfo.category) {
                                    console.log('Found matching category:', categoryText);

                                    // Get the parent category container
                                    const categoryContainer = categoryDiv.closest(SELECTORS.CATEGORY_CONTAINERS);
                                    if (!categoryContainer) {
                                        console.log('Could not find category container');
                                        continue;
                                    }

                                    // Find subcategories in this category container
                                    const subcategories = categoryContainer.querySelectorAll(SELECTORS.SUBCATEGORIES);
                                    console.log('Found subcategories in category:', subcategories.length);

                                    // Find the matching subcategory
                                    let matchingSubcategory = null;
                                    for (const sub of subcategories) {
                                        if (sub.textContent.trim() === mappingInfo.subcategory) {
                                            matchingSubcategory = sub;
                                            break;
                                        }
                                    }

                                    if (!matchingSubcategory) {
                                        console.log('Subcategory not found in this category section:', mappingInfo.subcategory);
                                        continue;
                                    }

                                    console.log('Found matching subcategory:', mappingInfo.subcategory);

                                    // Find the issues container
                                    const issuesContainer = categoryContainer.querySelector(SELECTORS.ISSUES_CONTAINER);
                                    if (!issuesContainer) {
                                        console.log('Could not find issues container');
                                        continue;
                                    }

                                    console.log('Found issues container');

                                    // Find the fieldset containing the issues
                                    const issuesFieldset = issuesContainer.querySelector(SELECTORS.ISSUES_FIELDSET);
                                    if (!issuesFieldset) {
                                        console.log('Could not find issues fieldset');
                                        continue;
                                    }

                                    console.log('Found issues fieldset');

                                    // Find all issue elements in the fieldset
                                    const issueElements = issuesFieldset.querySelectorAll(SELECTORS.ISSUE_ELEMENTS);
                                    console.log('Found issue elements:', issueElements.length);

                                    // Look for exact text match in each issue element
                                    for (const issueElement of issueElements) {
                                        // Get the text from the div inside the label
                                        const issueDiv = issueElement.querySelector('label > div');
                                        if (!issueDiv) continue;

                                        const issueText = issueDiv.textContent.trim();
                                        if (issueText === fleetPortalText) {
                                            console.log('Found exact match:', {
                                                category: mappingInfo.category,
                                                subcategory: mappingInfo.subcategory,
                                                text: issueText
                                            });

                                            // Find the checkbox which is an input inside the label
                                            const checkbox = issueElement.querySelector('label > input[type="checkbox"]');
                                            if (checkbox && !checkbox.checked) {
                                                console.log('Clicking checkbox for:', {
                                                    category: mappingInfo.category,
                                                    subcategory: mappingInfo.subcategory,
                                                    text: issueText
                                                });
                                                checkbox.click();
                                                await new Promise(resolve => setTimeout(resolve, 200));
                                                found = true;
                                                break;
                                            } else {
                                                console.error('Checkbox not found or already checked:', {
                                                    issueId,
                                                    category: mappingInfo.category,
                                                    subcategory: mappingInfo.subcategory,
                                                    text: issueText,
                                                    checkboxFound: !!checkbox,
                                                    isChecked: checkbox?.checked
                                                });
                                            }
                                        }
                                    }

                                    if (found) break;
                                }
                            }

                            if (!found) {
                                console.error('No matching issue found for:', {
                                    issueId,
                                    category: mappingInfo.category,
                                    subcategory: mappingInfo.subcategory,
                                    text: fleetPortalText
                                });
                                unfoundIssues.push({
                                    text: fleetPortalText,
                                    category: mappingInfo.category,
                                    subcategory: mappingInfo.subcategory
                                });
                            }
                        }

                        // After processing all issues, check if we had any unfound ones
                        if (unfoundIssues.length > 0) {
                            // Create a message listing all unfound issues
                            let message = 'Some issues could not be automatically selected. Please manually select these issues:\n\n';
                            unfoundIssues.forEach(issue => {
                                message += `• ${issue.text}\n   Category: ${issue.category}\n   Subcategory: ${issue.subcategory}\n\n`;
                            });
                            message += '\nAfter selecting these issues, please click the "Review and Submit" button to continue.';

                            // Show the notification
                            chrome.runtime.sendMessage({
                                action: 'showNotification',
                                title: 'Manual Selection Required',
                                message: message
                            });

                            return; // Stop here and let user handle it manually
                        }

                        // If all issues were found, continue with automation
                        const reviewButton = document.querySelector('.css-c6ayu0');
                        if (reviewButton) {
                            console.log('Clicking review button:', reviewButton.textContent.trim());
                            reviewButton.click();

                            // Wait for review page to load
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            // Find and log the final submit button
                            const submitButton = Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.trim().toLowerCase();
                                return btn.className.includes('css-c6ayu0') && text === 'submit inspection';
                            });

                            if (submitButton) {
                                console.log('Found submit button:', {
                                    text: submitButton.textContent.trim(),
                                    class: submitButton.className,
                                    disabled: submitButton.disabled,
                                    type: submitButton.type
                                });

                                // Check if development mode is enabled
                                const { devMode } = await chrome.storage.sync.get({ devMode: false });
                                if (devMode) {
                                    console.log('Development mode enabled - skipping submission');
                                    showCustomAlert('Dev Mode', 'Form submission skipped (development mode enabled)');
                                } else {
                                    console.log('Submitting inspection...');
                                    submitButton.click();
                                }
                            } else {
                                console.error('Could not find submit button');
                                showError('Submit Error', 'Could not find the final "Submit Inspection" button.');
                            }
                        } else {
                            console.error('Could not find review button');
                            showError('Navigation Error', 'Could not find the "Review" button.');
                        }
                    } else {
                        // No issues case - wait for page change and log submit
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const submitButton = Array.from(document.querySelectorAll('button')).find(btn => {
                            const text = btn.textContent.trim().toLowerCase();
                            return btn.className.includes('css-c6ayu0') && text === 'submit inspection';
                        });

                        if (submitButton) {
                            console.log('Found submit button:', {
                                text: submitButton.textContent.trim(),
                                class: submitButton.className,
                                disabled: submitButton.disabled,
                                type: submitButton.type
                            });

                            // Check if development mode is enabled
                            const { devMode } = await chrome.storage.sync.get({ devMode: false });
                            if (devMode) {
                                console.log('Development mode enabled - skipping submission');
                                showCustomAlert('Dev Mode', 'Form submission skipped (development mode enabled)');
                            } else {
                                console.log('Submitting inspection...');
                                submitButton.click();
                            }
                        } else {
                            console.error('Could not find submit button');
                            showError('Submit Error', 'Could not find the "Submit Inspection" button.');
                        }
                    }
                } else {
                    console.error('Next button not found');
                    showError('Navigation Error', 'Could not find the "Next" button.');
                }
            });
        }

        // Cleanup after 30 seconds
        setTimeout(cleanup, 30000);

    } catch (error) {
        console.error('Error in submission flow:', error);
        showError('Submission Error', `An error occurred: ${error.message}`, error.stack);
        chrome.runtime.sendMessage({
            action: 'submissionError',
            error: error.message
        });
    }
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

// Notification type configurations
const NOTIFICATION_TYPES = {
    error: {
        borderColor: '#dc3545',
        titleColor: '#dc3545',
        icon: '❌',
        buttonBg: '#dc3545',
        duration: 15000
    },
    warning: {
        borderColor: '#e47911',
        titleColor: '#e47911',
        icon: '⚠️',
        buttonBg: '#e47911',
        duration: 10000
    },
    info: {
        borderColor: '#077398',
        titleColor: '#077398',
        icon: 'ℹ️',
        buttonBg: '#077398',
        duration: 7000
    },
    success: {
        borderColor: '#28a745',
        titleColor: '#28a745',
        icon: '✓',
        buttonBg: '#28a745',
        duration: 5000
    }
};

// Track active notifications for stacking
let activeNotifications = [];
const NOTIFICATION_GAP = 10;
const NOTIFICATION_TOP_OFFSET = 20;

// Calculate the top position for a new notification
function getNextNotificationTop() {
    if (activeNotifications.length === 0) {
        return NOTIFICATION_TOP_OFFSET;
    }

    let maxBottom = NOTIFICATION_TOP_OFFSET;
    activeNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            const rect = notification.getBoundingClientRect();
            maxBottom = Math.max(maxBottom, rect.bottom + NOTIFICATION_GAP);
        }
    });

    return maxBottom;
}

// Remove a notification and reposition remaining ones
function removeNotification(notification) {
    const index = activeNotifications.indexOf(notification);
    if (index > -1) {
        activeNotifications.splice(index, 1);
    }

    if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            repositionNotifications();
        }, 300);
    }
}

// Reposition notifications after one is removed
function repositionNotifications() {
    let currentTop = NOTIFICATION_TOP_OFFSET;
    activeNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            notification.style.top = `${currentTop}px`;
            const rect = notification.getBoundingClientRect();
            currentTop = currentTop + rect.height + NOTIFICATION_GAP;
        }
    });
}

/**
 * Show a notification to the user
 * @param {string} type - 'error', 'warning', 'info', or 'success'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Optional: { duration, details }
 */
function showNotification(type, title, message, options = {}) {
    const style = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    const duration = options.duration !== undefined ? options.duration : style.duration;

    const notification = document.createElement('div');
    notification.className = `auto-dvic-notification auto-dvic-notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: ${getNextNotificationTop()}px;
        right: 20px;
        max-width: 400px;
        min-width: 300px;
        background: white;
        border: 2px solid ${style.borderColor};
        border-left-width: 4px;
        border-radius: 8px;
        padding: 16px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transform: translateX(20px);
        transition: opacity 0.3s ease, transform 0.3s ease, top 0.3s ease;
    `;

    // Header with icon, title, and close button
    const header = document.createElement('div');
    header.style.cssText = `display: flex; align-items: center; gap: 8px; margin-bottom: 8px;`;

    const icon = document.createElement('span');
    icon.style.cssText = `font-size: 18px;`;
    icon.textContent = style.icon;

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `font-weight: 600; font-size: 15px; color: ${style.titleColor}; flex: 1;`;
    titleDiv.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: none; border: none; font-size: 16px; color: #666;
        cursor: pointer; padding: 0; line-height: 1; opacity: 0.6;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
    closeBtn.onclick = () => removeNotification(notification);

    header.appendChild(icon);
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);

    // Message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `color: #333; font-size: 14px; line-height: 1.5;`;
    messageDiv.textContent = message;

    notification.appendChild(header);
    notification.appendChild(messageDiv);

    // Optional details section
    if (options.details) {
        const detailsToggle = document.createElement('button');
        detailsToggle.textContent = 'Show details';
        detailsToggle.style.cssText = `
            background: none; border: none; color: #666; font-size: 12px;
            cursor: pointer; padding: 0; margin-top: 8px; text-decoration: underline;
        `;

        const detailsDiv = document.createElement('div');
        detailsDiv.style.cssText = `
            display: none; background: #f5f5f5; padding: 8px; border-radius: 4px;
            font-family: monospace; font-size: 11px; color: #666; margin-top: 8px;
            max-height: 100px; overflow-y: auto; word-break: break-word;
        `;
        detailsDiv.textContent = options.details;

        detailsToggle.onclick = () => {
            const isVisible = detailsDiv.style.display !== 'none';
            detailsDiv.style.display = isVisible ? 'none' : 'block';
            detailsToggle.textContent = isVisible ? 'Show details' : 'Hide details';
        };

        notification.appendChild(detailsToggle);
        notification.appendChild(detailsDiv);
    }

    // Add to DOM and track
    document.body.appendChild(notification);
    activeNotifications.push(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });

    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => removeNotification(notification), duration);
    }

    // Log to console
    const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[logMethod](`[Auto DVIC ${type.toUpperCase()}]`, title, message, options.details || '');

    return notification;
}

// Convenience functions
function showError(title, message, details = null) {
    return showNotification('error', title, message, { details });
}

function showWarning(title, message, details = null) {
    return showNotification('warning', title, message, { details });
}

function showInfo(title, message) {
    return showNotification('info', title, message);
}

function showSuccess(title, message) {
    return showNotification('success', title, message);
}

// Legacy function for backward compatibility
function showCustomAlert(title, message) {
    return showNotification('warning', title, message);
}

// Listen for messages from background script
// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    if (message.action === 'startSubmission') {
        handleDvicSubmission(message.data).catch(error => {
            console.error('Submission error:', error);
            showError('Submission Error', error.message, error.stack);
            chrome.runtime.sendMessage({
                action: 'submissionError',
                error: error.message
            });
        });
    } else if (message.action === 'gatherVehicleInfo') {
        console.log('Received gatherVehicleInfo request');
        try {
            const info = gatherVehicleInfo();
            if (info) {
                chrome.runtime.sendMessage({
                    action: 'vehicleInfoUpdated',
                    data: info
                });
                showSuccess('Vehicle Info', 'Successfully gathered vehicle information');
            } else {
                showWarning('Vehicle Info', 'Could not gather all vehicle information');
            }
        } catch (error) {
            console.error('Error gathering vehicle info:', error);
            showError('Vehicle Discovery Error', error.message, error.stack);
        }
    } else if (message.action === 'showAlert') {
        showNotification('info', message.title, message.message);
    } else if (message.action === 'popupClosed') {
        console.log('Popup closed');
    }
});

// Create and insert the Auto DVIC button
function createAutoDvicButton() {
    const container = document.createElement('span');
    container.className = 'auto-dvic-container';
    container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
    `;

    const button = document.createElement('button');
    button.textContent = 'Auto DVIC';
    button.className = 'auto-dvic-button';
    button.style.cssText = `
        background-color: #077398;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 22px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        -webkit-font-smoothing: antialiased;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        letter-spacing: -0.01em;
    `;

    // Add hover effect
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#055d7a';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#077398';
        button.style.transform = 'none';
        button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
    });

    // Add click handler
    button.addEventListener('click', async () => {
        try {
            console.log('Button clicked, gathering info...');
            const vehicleInfo = gatherVehicleInfo();

            if (!vehicleInfo) {
                throw new Error('Failed to gather vehicle information');
            }

            // Store vehicle info
            await storage.local.set({ vehicleInfo });
            console.log('Successfully stored vehicle info:', vehicleInfo);

            // Visual feedback
            const originalText = button.textContent;
            button.textContent = '✓ Info Gathered';
            button.style.backgroundColor = '#10b981';

            // Tell background script to store current tab ID and open popup
            chrome.runtime.sendMessage({
                action: 'openPopupFromPage'
            });

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '#077398';
            }, 2000);
        } catch (error) {
            console.error('Error:', error.message);
            button.textContent = '❌ Error';
            button.style.backgroundColor = '#ef4444';

            setTimeout(() => {
                button.textContent = 'Auto DVIC';
                button.style.backgroundColor = '#077398';
            }, 2000);
        }
    });

    // Add spacer
    const spacer = document.createElement('div');
    spacer.style.width = '8px';

    container.appendChild(button);
    container.appendChild(spacer);
    return container;
}

// Function to check if we're on a vehicle details page AND the Inspections tab is selected
function isVehicleDetailsPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    // First check if we're on a vehicle details page
    const isVehiclePage = (
        // Direct vehicle URL pattern
        /\/fleet-management\/vehicles\/[^\/]+/.test(path) ||
        // Hash-based routing pattern
        (path === '/fleet-management' && hash.includes('#vehicles/')) ||
        // Query parameter pattern
        (path === '/fleet-management' && params.has('vehicleId'))
    );

    // If not on a vehicle page, return false immediately
    if (!isVehiclePage) {
        return false;
    }

    // Check if the "Inspections" tab is active by looking for the radio input
    const radioInputs = document.querySelectorAll(SELECTORS.TAB_RADIO_INPUTS);
    for (const input of radioInputs) {
        // Check if this is the Inspections tab input and it's active
        if (input.value === 'INSPECTIONS' && input.tabIndex === 0) {
            return true;
        }
    }

    // If we didn't find the active Inspections tab input, return false
    return false;
}

// Function to find and inject button
function findAndInjectButton() {
    // Don't add if button already exists
    if (document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
        return false;
    }

    let uploadButton = null;

    // First try the specific CSS selector
    const cssElements = document.querySelectorAll(SELECTORS.UPLOAD_BUTTONS);
    for (const element of cssElements) {
        if (element.textContent.trim() === TEXT_PATTERNS.UPLOAD_INSPECTION) {
            uploadButton = element;
            break;
        }
    }

    // If not found, look for button with span containing text
    if (!uploadButton) {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const span = button.querySelector('span');
            if (span && span.textContent.trim() === TEXT_PATTERNS.UPLOAD_INSPECTION) {
                uploadButton = button;
                break;
            }
        }
    }

    if (uploadButton) {
        const buttonContainer = createAutoDvicButton();
        uploadButton.parentNode.insertBefore(buttonContainer, uploadButton);
        console.log('Auto DVIC button successfully injected');
        return true;
    }
    return false;
}

// Function to check URL and add button if appropriate
function checkAndAddButton() {
    // Only proceed if we're on a vehicle details page and not already injecting
    if (!isVehicleDetailsPage() || injectionInProgress) {
        return;
    }

    injectionInProgress = true;
    let attempts = 0;
    const maxAttempts = 10; // Increased from 5 to 10
    const retryInterval = 500;

    const retryInjection = () => {
        if (attempts >= maxAttempts) {
            console.log('Max injection attempts reached, resetting injection state');
            injectionInProgress = false;
            return;
        }

        if (findAndInjectButton()) {
            console.log('Button injection successful on attempt', attempts + 1);
            injectionInProgress = false;
            return;
        }

        attempts++;
        // More gradual backoff to give more chances with reasonable delays
        const delay = retryInterval * (1 + Math.min(attempts, 3));
        console.log(`Button injection attempt ${attempts} failed, retrying in ${delay}ms`);
        setTimeout(retryInjection, delay);
    };

    retryInjection();
}

// Track injection state
let injectionInProgress = false;
let lastUrl = location.href;
let periodicCheckTimer = null;

// Function to handle URL/state changes
function handleUrlChange() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) {
        return;
    }

    console.log('URL changed to:', currentUrl);
    lastUrl = currentUrl;

    // Reset injection state on URL change
    injectionInProgress = false;
    checkAndAddButton();

    // Set up periodic checks for a short time after URL change
    clearTimeout(periodicCheckTimer);
    setupPeriodicButtonCheck();
}

// Function to periodically check for the button after navigation
function setupPeriodicButtonCheck() {
    // Clear any existing timer
    clearTimeout(periodicCheckTimer);

    let checkCount = 0;
    const maxChecks = 5;
    const checkInterval = 1000; // 1 second between checks

    const performCheck = () => {
        // Stop checking if we've reached max attempts or if we're not on a vehicle page
        if (checkCount >= maxChecks || !isVehicleDetailsPage()) {
            console.log('Periodic checks complete or no longer on vehicle page');
            clearTimeout(periodicCheckTimer);
            return;
        }

        checkCount++;

        // Check if button already exists
        const buttonExists = document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER) !== null;

        // If we're on a vehicle page but the button isn't present, try again
        if (!buttonExists && !injectionInProgress) {
            console.log(`Periodic check ${checkCount}: Button not found, triggering injection`);
            checkAndAddButton();
        } else {
            console.log(`Periodic check ${checkCount}: ${buttonExists ? 'Button already exists' : 'Injection in progress'}`);
        }

        // Schedule next check
        periodicCheckTimer = setTimeout(performCheck, checkInterval);
    };

    // Start the periodic checks
    periodicCheckTimer = setTimeout(performCheck, checkInterval);
}

// Function to check for DOM readiness
function isDomReady() {
    return document.readyState === 'complete' || document.readyState === 'interactive';
}

// Initial setup with DOM ready check
function initialize() {
    if (!isDomReady()) {
        document.addEventListener('DOMContentLoaded', initialize);
        return;
    }

    // Initial button check
    checkAndAddButton();

    // Set up initial periodic check
    setupPeriodicButtonCheck();

    // Set up URL change listeners
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Listen for navigation events that might not trigger the above
    window.addEventListener('load', () => {
        injectionInProgress = false;
        checkAndAddButton();
    });

    // Set up tab change detection
    setupTabChangeDetection();

    // Watch for specific DOM changes that might indicate navigation
    const navObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Look for changes to navigation elements
            if (mutation.target.classList &&
                (mutation.target.classList.contains('nav') ||
                    mutation.target.classList.contains('menu') ||
                    mutation.target.tagName === 'NAV')) {
                console.log('Navigation element changed, checking URL');
                handleUrlChange();
                break;
            }

            // Check for attribute changes on tabs
            if (mutation.type === 'attributes' &&
                (mutation.target.classList.contains(SELECTORS.TAB_CLASS_ALT.replace('.', '')) ||
                    mutation.target.getAttribute('role') === 'tab')) {
                handleUrlChange();
                break;
            }
        }
    });

    // Try to find navigation elements to observe
    const navElements = document.querySelectorAll(SELECTORS.NAV_ELEMENTS);
    if (navElements.length > 0) {
        console.log(`Found ${navElements.length} navigation elements to observe`);
        navElements.forEach(nav => {
            navObserver.observe(nav, {
                childList: true,
                subtree: true,
                attributes: true
            });
        });
    }

    // Watch for SPA navigation through content changes
    const contentObserver = new MutationObserver((mutations) => {
        // Check if URL has changed
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            handleUrlChange();
            return;
        }

        // Check for significant DOM changes that might indicate content loading
        let significantChanges = false;

        for (const mutation of mutations) {
            // Look for added nodes that might be the main content
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        (node.classList.contains('main-content') ||
                            node.id === 'main-content' ||
                            node.tagName === 'MAIN' ||
                            (node.classList.length > 0 && node.querySelectorAll('h1, h2').length > 0))) {
                        significantChanges = true;
                        break;
                    }
                }
            }

            if (significantChanges) break;
        }

        if (significantChanges) {
            console.log('Significant content changes detected, checking for button injection');

            // If we detect a significant content change, check if we need to inject the button
            if (isVehicleDetailsPage() && !document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER) && !injectionInProgress) {
                console.log('Vehicle page detected after content change, triggering injection');
                checkAndAddButton();
            }
        }
    });

    contentObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also check when the window gets focus, as the user might have navigated in another tab
    window.addEventListener('focus', () => {
        if (isVehicleDetailsPage() && !document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
            console.log('Window focused, checking button presence');
            injectionInProgress = false;
            checkAndAddButton();
        }
    });
}

// Function to set up tab change detection
function setupTabChangeDetection() {
    // Create a mutation observer to watch for tab changes
    const tabObserver = new MutationObserver((mutations) => {
        // Check if we're on a vehicle page
        const path = window.location.pathname;
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);

        // First check if we're on a vehicle details page
        const isVehiclePage = (
            // Direct vehicle URL pattern
            /\/fleet-management\/vehicles\/[^\/]+/.test(path) ||
            // Hash-based routing pattern
            (path === '/fleet-management' && hash.includes('#vehicles/')) ||
            // Query parameter pattern
            (path === '/fleet-management' && params.has('vehicleId'))
        );

        // If not on a vehicle page, return false immediately
        if (!isVehiclePage) {
            return;
        }

        // Look for tab-related changes
        let tabChanged = false;

        for (const mutation of mutations) {
            // Check if this mutation affects tab elements
            if (mutation.target.tagName === 'INPUT' &&
                mutation.target.getAttribute('type') === 'radio' &&
                mutation.target.getAttribute('role') === 'tab') {
                tabChanged = true;
                break;
            }

            // Check for added nodes that might be radio inputs
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        node.tagName === 'INPUT' &&
                        node.getAttribute('type') === 'radio' &&
                        node.getAttribute('role') === 'tab') {
                        tabChanged = true;
                        break;
                    }
                }
                if (tabChanged) break;
            }
        }

        if (tabChanged) {
            console.log('Tab change detected, checking if we need to show/hide the button');

            // If we're on the Inspections tab and the button doesn't exist, add it
            if (isVehicleDetailsPage() && !document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
                console.log('Switched to Inspections tab, injecting button');
                injectionInProgress = false;
                checkAndAddButton();
            }
            // If we're not on the Inspections tab but the button exists, remove it
            else if (!isVehicleDetailsPage() && document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
                console.log('Switched away from Inspections tab, removing button');
                const buttonContainer = document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER);
                if (buttonContainer) {
                    buttonContainer.remove();
                }
            }
        }
    });

    // Observe the entire document for tab changes
    tabObserver.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['tabindex', 'checked', 'value']
    });

    // Also check for clicks on tab elements
    document.addEventListener('click', (event) => {
        // Check if a tab was clicked
        const clickedTab = event.target.closest(SELECTORS.TAB_RADIO_INPUTS) ||
            event.target.closest('label[for]');

        if (clickedTab) {
            console.log('Tab clicked, will check for button visibility after a short delay');
            // Wait a moment for the UI to update
            setTimeout(() => {
                // If we're on the Inspections tab and the button doesn't exist, add it
                if (isVehicleDetailsPage() && !document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
                    console.log('Now on Inspections tab, injecting button');
                    injectionInProgress = false;
                    checkAndAddButton();
                }
                // If we're not on the Inspections tab but the button exists, remove it
                else if (!isVehicleDetailsPage() && document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER)) {
                    console.log('Not on Inspections tab, removing button');
                    const buttonContainer = document.querySelector(SELECTORS.AUTO_DVIC_CONTAINER);
                    if (buttonContainer) {
                        buttonContainer.remove();
                    }
                }
            }, 300); // Short delay to allow UI to update
        }
    });
}



// Add message listener for fallback alerts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showAlert') {
        showCustomAlert(request.title, request.message);
    }
});
