const fs = require('fs');
const path = require('path');
const { issueMapping, categoryMapping } = require('../src/content/issue-mappings.js');

console.log('Starting mapping validation...');

let errorCount = 0;

// 1. Validate issueMapping values are strings
for (const [key, value] of Object.entries(issueMapping)) {
    if (typeof value !== 'string' || value.trim() === '') {
        console.error(`Error: Issue mapping for '${key}' is invalid (empty or not a string).`);
        errorCount++;
    }
}

// 2. Validate categoryMapping structure
for (const [key, value] of Object.entries(categoryMapping)) {
    if (!value.category || !value.subcategory) {
        console.error(`Error: Category mapping for '${key}' is missing category or subcategory.`);
        errorCount++;
    }
}

// 3. Check for consistency between mappings
// Every key in issueMapping should exist in categoryMapping
for (const key of Object.keys(issueMapping)) {
    if (!categoryMapping[key]) {
        console.error(`Error: Key '${key}' exists in issueMapping but MISSING in categoryMapping.`);
        errorCount++;
    }
}

// Every key in categoryMapping should exist in issueMapping
for (const key of Object.keys(categoryMapping)) {
    if (!issueMapping[key]) {
        console.error(`Error: Key '${key}' exists in categoryMapping but MISSING in issueMapping.`);
        errorCount++;
    }
}

if (errorCount === 0) {
    console.log(`Validation successful! Checked ${Object.keys(issueMapping).length} issues.`);
    process.exit(0);
} else {
    console.error(`Validation failed with ${errorCount} errors.`);
    process.exit(1);
}
