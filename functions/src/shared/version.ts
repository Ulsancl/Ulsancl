/**
 * version.ts - Engine Version (Server Stub)
 * 
 * This file will be replaced by copy-engine.js with the actual client version.
 * Kept as a stub for TypeScript compilation before copying.
 */

export const ENGINE_VERSION = '3.0.0';
export const CLIENT_VERSION = '3.0.0';
export const MIN_SUPPORTED_VERSION = '3.0.0';

export function isVersionCompatible(version: string): boolean {
    if (!version) return false;

    const [major, minor] = version.split('.').map(Number);
    const [minMajor, minMinor] = MIN_SUPPORTED_VERSION.split('.').map(Number);

    if (major > minMajor) return true;
    if (major < minMajor) return false;
    return minor >= minMinor;
}

export function getVersionInfo() {
    return {
        engineVersion: ENGINE_VERSION,
        clientVersion: CLIENT_VERSION,
        timestamp: Date.now()
    };
}
