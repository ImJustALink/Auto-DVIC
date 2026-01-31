const fs = require('fs');
const path = require('path');

// Load the selectors file directly since it supports CommonJS
const { selectors, timing } = require('../src/content/selectors.js');

console.log('Starting selector validation...');
let errorCount = 0;

// Helper to validate object values recursively
function validateObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
            validateObject(value, currentPath);
        } else if (typeof value === 'string') {
            if (value.trim() === '') {
                console.error(`Error: Empty string at ${currentPath}`);
                errorCount++;
            }
        } else if (typeof value === 'number') {
            // Numbers are fine for indices
        } else {
            console.error(`Error: Invalid type at ${currentPath}: ${typeof value}`);
            errorCount++;
        }
    }
}

validateObject(selectors, 'selectors');

console.log('\nValidating timing constants...');
for (const [key, value] of Object.entries(timing)) {
    if (typeof value !== 'number' || value < 0) {
        console.error(`Error: Invalid timing constant at timing.${key}: ${value}`);
        errorCount++;
    }
}

if (errorCount === 0) {
    console.log('Validation successful! All selectors and timing constants are valid.');
} else {
    console.error(`Validation failed with ${errorCount} errors.`);
    process.exit(1);
}
