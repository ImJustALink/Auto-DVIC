// Initialize Chrome storage
const storage = chrome.storage || browser.storage;

// Helper to get selectors with safety check
const getSelectors = () => {
    if (!window.AutoDVIC_Selectors) {
        throw new Error('AutoDVIC_Selectors not found. Extension context may be invalid.');
    }
    return window.AutoDVIC_Selectors;
};

// Helper to get class name without dot
const getClassName = (selector) => {
    return selector.startsWith('.') ? selector.substring(1) : selector;
};

// Function to gather vehicle information
function gatherVehicleInfo() {
    console.log('Starting vehicle info gathering...');
    const { selectors } = getSelectors();
    const { vehicle } = selectors;

    // First try to find the main container
    const mainContainer = document.querySelector(vehicle.mainContainer);
    if (!mainContainer) {
        console.error('Main container not found');
        return null;
    }

    // Get all pill items
    const pillItems = mainContainer.querySelectorAll(vehicle.pillItems);
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

    const { selectors, timing } = getSelectors();
    const { submission, form, issues } = selectors;

    try {
        // Find and click the upload inspection button
        const uploadButton = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim().toLowerCase() === 'upload inspection'
        );

        if (!uploadButton) {
            throw new Error('Upload inspection button not found');
        }

        // Click the upload button
        uploadButton.click();
        console.log('Clicked upload inspection button');

        // Wait for upload dialog to appear
        await new Promise(resolve => setTimeout(resolve, timing.SUBMISSION_DELAY));

        // Find file upload element
        const fileUploadElement = document.querySelector(submission.fileUploadElement) ||
            Array.from(document.querySelectorAll('a')).find(a =>
                a.textContent.trim().toLowerCase() === 'select file to upload'
            );

        if (!fileUploadElement) {
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
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', async () => {
                // Clean up overlay
                cleanup();

                // Wait for file upload to process
                await new Promise(resolve => setTimeout(resolve, timing.UI_UPDATE_DELAY));

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
                    await new Promise(resolve => setTimeout(resolve, timing.SHORT_DELAY));

                    // Find all radio buttons first
                    const allRadios = document.querySelectorAll('input[type="radio"]');
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
                        radio.value === 'POST_TRIP_DVIC' &&
                        radio.name === 'inspectionType'
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
                                    await new Promise(resolve => setTimeout(resolve, timing.MEDIUM_DELAY));
                                },
                                // Method 2: Set properties
                                async () => {
                                    postTripRadio.checked = true;
                                    postTripRadio.setAttribute('aria-checked', 'true');
                                    console.log('Method 2: Set radio properties');
                                    await new Promise(resolve => setTimeout(resolve, timing.SELECTION_DELAY));
                                },
                                // Method 3: Dispatch events
                                async () => {
                                    postTripRadio.dispatchEvent(new Event('change', { bubbles: true }));
                                    postTripRadio.dispatchEvent(new Event('input', { bubbles: true }));
                                    console.log('Method 3: Dispatched events');
                                    await new Promise(resolve => setTimeout(resolve, timing.SELECTION_DELAY));
                                },
                                // Method 4: Click label
                                async () => {
                                    const label = postTripRadio.closest('label') ||
                                        document.querySelector(`label[for="${postTripRadio.id}"]`);
                                    if (label) {
                                        label.click();
                                        console.log('Method 4: Clicked label');
                                    }
                                    await new Promise(resolve => setTimeout(resolve, timing.MEDIUM_DELAY));
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
                            await new Promise(resolve => setTimeout(resolve, timing.ANIMATION_DELAY));
                            console.log('Final radio state:', {
                                checked: postTripRadio.checked,
                                ariaChecked: postTripRadio.getAttribute('aria-checked')
                            });

                        } catch (err) {
                            console.error('Error selecting post-trip:', err);
                        }
                    } else {
                        console.error('Post-trip radio button not found');
                    }
                }

                // Wait for any animations or state updates
                await new Promise(resolve => setTimeout(resolve, timing.ANIMATION_DELAY));

                // Fill in driver name with autocomplete handling
                async function fillDriverName(retryCount = 0) {
                    console.log(`Attempting to fill driver name (attempt ${retryCount + 1})`);

                    // Only find the input field on first attempt
                    if (retryCount === 0) {
                        const driverNameInput = document.querySelector(form.driverInput) ||
                            document.querySelector(form.driverInputBackup);

                        if (!driverNameInput) {
                            console.error('Driver input not found');
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
                        const transporterInput = document.querySelector(form.transporterIdInput);
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
                        await new Promise(resolve => setTimeout(resolve, timing.DROPDOWN_DELAY));

                        // Find the combobox container
                        const container = driverNameInput.closest(form.comboboxContainer);
                        if (!container) {
                            console.log('Could not find combobox container');
                            return [];
                        }

                        // Click the container to open dropdown
                        container.click();
                        await new Promise(resolve => setTimeout(resolve, timing.DROPDOWN_DELAY));

                        // Focus the input and ensure it has the correct value
                        driverNameInput.focus();
                        if (driverNameInput.value !== formData.daName) {
                            driverNameInput.value = formData.daName;
                            driverNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        await new Promise(resolve => setTimeout(resolve, timing.DROPDOWN_DELAY));

                        // Make sure aria-expanded is set
                        const input = container.querySelector(form.comboboxInput);
                        if (input) {
                            input.setAttribute('aria-expanded', 'true');
                            input.setAttribute('aria-haspopup', 'true');
                        }

                        // Get options and log them
                        const options = Array.from(document.querySelectorAll(form.dropdownOption));
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
                            await new Promise(resolve => setTimeout(resolve, timing.DROPDOWN_DELAY));
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
                                await new Promise(resolve => setTimeout(resolve, timing.DROPDOWN_DELAY));

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
                                        setTimeout(tryDriver, timing.DROPDOWN_DELAY);
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
                            const transporterInput = document.querySelector(form.transporterIdInput);
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
                    await new Promise(resolve => setTimeout(resolve, timing.UI_UPDATE_DELAY));
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
                    await new Promise(resolve => setTimeout(resolve, timing.UI_UPDATE_DELAY));
                }

                // Handle defects radio selection after all inputs are filled
                console.log('Handling defects radio selection...');
                const allRadios = document.querySelectorAll(submission.radioButtons);
                const defectsRadios = Array.from(allRadios).filter(radio =>
                    radio.name === issues.defectsRadioName
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
                            await new Promise(resolve => setTimeout(resolve, timing.SELECTION_DELAY));
                        }
                    } else {
                        // If issues were selected, select "Yes"
                        const yesDefectsRadio = defectsRadios.find(radio => radio.value === 'true');
                        if (yesDefectsRadio) {
                            console.log('Issues found, selecting "Yes" for defects');
                            yesDefectsRadio.click();
                            await new Promise(resolve => setTimeout(resolve, timing.SELECTION_DELAY));
                        }
                    }
                } else {
                    console.error('Could not find defects radio buttons');
                }

                // Wait for any animations or state updates
                await new Promise(resolve => setTimeout(resolve, timing.ANIMATION_DELAY));

                // Find and click the Next button
                const nextButton = Array.from(document.querySelectorAll('button')).find(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    // Strip dot for className check
                    return btn.className.includes(getClassName(submission.nextButtonClass)) && (
                        text.includes('next: review & submit') ||
                        text.includes('next: select defects')
                    );
                });

                if (nextButton) {
                    console.log('Clicking next button:', nextButton.textContent.trim());
                    nextButton.click();

                    // If we have issues, handle the issue selection page
                    if (formData.issues && Object.keys(formData.issues).length > 0) {
                        console.log('Issues found, waiting for defects page to load...');
                        await new Promise(resolve => setTimeout(resolve, timing.PAGE_LOAD_DELAY));

                        // First expand all dropdowns
                        const dropdowns = document.querySelectorAll(issues.dropdownExpand);
                        console.log('Found dropdowns to expand:', dropdowns.length);

                        for (const dropdown of dropdowns) {
                            const expandButton = dropdown.firstElementChild;
                            if (expandButton) {
                                expandButton.click();
                                await new Promise(resolve => setTimeout(resolve, timing.SHORT_DELAY));
                            }
                        }

                        // Wait for all dropdowns to fully expand
                        await new Promise(resolve => setTimeout(resolve, 250 /* deliberately keeping hardcoded as it's a visual delay specific to this loop */));

                        const formIssues = formData.issues || {};
                        console.log('Processing issues:', formIssues);

                        // Create mapping of issue IDs to their exact text in the fleet portal
                        // Get mappings from global object
                        const { issueMapping, categoryMapping } = window.AutoDVIC_Mappings || {};

                        if (!issueMapping || !categoryMapping) {
                            console.error('Mappings not found in window.AutoDVIC_Mappings');
                            throw new Error('Critical: Issue mappings not loaded');
                        }

                        // Keep track of issues we couldn't find
                        const unfoundIssues = [];

                        // Process each issue
                        for (const [issueId, issueText] of Object.entries(formIssues)) {
                            // Get the exact text from our mapping
                            const fleetPortalText = issueMapping[issueId];
                            if (!fleetPortalText) {
                                console.error('No fleet portal text mapping found for issue:', issueId);
                                continue;
                            }

                            // Get category and subcategory from our mapping
                            const mappingInfo = categoryMapping[issueId];
                            if (!mappingInfo) {
                                console.error('No category/subcategory mapping found for issue:', issueId);
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
                            const categoryContainers = document.querySelectorAll(issues.categoryContainer);
                            console.log('Found category sections:', categoryContainers.length);

                            // Search through each category section
                            for (const container of categoryContainers) {
                                // Find the category text - try multiple selectors since the structure might vary
                                let categoryText = '';
                                const categoryDiv = container.querySelector(issues.categoryHeader);

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
                                    const categoryContainer = categoryDiv.closest(issues.categoryContainer);
                                    if (!categoryContainer) {
                                        console.log('Could not find category container');
                                        continue;
                                    }

                                    // Find subcategories in this category container
                                    const subcategories = categoryContainer.querySelectorAll(issues.subcategory);
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
                                    const issuesContainer = categoryContainer.querySelector(issues.issuesContainer);
                                    if (!issuesContainer) {
                                        console.log('Could not find issues container');
                                        continue;
                                    }

                                    console.log('Found issues container');

                                    // Find the fieldset containing the issues
                                    const issuesFieldset = issuesContainer.querySelector(issues.issuesFieldset);
                                    if (!issuesFieldset) {
                                        console.log('Could not find issues fieldset');
                                        continue;
                                    }

                                    console.log('Found issues fieldset');

                                    // Find all issue elements in the fieldset
                                    const issueElements = issuesFieldset.querySelectorAll(issues.issueElement);
                                    console.log('Found issue elements:', issueElements.length);

                                    // Look for exact text match in each issue element
                                    for (const issueElement of issueElements) {
                                        // Get the text from the div inside the label
                                        const issueDiv = issueElement.querySelector(issues.issueLabelDiv);
                                        if (!issueDiv) continue;

                                        const issueText = issueDiv.textContent.trim();
                                        if (issueText === fleetPortalText) {
                                            console.log('Found exact match:', {
                                                category: mappingInfo.category,
                                                subcategory: mappingInfo.subcategory,
                                                text: issueText
                                            });

                                            // Find the checkbox which is an input inside the label
                                            const checkbox = issueElement.querySelector(issues.issueCheckbox);
                                            if (checkbox && !checkbox.checked) {
                                                console.log('Clicking checkbox for:', {
                                                    category: mappingInfo.category,
                                                    subcategory: mappingInfo.subcategory,
                                                    text: issueText
                                                });
                                                checkbox.click();
                                                await new Promise(resolve => setTimeout(resolve, timing.SELECTION_DELAY));
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
                        const reviewButton = Array.from(document.querySelectorAll('button')).find(btn => {
                            const text = btn.textContent.trim().toLowerCase();
                            // Strip dot for className check
                            return btn.className.includes(getClassName(submission.nextButtonClass)) &&
                                (text.includes('review') || text.includes('next'));
                        });
                        if (reviewButton) {
                            console.log('Clicking review button:', reviewButton.textContent.trim());
                            reviewButton.click();

                            // Wait for review page to load
                            await new Promise(resolve => setTimeout(resolve, timing.PAGE_LOAD_DELAY));

                            // Find and log the final submit button
                            const submitButton = Array.from(document.querySelectorAll('button')).find(btn => {
                                const text = btn.textContent.trim().toLowerCase();
                                return btn.className.includes(getClassName(submission.submitButtonClass)) && text === 'submit inspection';
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
                            }
                        } else {
                            console.error('Could not find review button');
                        }
                    } else {
                        // No issues case - wait for page change and log submit
                        await new Promise(resolve => setTimeout(resolve, timing.PAGE_LOAD_DELAY));

                        const submitButton = Array.from(document.querySelectorAll('button')).find(btn => {
                            const text = btn.textContent.trim().toLowerCase();
                            return btn.className.includes(getClassName(submission.submitButtonClass)) && text === 'submit inspection';
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
                        }
                    }
                } else {
                    console.error('Next button not found');
                }
            });
        }

        // Cleanup after 30 seconds
        setTimeout(cleanup, timing.MAX_WAIT);

    } catch (error) {
        console.error('Error in submission flow:', error);
        chrome.runtime.sendMessage({
            action: 'submissionError',
            error: error.message
        });
    }
}

// Function to show custom alert
function showCustomAlert(title, message) {
    // Create alert container
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border: 2px solid #e47911;
        border-radius: 8px;
        padding: 16px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
        color: #e47911;
    `;
    titleDiv.textContent = title;

    // Add message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        margin-bottom: 16px;
        white-space: pre-wrap;
        color: #333;
    `;
    messageDiv.textContent = message;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        background: #e47911;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        float: right;
    `;
    closeButton.onclick = () => document.body.removeChild(alertDiv);

    // Assemble alert
    alertDiv.appendChild(titleDiv);
    alertDiv.appendChild(messageDiv);
    alertDiv.appendChild(closeButton);
    document.body.appendChild(alertDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(alertDiv)) {
            document.body.removeChild(alertDiv);
        }
    }, 10000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    if (message.action === 'startSubmission') {
        handleDvicSubmission(message.data).catch(error => {
            console.error('Submission error:', error);
            chrome.runtime.sendMessage({
                action: 'submissionError',
                error: error.message
            });
        });
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
    const radioInputs = document.querySelectorAll('input[type="radio"][role="tab"]');
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
    const { selectors } = getSelectors();
    const { navigation } = selectors;

    // Don't add if button already exists
    if (document.querySelector('.auto-dvic-container')) {
        return false;
    }

    let uploadButton = null;

    // First try the specific CSS selector
    const cssElements = document.querySelectorAll(navigation.uploadButtonContainer);
    for (const element of cssElements) {
        if (element.textContent.trim() === 'Upload inspection') {
            uploadButton = element;
            break;
        }
    }

    // If not found, look for button with span containing text
    if (!uploadButton) {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const span = button.querySelector('span');
            if (span && span.textContent.trim() === 'Upload inspection') {
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
    const { timing } = getSelectors();
    // Only proceed if we're on a vehicle details page and not already injecting
    if (!isVehicleDetailsPage() || injectionInProgress) {
        return;
    }

    injectionInProgress = true;
    let attempts = 0;
    const maxAttempts = 10; // Increased from 5 to 10
    const retryInterval = timing.UI_UPDATE_DELAY;

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
    const { timing } = getSelectors();
    // Clear any existing timer
    clearTimeout(periodicCheckTimer);

    let checkCount = 0;
    const maxChecks = 5;
    const checkInterval = timing.CHECK_INTERVAL; // 1 second between checks

    const performCheck = () => {
        // Stop checking if we've reached max attempts or if we're not on a vehicle page
        if (checkCount >= maxChecks || !isVehicleDetailsPage()) {
            console.log('Periodic checks complete or no longer on vehicle page');
            clearTimeout(periodicCheckTimer);
            return;
        }

        checkCount++;

        // Check if button already exists
        const buttonExists = document.querySelector('.auto-dvic-container') !== null;

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
    const { selectors } = getSelectors();
    const { navigation } = selectors;

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
                (mutation.target.classList.contains(getClassName(navigation.tabClass)) ||
                    mutation.target.getAttribute('role') === 'tab')) {
                handleUrlChange();
                break;
            }
        }
    });

    // Try to find navigation elements to observe
    const navElements = document.querySelectorAll(navigation.navElements);
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
            if (isVehicleDetailsPage() && !document.querySelector('.auto-dvic-container') && !injectionInProgress) {
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
        if (isVehicleDetailsPage() && !document.querySelector('.auto-dvic-container')) {
            console.log('Window focused, checking button presence');
            injectionInProgress = false;
            checkAndAddButton();
        }
    });
}

// Function to set up tab change detection
function setupTabChangeDetection() {
    const { selectors } = getSelectors();
    const { navigation } = selectors;

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
            if (isVehicleDetailsPage() && !document.querySelector('.auto-dvic-container')) {
                console.log('Switched to Inspections tab, injecting button');
                injectionInProgress = false;
                checkAndAddButton();
            }
            // If we're not on the Inspections tab but the button exists, remove it
            else if (!isVehicleDetailsPage() && document.querySelector('.auto-dvic-container')) {
                console.log('Switched away from Inspections tab, removing button');
                const buttonContainer = document.querySelector('.auto-dvic-container');
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
        const clickedTab = event.target.closest(navigation.inspectionsTabSelector) ||
            event.target.closest('label[for]');

        if (clickedTab) {
            console.log('Tab clicked, will check for button visibility after a short delay');
            // Wait a moment for the UI to update
            setTimeout(() => {
                // If we're on the Inspections tab and the button doesn't exist, add it
                if (isVehicleDetailsPage() && !document.querySelector('.auto-dvic-container')) {
                    console.log('Now on Inspections tab, injecting button');
                    injectionInProgress = false;
                    checkAndAddButton();
                }
                // If we're not on the Inspections tab but the button exists, remove it
                else if (!isVehicleDetailsPage() && document.querySelector('.auto-dvic-container')) {
                    console.log('Not on Inspections tab, removing button');
                    const buttonContainer = document.querySelector('.auto-dvic-container');
                    if (buttonContainer) {
                        buttonContainer.remove();
                    }
                }
            }, timing.NAV_UPDATE_DELAY); // Short delay to allow UI to update
        }
    });
}

// Start initialization
initialize();

// Add message listener for fallback alerts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showAlert') {
        showCustomAlert(request.title, request.message);
    }
});
