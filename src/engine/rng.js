/**
 * rng.js - Seeded Pseudo-Random Number Generator
 * 
 * Implements Xoshiro128** algorithm for deterministic random number generation.
 * The same seed will always produce the same sequence of random numbers,
 * enabling server-side replay and verification.
 * 
 * @module engine/rng
 * @version 3.0.0
 */

/**
 * Rotates bits left
 * @param {number} x - Input value
 * @param {number} k - Rotation amount
 * @returns {number} Rotated value
 */
function rotl(x, k) {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/**
 * Creates a seeded RNG from a string seed using MurmurHash3
 * @param {string} seed - String seed
 * @returns {number[]} 4 element state array
 */
function seedFromString(seed) {
    // MurmurHash3 to convert string to 4 x 32-bit integers
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    let h3 = 0x9e3779b9;
    let h4 = 0x85ebca6b;

    for (let i = 0; i < seed.length; i++) {
        const c = seed.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 0x85ebca77);
        h2 = Math.imul(h2 ^ c, 0xc2b2ae3d);
        h3 = Math.imul(h3 ^ c, 0x27d4eb2f);
        h4 = Math.imul(h4 ^ c, 0x165667b1);
    }

    // Final mixing
    h1 ^= seed.length;
    h2 ^= seed.length;
    h3 ^= seed.length;
    h4 ^= seed.length;

    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 16)) >>> 0;
    h3 = (h3 ^ (h3 >>> 16)) >>> 0;
    h4 = (h4 ^ (h4 >>> 16)) >>> 0;

    return [h1 || 1, h2 || 1, h3 || 1, h4 || 1];
}

/**
 * Creates a new seeded random number generator
 * 
 * @param {string} seed - Seed string for deterministic generation
 * @returns {Object} RNG instance with methods
 * 
 * @example
 * const rng = createRng('season-2024-01');
 * console.log(rng.nextFloat()); // Always same value for same seed
 * console.log(rng.nextRange(1, 100)); // Integer between 1 and 100
 */
export function createRng(seed) {
    const state = seedFromString(String(seed));
    let callCount = 0;

    /**
     * Generates next 32-bit unsigned integer (Xoshiro128** algorithm)
     * @returns {number} 32-bit unsigned integer
     */
    function nextUint32() {
        callCount++;
        const result = (rotl(state[1] * 5, 7) * 9) >>> 0;
        const t = (state[1] << 9) >>> 0;

        state[2] ^= state[0];
        state[3] ^= state[1];
        state[1] ^= state[2];
        state[0] ^= state[3];

        state[2] ^= t;
        state[3] = rotl(state[3], 11);

        return result;
    }

    return {
        /**
         * Get raw 32-bit unsigned integer
         * @returns {number} Integer in range [0, 2^32 - 1]
         */
        next() {
            return nextUint32();
        },

        /**
         * Get float in range [0, 1)
         * @returns {number} Float in range [0, 1)
         */
        nextFloat() {
            return nextUint32() / 0x100000000;
        },

        /**
         * Get integer in range [min, max] inclusive
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Integer in range [min, max]
         */
        nextRange(min, max) {
            const range = max - min + 1;
            return min + (nextUint32() % range);
        },

        /**
         * Get boolean with given probability
         * @param {number} probability - Probability of true (0-1)
         * @returns {boolean}
         */
        nextBool(probability = 0.5) {
            return this.nextFloat() < probability;
        },

        /**
         * Select random element from array
         * @template T
         * @param {T[]} array - Array to select from
         * @returns {T} Random element
         */
        nextElement(array) {
            if (!array || array.length === 0) return undefined;
            return array[this.nextRange(0, array.length - 1)];
        },

        /**
         * Shuffle array in place (Fisher-Yates)
         * @template T
         * @param {T[]} array - Array to shuffle
         * @returns {T[]} Same array, shuffled
         */
        shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = this.nextRange(0, i);
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        },

        /**
         * Get Gaussian (normal) distributed random number
         * Uses Box-Muller transform
         * @param {number} mean - Mean of distribution
         * @param {number} stdDev - Standard deviation
         * @returns {number}
         */
        nextGaussian(mean = 0, stdDev = 1) {
            const u1 = this.nextFloat() || 0.0001; // Avoid log(0)
            const u2 = this.nextFloat();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            return mean + z * stdDev;
        },

        /**
         * Get the current call count (for debugging/verification)
         * @returns {number}
         */
        getCallCount() {
            return callCount;
        },

        /**
         * Get current state (for serialization)
         * @returns {{seed: string, callCount: number}}
         */
        getState() {
            return {
                seed,
                callCount
            };
        },

        /**
         * Clone RNG at current state
         * @returns {Object} New RNG instance at same state
         */
        clone() {
            const cloned = createRng(seed);
            // Advance to same position
            for (let i = 0; i < callCount; i++) {
                cloned.next();
            }
            return cloned;
        }
    };
}

/**
 * Generate a random season seed
 * Uses crypto API if available, falls back to timestamp
 * @returns {string} Random seed string
 */
export function generateSeed() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older environments
    return `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate that a seed produces deterministic results
 * @param {string} seed - Seed to validate
 * @returns {boolean} True if deterministic
 */
export function validateDeterminism(seed) {
    const rng1 = createRng(seed);
    const rng2 = createRng(seed);

    for (let i = 0; i < 1000; i++) {
        if (rng1.nextFloat() !== rng2.nextFloat()) {
            return false;
        }
    }
    return true;
}

export default createRng;
