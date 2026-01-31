/**
 * Centralized DOM Selectors Configuration
 * 
 * All Amazon Fleet Portal CSS selectors in one place for easy updates.
 * When Amazon changes their CSS classes, update these values.
 */

export const SELECTORS = {
    // ==========================================
    // Vehicle Info Page
    // ==========================================
    MAIN_CONTAINER: '.css-qodthi',
    PILL_ITEMS: '[class*="pill-item"]',

    // ==========================================
    // Upload Dialog
    // ==========================================
    FILE_UPLOAD_ELEMENT: '.css-1b9zydf',
    FILE_UPLOAD_LINK_TEXT: 'select file to upload',
    FILE_INPUT: 'input[type="file"]',

    // ==========================================
    // Form Elements
    // ==========================================
    DRIVER_NAME_INPUT: '.css-1geyss9 input',
    DRIVER_NAME_INPUT_ALT: '#select-68',
    TRANSPORTER_ID_INPUT: 'input[class="css-ys1hc6"][placeholder="Transporter ID"]',
    COMBOBOX_CONTAINER: '[mdn-input-box]',
    COMBOBOX_INPUT: 'input[role="combobox"]',
    COMBOBOX_OPTIONS: '[role="option"]',

    // ==========================================
    // Inspection Type
    // ==========================================
    RADIO_INPUTS: 'input[type="radio"]',
    POST_TRIP_RADIO_VALUE: 'POST_TRIP_DVIC',
    INSPECTION_TYPE_RADIO_NAME: 'inspectionType',
    DEFECTS_RADIO_NAME: 'defectsFoundQues',

    // ==========================================
    // Defects Page
    // ==========================================
    DROPDOWNS: '.css-1lne09z',
    CATEGORY_CONTAINERS: '.css-ly5121',
    CATEGORY_DIV: '.css-1ropudr',
    SUBCATEGORIES: '.css-86vfqe',
    ISSUES_CONTAINER: '.css-z5nhup',
    ISSUES_FIELDSET: '.css-1ce8hpl',
    ISSUE_ELEMENTS: '.css-a8par6',
    ISSUE_LABEL_DIV: 'label > div',
    ISSUE_CHECKBOX: 'label > input[type="checkbox"]',

    // ==========================================
    // Buttons
    // ==========================================
    NEXT_BUTTON: '.css-c6ayu0',
    UPLOAD_BUTTONS: '.css-z4yfkz',

    // ==========================================
    // Tab Detection
    // ==========================================
    TAB_RADIO_INPUTS: 'input[type="radio"][role="tab"]',
    TAB_CLASS_ALT: '.css-14dbfau',

    // ==========================================
    // Extension UI (not Amazon-dependent)
    // ==========================================
    AUTO_DVIC_CONTAINER: '.auto-dvic-container',
    NAV_ELEMENTS: 'nav, .nav, .menu, [role="navigation"]'
};

/**
 * Timing Configuration (in milliseconds)
 * 
 * Adjust these values if the extension is running too fast/slow
 * for the Amazon portal to respond.
 */
export const TIMING = {
    DIALOG_LOAD: 1000,
    UI_UPDATE: 500,
    DROPDOWN_EXPAND: 100,
    DROPDOWN_SETTLE: 250,
    RADIO_SELECT: 200,
    DRIVER_DROPDOWN: 300,
    FILE_PROCESS: 500,
    ANIMATION: 300,
    DEFECTS_PAGE_LOAD: 1000
};

/**
 * Text patterns for finding elements by content
 */
export const TEXT_PATTERNS = {
    UPLOAD_INSPECTION: 'upload inspection',
    NEXT_REVIEW_SUBMIT: 'next: review & submit',
    NEXT_SELECT_DEFECTS: 'next: select defects',
    SUBMIT_INSPECTION: 'submit inspection'
};
