// Handle the inspection process
async function handleInspection(data) {
    // Store the inspection data
    await chrome.storage.local.set({ currentInspection: data });

    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script to start gathering information
    chrome.tabs.sendMessage(tab.id, {
        action: 'gatherVehicleInfo',
        data: data
    });
}

// Function to check if setup is complete
async function checkSetupStatus() {
    const result = await chrome.storage.sync.get(['setupComplete']);
    return {
        isComplete: !!result.setupComplete
    };
}

// Function to open onboarding page
function openOnboardingPage() {
    chrome.tabs.create({
        url: 'src/onboarding/onboarding.html'
    });
}

// Function to open DVIC form popup
async function openDvicForm() {
    // First check if setup is complete
    const setup = await checkSetupStatus();
    if (!setup.isComplete) {
        openOnboardingPage();
        return;
    }

    // Get window dimensions using chrome.windows API
    chrome.windows.getCurrent(async (currentWindow) => {
        const width = 400;
        const height = 600;
        const left = Math.round((currentWindow.width - width) / 2 + currentWindow.left);
        const top = Math.round((currentWindow.height - height) / 2 + currentWindow.top);

        // Create popup window for the DVIC form
        chrome.windows.create({
            url: 'src/popup/popup.html',
            type: 'popup',
            width,
            height,
            left,
            top,
            focused: true
        });
    });
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openPopupFromPage':
            // Store the source tab ID and open popup
            chrome.storage.local.set({ sourceTabId: sender.tab.id }, () => {
                openDvicForm();
            });
            break;
            
        case 'startSubmission':
            handleSubmissionFlow(request.data);
            break;
            
        case 'submissionUpdate':
            // Forward progress updates to popup
            chrome.runtime.sendMessage({
                action: 'submissionProgress',
                data: request.data
            });
            break;
            
        case 'submissionError':
            // Forward errors to popup
            chrome.runtime.sendMessage({
                action: 'submissionError',
                error: request.error
            });
            break;
            
        case 'handleInspection':
            handleInspection(request.data);
            break;
            
        case 'checkSetup':
            checkSetupStatus().then(sendResponse);
            return true;
            
        case 'getCurrentTab':
            chrome.tabs.query({ active: true, currentWindow: true }, sendResponse);
            return true; // Will respond asynchronously
            
        case 'openDvicForm':
            openDvicForm();
            break;
            
        case 'showNotification':
            // Send the notification directly to the content script
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'showAlert',
                title: request.title,
                message: request.message
            });
            break;
            
        default:
            console.log('Unknown action:', request.action);
    }
});

// Handle the submission flow
async function handleSubmissionFlow(formData) {
    try {
        // Get the source tab ID from storage
        const { sourceTabId } = await chrome.storage.local.get(['sourceTabId']);
        if (!sourceTabId) {
            throw new Error('Source tab not found');
        }

        // Store submission data
        await chrome.storage.local.set({ currentSubmission: formData });

        // Send message to the original tab
        await chrome.tabs.sendMessage(sourceTabId, {
            action: 'startSubmission',
            data: formData
        });
    } catch (error) {
        console.error('Submission flow error:', error);
        chrome.runtime.sendMessage({
            action: 'submissionError',
            error: error.message || 'Failed to start submission'
        });
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        openOnboardingPage();
    }
});
