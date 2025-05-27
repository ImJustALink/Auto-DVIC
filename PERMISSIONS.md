# Auto DVIC Extension Permissions

This document explains why each permission in the extension's manifest is necessary for its functionality.

## Required Permissions

### `"activeTab"`
- Required to interact with the currently active Fleet Portal tab
- Used to gather vehicle information and inject the Auto DVIC button
- Allows the extension to modify page content only when the user is actively using it

### `"storage"`
- Stores user configuration data:
  - DSP and Station codes
  - Driver list information
  - Setup completion status
- Maintains current inspection data between extension components
- Preserves user settings across browser sessions

## Previously Required Permissions (Now Removed)

The following permissions were previously required but have been removed in v1.1.2 to improve security and Chrome Web Store compatibility:

### `"scripting"` (Removed)
- Previously used for dynamic content script injection
- Now replaced with more efficient content script implementation
- Functionality maintained through content scripts declared in manifest

### `"tabs"` (Removed)
- Previously used for managing popup and onboarding windows
- Now handled through more targeted activeTab permission
- Communication between extension components now uses more efficient methods

### `"downloads"` (Removed)
- Previously used for saving generated PDF inspection forms
- Now handled through browser's native download capabilities
- Improves security by reducing permission scope

## Host Permissions

### `"*://logistics.amazon.com/fleet-management/*"`
- Required to interact with the Amazon Fleet Portal
- Limited to only the specific domain needed for functionality
- Ensures the extension only runs on relevant Amazon logistics pages

## Permission Usage Notes

1. All permissions are essential for core functionality
2. Permissions are used only when necessary
3. The extension does not collect any personal data
4. All data is stored locally in the browser
5. No data is transmitted to external servers
