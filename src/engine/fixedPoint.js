/**
 * fixedPoint.js - Fixed-Point Math Utilities
 * 
 * Provides deterministic arithmetic operations by avoiding
 * floating-point precision issues. All monetary values and
 * prices are stored as integers with implied decimal places.
 * 
 * @module engine/fixedPoint
 * @version 3.0.0
 */

/**
 * Default decimal precision (4 decimal places = 10000 multiplier)
 */
export const DEFAULT_DECIMALS = 4;
export const DEFAULT_MULTIPLIER = 10000;

/**
 * Convert a floating-point number to fixed-point representation
 * @param {number} value - Floating-point value
 * @param {number} decimals - Number of decimal places
 * @returns {number} Fixed-point integer
 * 
 * @example
 * toFixed(123.4567) // Returns 1234567 (with 4 decimals)
 * toFixed(99.99, 2) // Returns 9999 (with 2 decimals)
 */
export function toFixed(value, decimals = DEFAULT_DECIMALS) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier);
}

/**
 * Convert fixed-point integer back to floating-point
 * @param {number} fixed - Fixed-point integer
 * @param {number} decimals - Number of decimal places
 * @returns {number} Floating-point value
 * 
 * @example
 * fromFixed(1234567) // Returns 123.4567
 * fromFixed(9999, 2) // Returns 99.99
 */
export function fromFixed(fixed, decimals = DEFAULT_DECIMALS) {
    const multiplier = Math.pow(10, decimals);
    return fixed / multiplier;
}

/**
 * Add two fixed-point numbers
 * @param {number} a - First fixed-point value
 * @param {number} b - Second fixed-point value
 * @returns {number} Sum as fixed-point
 */
export function fixedAdd(a, b) {
    return a + b;
}

/**
 * Subtract two fixed-point numbers
 * @param {number} a - First fixed-point value
 * @param {number} b - Second fixed-point value
 * @returns {number} Difference as fixed-point
 */
export function fixedSub(a, b) {
    return a - b;
}

/**
 * Multiply two fixed-point numbers
 * Note: Result needs to be divided by multiplier
 * @param {number} a - First fixed-point value
 * @param {number} b - Second fixed-point value (or multiplier)
 * @param {number} decimals - Decimal places for adjustment
 * @returns {number} Product as fixed-point
 */
export function fixedMul(a, b, decimals = DEFAULT_DECIMALS) {
    const multiplier = Math.pow(10, decimals);
    return Math.round((a * b) / multiplier);
}

/**
 * Divide two fixed-point numbers
 * @param {number} a - Dividend (fixed-point)
 * @param {number} b - Divisor (fixed-point)
 * @param {number} decimals - Decimal places for adjustment
 * @returns {number} Quotient as fixed-point
 */
export function fixedDiv(a, b, decimals = DEFAULT_DECIMALS) {
    const multiplier = Math.pow(10, decimals);
    return Math.round((a * multiplier) / b);
}

/**
 * Calculate percentage of a fixed-point value
 * @param {number} value - Fixed-point value
 * @param {number} percent - Percentage (e.g., 5 for 5%)
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage as fixed-point
 */
export function fixedPercent(value, percent, _decimals = DEFAULT_DECIMALS) {
    return Math.round((value * percent) / 100);
}

/**
 * Round to specified tick size
 * Used for price normalization
 * @param {number} value - Fixed-point value
 * @param {number} tickSize - Tick size (fixed-point)
 * @returns {number} Rounded fixed-point value
 */
export function roundToTick(value, tickSize) {
    return Math.round(value / tickSize) * tickSize;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculate price change as fixed-point percentage
 * @param {number} oldPrice - Old price (fixed-point)
 * @param {number} newPrice - New price (fixed-point)
 * @param {number} decimals - Decimal places for result
 * @returns {number} Percentage change as fixed-point
 */
export function priceChangePercent(oldPrice, newPrice, decimals = DEFAULT_DECIMALS) {
    if (oldPrice === 0) return 0;
    const multiplier = Math.pow(10, decimals);
    return Math.round(((newPrice - oldPrice) * multiplier * 100) / oldPrice);
}

/**
 * Format fixed-point value for display
 * @param {number} fixed - Fixed-point value
 * @param {number} decimals - Decimal places stored
 * @param {number} displayDecimals - Decimal places to display
 * @returns {string} Formatted string
 */
export function formatFixed(fixed, decimals = DEFAULT_DECIMALS, displayDecimals = 0) {
    const value = fromFixed(fixed, decimals);
    return value.toLocaleString('ko-KR', {
        minimumFractionDigits: displayDecimals,
        maximumFractionDigits: displayDecimals
    });
}

/**
 * Create a FixedMoney instance for chain operations
 * @param {number} value - Initial value (floating or fixed)
 * @param {boolean} isFixed - Whether value is already fixed-point
 * @returns {Object} FixedMoney instance
 */
export function money(value, isFixed = false) {
    let fixed = isFixed ? value : toFixed(value);

    return {
        add(other) {
            fixed = fixedAdd(fixed, typeof other === 'object' ? other.value() : toFixed(other));
            return this;
        },
        sub(other) {
            fixed = fixedSub(fixed, typeof other === 'object' ? other.value() : toFixed(other));
            return this;
        },
        mul(factor) {
            fixed = fixedMul(fixed, toFixed(factor));
            return this;
        },
        div(divisor) {
            fixed = fixedDiv(fixed, toFixed(divisor));
            return this;
        },
        percent(pct) {
            fixed = fixedPercent(fixed, pct);
            return this;
        },
        value() {
            return fixed;
        },
        toNumber() {
            return fromFixed(fixed);
        },
        format(displayDecimals = 0) {
            return formatFixed(fixed, DEFAULT_DECIMALS, displayDecimals);
        }
    };
}

export default {
    toFixed,
    fromFixed,
    fixedAdd,
    fixedSub,
    fixedMul,
    fixedDiv,
    fixedPercent,
    roundToTick,
    clamp,
    priceChangePercent,
    formatFixed,
    money,
    DEFAULT_DECIMALS,
    DEFAULT_MULTIPLIER
};
