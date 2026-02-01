const fs = require('fs');
const path = require('path');
const { selectors } = require('../src/content/selectors.js');

const contentJsPath = path.join(__dirname, '../src/content/content.js');
const contentJs = fs.readFileSync(contentJsPath, 'utf8');

console.log('Starting selector usage validation...');
let errorCount = 0;

// Regex to find usages like:
// vehicle.mainContainer
// form.driverInput
// selectors.vehicle.mainContainer (though less common given destructuring)
const regex = /\b(vehicle|form|issues|submission|navigation)\.([a-zA-Z0-9_]+)\b/g;

let match;
const foundRefs = new Set();

while ((match = regex.exec(contentJs)) !== null) {
    const [fullMatch, category, key] = match;
    const ref = `${category}.${key}`;
    
    // Avoid duplicates in checking
    if (foundRefs.has(ref)) continue;
    foundRefs.add(ref);

    // Check existence in selectors.js
    if (!selectors[category]) {
        console.error(`Error: Category '${category}' found in content.js but does not exist in selectors.js`);
        errorCount++;
        continue;
    }
    
    if (selectors[category][key] === undefined) {
        console.error(`Error: Selector '${ref}' found in content.js but does not exist in selectors.js`);
        errorCount++;
    } else {
        // console.log(`Verified: ${ref}`);
    }
}

console.log(`Checked ${foundRefs.size} unique selector references.`);

if (errorCount === 0) {
    console.log('Validation successful! All referenced selectors exist.');
    process.exit(0);
} else {
    console.error(`Validation failed with ${errorCount} errors.`);
    process.exit(1);
}
