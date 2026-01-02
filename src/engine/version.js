/**
 * version.js - Engine Version Management
 * 
 * Tracks engine version for payload verification.
 * Server uses this to ensure compatibility when replaying trade logs.
 * 
 * @module engine/version
 */

/**
 * Current game engine version
 * MUST be updated when any deterministic logic changes
 * 
 * Version format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes (trade log format, RNG algorithm)
 * - MINOR: New features that don't break replay
 * - PATCH: Bug fixes that don't affect determinism
 */
export const ENGINE_VERSION = '3.0.0';

/**
 * Client application version
 * Used for analytics and debugging
 */
export const CLIENT_VERSION = '3.0.0';

/**
 * Minimum supported engine version for replay
 * Trade logs from older versions cannot be verified
 */
export const MIN_SUPPORTED_VERSION = '3.0.0';

/**
 * Check if a version is compatible for replay
 * @param {string} version - Version to check
 * @returns {boolean} True if compatible
 */
export function isVersionCompatible(version) {
    if (!version) return false;

    const [major, minor] = version.split('.').map(Number);
    const [minMajor, minMinor] = MIN_SUPPORTED_VERSION.split('.').map(Number);

    if (major > minMajor) return true;
    if (major < minMajor) return false;
    return minor >= minMinor;
}

/**
 * Get version info object for payload
 * @returns {Object} Version info
 */
export function getVersionInfo() {
    return {
        engineVersion: ENGINE_VERSION,
        clientVersion: CLIENT_VERSION,
        timestamp: Date.now()
    };
}

export default {
    ENGINE_VERSION,
    CLIENT_VERSION,
    MIN_SUPPORTED_VERSION,
    isVersionCompatible,
    getVersionInfo
};
