
import { describe, it, expect } from 'vitest';
import { issueMapping, categoryMapping, validateMappings } from '../src/shared/issue-definitions.js';

describe('Shared Issue Definitions', () => {
    describe('issueMapping', () => {
        it('should have keys and values', () => {
            expect(Object.keys(issueMapping).length).toBeGreaterThan(0);
            for (const [key, value] of Object.entries(issueMapping)) {
                expect(key).toBeTruthy();
                expect(value).toBeTruthy();
                expect(typeof value).toBe('string');
            }
        });

        it('should have consistent ID format (e.g. 1_lights_1)', () => {
            const idPattern = /^\d+_[a-z]+_\d+$/;
            for (const key of Object.keys(issueMapping)) {
                expect(key).toMatch(idPattern);
            }
        });
    });

    describe('categoryMapping', () => {
        it('should have keys corresponding to issueMapping', () => {
            expect(Object.keys(categoryMapping).length).toBeGreaterThan(0);

            // Check that every issue has a category
            for (const key of Object.keys(issueMapping)) {
                expect(categoryMapping).toHaveProperty(key);
            }

            // Check that every category entry maps to a valid issue
            for (const key of Object.keys(categoryMapping)) {
                expect(issueMapping).toHaveProperty(key);
            }
        });

        it('should have valid structure for each entry', () => {
            for (const [key, value] of Object.entries(categoryMapping)) {
                expect(value).toHaveProperty('category');
                expect(value).toHaveProperty('subcategory');
                expect(typeof value.category).toBe('string');
                expect(typeof value.subcategory).toBe('string');
                expect(value.category.length).toBeGreaterThan(0);
                expect(value.subcategory.length).toBeGreaterThan(0);
            }
        });
    });

    describe('validateMappings', () => {
        it('should return valid result for current mappings', () => {
            const result = validateMappings();
            if (!result.valid) {
                console.error('Validation errors:', result.errors);
            }
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
