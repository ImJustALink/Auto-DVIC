(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.AutoDVIC_Selectors = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // CSS Selectors
    const selectors = {
        vehicle: {
            mainContainer: '.css-qodthi',
            pillItems: '[class*="pill-item"]', // Helper for gathering vehicle info
            licensePillIndex: 1,
            vinPillIndex: 2,
            mileagePillIndex: 4,
            assetTypePillIndex: 5
        },
        form: {
            driverInput: '.css-1geyss9 input',
            driverInputBackup: '#select-68',
            transporterIdInput: 'input[class="css-ys1hc6"][placeholder="Transporter ID"]',
            comboboxContainer: '[mdn-input-box]',
            comboboxInput: 'input[role="combobox"]',
            dropdownOption: '[role="option"]',
            dateInputLabel: 'inspection date',
            timeInputType: 'time',
            timeInputLabel: 'inspection time',
            timeInputPlaceholder: 'time'
        },
        issues: {
            categoryContainer: '.css-ly5121',
            categoryHeader: '.css-1ropudr',
            subcategory: '.css-86vfqe',
            issuesContainer: '.css-z5nhup',
            issuesFieldset: '.css-1ce8hpl',
            issueElement: '.css-a8par6',
            issueLabelDiv: 'label > div',
            issueCheckbox: 'label > input[type="checkbox"]',
            dropdownExpand: '.css-1lne09z',
            defectsRadioName: 'defectsFoundQues'
        },
        submission: {
            uploadButton: 'button', // Needs text content check "Upload inspection"
            fileUploadElement: '.css-1b9zydf',
            fileUploadElementBackup: 'a', // Needs text check "Select file to upload"
            fileInput: 'input[type="file"]',
            radioButtons: 'input[type="radio"]',
            nextButtonClass: 'css-c6ayu0',
            submitButtonClass: 'css-c6ayu0'
        },
        navigation: {
            uploadButtonContainer: '.css-z4yfkz',
            tabClass: '.css-14dbfau',
            navElements: 'nav, .nav, .menu, [role="navigation"]',
            inspectionsTabSelector: 'input[type="radio"][role="tab"]',
            inspectionsTabValue: 'INSPECTIONS'
        },
        overlays: {
            // Classes for custom overlays if we decide to move styles to classes later
            // Currently inline styles are used in content.js
        }
    };

    // Timing constants (in milliseconds)
    const timing = {
        SHORT_DELAY: 100,
        MEDIUM_DELAY: 200,
        DROPDOWN_DELAY: 300,
        UI_UPDATE_DELAY: 500,
        UPLOAD_DELAY: 1000,
        SUBMISSION_DELAY: 1000,
        CHECK_INTERVAL: 1000,
        MAX_WAIT: 30000
    };

    return {
        selectors,
        timing
    };
}));
