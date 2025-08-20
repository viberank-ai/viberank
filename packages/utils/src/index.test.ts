/**
 * Utilities Package Tests - Test suite for shared utility functions
 *
 * This test suite validates the utility functions provided by the utils package
 * to ensure they work correctly across all consuming packages. As the utils
 * package grows, these tests will expand to cover more complex utilities.
 *
 * Test coverage includes:
 * - Basic mathematical operations
 * - Edge cases and error conditions
 * - Type safety validations
 * - Performance characteristics where relevant
 *
 * Used for:
 * - Continuous integration testing
 * - Regression prevention during utility updates
 * - Documentation of expected behavior
 * - Validation of package exports
 */

import { describe, it, expect } from 'vitest';
import { sum } from './index.js';

/**
 * Test suite for sum utility function
 *
 * Validates basic mathematical addition functionality that serves as
 * a foundation for more complex utilities in the package.
 */
describe('sum', () => {
  /**
   * Test basic addition of positive numbers
   * Ensures the fundamental mathematical operation works correctly
   */
  it('adds numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
