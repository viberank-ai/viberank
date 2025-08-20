/**
 * Utilities Package - Shared utility functions for the VibeRank monorepo
 *
 * This package contains common utility functions that are used across multiple
 * packages in the VibeRank brand monitoring system. It provides a central
 * location for shared logic to avoid duplication and ensure consistency.
 *
 * Currently minimal, this package can be extended with utilities like:
 * - String processing helpers
 * - Data validation functions
 * - Common mathematical operations
 * - Date/time utilities
 * - Configuration helpers
 *
 * Used by:
 * - Other packages via import from '@viberank/utils'
 * - Test suites for common test utilities
 * - Shared constants and type guards
 */

/**
 * sum - Basic mathematical addition utility
 *
 * Simple helper function for adding two numbers. This is a placeholder
 * utility that demonstrates the package structure and can be replaced
 * with more sophisticated utilities as needed.
 *
 * @param a - First number to add
 * @param b - Second number to add
 * @returns Sum of the two numbers
 *
 * Example:
 * ```typescript
 * import { sum } from '@viberank/utils';
 * const total = sum(5, 3); // Returns 8
 * ```
 */
export const sum = (a: number, b: number) => a + b;
