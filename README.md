# Auto DVIC Extension

Chrome extension to automate DVIC form filling and submission in Amazon Fleet Portal.

## Project Structure
```
Auto DVIC/
├── manifest.json               # Extension configuration
├── src/                        # Source code
│   ├── background/             # Background scripts
│   │   └── background.js       # Main background service worker
│   ├── content/                # Content scripts
│   │   ├── content.js          # Vehicle info gathering and Fleet Portal interaction
│   │   ├── selectors.js        # DOM Selectors configuration
│   │   └── issue-mappings.js   # Issue mapping configuration
│   ├── styles/                 # CSS styles
│   │   └── common.css          # Common styles
│   ├── utils/                  # Utility scripts
│   │   └── pdf-handler.js      # PDF generation and handling
│   ├── popup/                  # Popup UI
│   │   ├── popup.html          # Main popup interface
│   │   ├── popup.css           # Popup styles
│   │   └── popup.js            # Popup functionality
│   ├── onboarding/             # Onboarding UI
│   │   ├── onboarding.html     # Settings and onboarding page
│   │   ├── onboarding.css      # Onboarding styles
│   │   └── onboarding.js       # Settings management
│   └── vendor/                 # Third-party libraries
│       └── pdf-lib/            # PDF manipulation library
├── assets/                     # Static assets
│   ├── icons/                  # Extension icons
│   │   ├── icon16.png          # 16x16 icon
│   │   ├── icon48.png          # 48x48 icon
│   │   └── icon128.png         # 128x128 icon
│   ├── pdf/                    # PDF templates and documentation
│   │   ├── Blank DVIC.pdf      # DVIC form template
│   │   └── form-structure.txt  # Form field documentation
│   ├── fleet_portal.txt        # Fleet portal page structure documentation
│   └──AutoDVIC_Logo.png        # Project logo
└── README.md                   # Project documentation
```

## Features

### Automated Data Collection
- Automatically extracts vehicle information from Fleet Portal:
  - License plate and state
  - Vehicle Identification Number (VIN)
  - Asset type
  - Current mileage
- Smart driver selection from Associate list CSV
- Automatic date and time handling with AM/PM detection

### Smart Form Interface
- Modern, Apple-inspired design
- Collapsible inspection sections
- Visual distinction for DOT and EV-specific items
- Smart validation and error prevention
- Real-time form field validation
- Customizable inspection location override
- Smooth section navigation and scrolling

### Vehicle Condition Reporting
- Comprehensive issue selection interface
- Organized by vehicle sections:
  - Front Side
  - Driver Side
  - Back Side
  - Passenger Side
  - In Cab
- Visual indicators for selected issues
- Automatic defect reporting in Fleet Portal

### PDF Generation
- Automatic PDF form filling
- Proper formatting of all fields:
  - Driver information
  - Vehicle details
  - Inspection data
  - Selected issues
- Consistent checkbox state management
- Configurable save location

### Fleet Portal Integration
- One-click inspection submission
- Automatic form navigation
- Smart retry mechanism for driver selection
- Intelligent issue selection and verification
- Progress tracking and status updates
- Development mode for testing without submission

### Data Management
- Secure local storage of preferences
- DSP and Station code configuration
- Driver list import from CSV
- Smart driver name autocomplete
- Settings persistence across sessions
- Development mode configuration

### User Experience
- Streamlined onboarding process
- Clear error messages and notifications

### Security & Reliability
- **Robust DOM Interaction**: Event-based listeners replace brittle observers for reliable form tracking.
- **Defensive Programming**: Comprehensive input validation and safe type coercion prevent runtime crashes.
- **XSS Prevention**: Strict content handling and DOM creation policies ensure secure data rendering.
- **Self-Validating**: Integrated test suite ensures selector integrity and mapping consistency.
- Visual progress indicators
- Detailed logging for troubleshooting
- Responsive and intuitive interface

## Installation

1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Initial Setup

1. Click the Auto DVIC extension icon
2. Enter your DSP code and station code in the settings
3. Import your Associate list CSV for driver selection
4. Configure optional preferences

## Usage

1. Navigate to the Fleet Portal vehicle page
2. Click the "Auto DVIC" button that appears
3. Fill in the inspection details:
   - Select inspection type (Pre-Trip/Post-Trip)
   - Enter driver name (with autocomplete)
   - Verify date and time
   - Enter odometer reading (optional)
   - Set custom location (optional)
   - Mark any issues found during inspection
