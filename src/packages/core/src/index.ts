/**
 * @fileoverview Core package exports
 * 
 * This package contains shared domain models, validators, and utilities
 * used across the MicroTech platform.
 */

// Types
export * from './types';

// Validators
export * from './validators';

// Utilities
export * from './utils';

// Validation primitives
export { z, ZodError, type Schema } from './z';
