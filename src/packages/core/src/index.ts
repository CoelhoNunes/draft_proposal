/**
 * @fileoverview Core package exports
 * 
 * This package contains shared domain models, validators, and utilities
 * used across the MicroTech platform.
 */

// Types
export * from './types/index.js';

// Validators
export * from './validators/index.js';

// Utilities
export * from './utils/index.js';

// Validation primitives
export { z, ZodError, type Schema } from './z/index.js';