4. Click "Begin Inspection Submission"
5. The extension will:
   - Generate and format the PDF inspection
   - Save the PDF to your configured location
   - Navigate the Fleet Portal submission process
   - Submit all information automatically
   - Provide progress updates throughout

## Version History

### v1.1.6 (2026-02-02)
- **UI/UX Overhaul**:
  - Implemented "Slate" dark theme with improved contrast and visibility.
  - Added custom high-contrast checkboxes and unified UI styling.
  - Redesigned popup header and introduced a consolidated menu system.
  - Added "New!" badge and "Recent Changes" notifications.
- **Core Improvements**:
  - Fixed connection reliability issues with robust tab tracking.
  - Added Theme Toggle (Light/Dark/System) with cross-page persistence.
- **Technical Refactoring**:
  - Externalized UI selectors and timing constants into dedicated `selectors.js` module.
  - Added validation tests to ensure selector integrity and usage consistency.
  - Enhanced maintainability through modular content script architecture.

### v1.1.5 (2026-01-31)
- Refactored issue mapping system:
  - Extracted hardcoded mappings to a dedicated `issue-mappings.js` file for better maintainability.
  - Added automated validation tests to ensure mapping integrity.
  - Modularized content script architecture.

### v1.1.4 (2025-05-30)
- Improved Inspection Type selection: replaced dropdown with toggle button group for clearer, safer choice.
- Increased field contrast: all form fields now stand out more from the background for better accessibility.
- Improved section and field alignment: fixed padding, borders, and box-sizing so all sections and fields are visually aligned and nothing sticks out.
- Responsive padding: ensured comfortable margins on all screen sizes.
- Added a blank DVIC PDF download link to the popup interface for users to download the template.

### v1.1.3 (2025-03-22)
- Enhanced onboarding experience for first-time users:
  - Added floating checklist to guide users through required setup steps
  - Implemented field highlighting to draw attention to required actions
  - Added persistence of onboarding completion status
  - Included restart button to allow users to revisit the onboarding process
- Improved driver import section:
  - Redesigned the CSV import interface with clearer button placement
  - Added "Get CSV from Amazon" button for easier access to driver data
- Added "Missing Driver?" tooltip in the popup to help users update their driver list
- Created comprehensive extension style guide for future development

### v1.1.2 (2025-03-15)
- Improved button injection behavior for tab-specific content:
  - Button now only appears on the "Inspections" tab of vehicle details pages
  - Added tab change detection to show/hide button when switching tabs
  - Fixed issues with button not appearing when navigating via DSP web app menu
- Reduced permissions requirements:
  - Removed unnecessary `scripting`, `tabs`, and `downloads` permissions
  - Enhanced security and improved Chrome Web Store compatibility

### v1.1.1 (2025-02-15)
- Enhanced Auto DVIC button injection reliability:
  - Improved state management to prevent multiple injection attempts
  - Added smart retry logic with exponential backoff
  - Better handling of SPA navigation and page updates
- Fixed issues with button appearing multiple times
- Optimized page load detection for more consistent button placement

### v1.1.0 (2025-01-20)
- Improved driver selection logic to better handle transporter ID matching
- Optimized timing for smoother driver selection process

### Version 1.0.0 (2025-01-13 - Initial Release)
- Complete DVIC automation system with Fleet Portal integration
- Intelligent vehicle information extraction from portal
- Smart driver selection with CSV import and autocomplete
- Modern UI with collapsible sections and visual feedback
- Comprehensive issue selection and reporting
- Automated PDF generation with proper formatting
- Fleet Portal submission automation:
  - Smart form navigation
  - Automatic field population
  - Issue selection and verification
  - Progress tracking
- Robust error handling and user feedback
- Secure local data storage
- Configurable settings and preferences
- Detailed logging for troubleshooting
- Extensive documentation and usage guides

## Security
- All data is stored locally in Chrome's secure storage
- No external data transmission except to Amazon Fleet portal
- Secure handling of driver and vehicle information
- Minimal permission requirements (see PERMISSIONS.md for details)

## Permissions

The extension requires the following permissions to function:
- `activeTab`: For interacting with the Fleet Portal
- `storage`: For storing user settings and inspection data

For detailed justification of each permission, see `PERMISSIONS.md`.

## License

This project is proprietary software. All rights reserved.
