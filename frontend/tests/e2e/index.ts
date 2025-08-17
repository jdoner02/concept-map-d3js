/**
 * Barrel export for E2E test suites.
 * 
 * This index provides a centralized overview of all test categories
 * and can be used for test discovery and organization.
 * 
 * @author Generated following CSCD211 standards
 */

// Core functionality tests
export * from './core/loading.spec';
export * from './core/data-loading.spec';

// User interaction tests  
export * from './interactions/user-interactions.spec';

// UI component tests
export * from './ui-components/panels-and-tooltips.spec';

// Data validation tests
export * from './data-validation/data-integrity.spec';
