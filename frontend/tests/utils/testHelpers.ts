/**
 * Shared utilities for E2E tests.
 * 
 * Provides common helper functions following CSCD211 standards for
 * defensive programming and code reusability.
 * 
 * @author Generated following CSCD211 standards
 * @version 1.0.0
 */

/**
 * Safely parse an integer from a string, returning 0 on failure.
 * @param str The string to parse
 * @returns Parsed integer or 0 if parsing fails
 */
export function parseIntSafe(str: string): number {
  if (typeof str !== 'string') {
    return 0;
  }
  
  const match = /(\d+)/.exec(str);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Calculate statistical properties of an array of numbers.
 * @param numbers Array of numbers to analyze
 * @returns Object containing min, max, and spread
 */
export function calculateStats(numbers: number[]): { min: number; max: number; spread: number } {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { min: 0, max: 0, spread: 0 };
  }
  
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const spread = max - min;
  
  return { min, max, spread };
}

/**
 * Check if two numbers are approximately equal within a tolerance.
 * @param a First number
 * @param b Second number
 * @param tolerance Maximum allowed difference (default: 10)
 * @returns True if numbers are within tolerance
 */
export function approximatelyEqual(a: number, b: number, tolerance: number = 10): boolean {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Create a delay promise for test timing.
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate that a number is within expected bounds.
 * @param value The number to validate
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns True if value is within bounds
 */
export function isWithinBounds(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
