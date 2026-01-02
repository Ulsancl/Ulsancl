/**
 * rng.ts - Seeded RNG (Server Stub)
 * 
 * This file will be replaced by copy-engine.js with the actual client RNG.
 * Kept as a stub for TypeScript compilation before copying.
 */

function rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
}

function seedFromString(seed: string): number[] {
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

export interface RNG {
    next(): number;
    nextFloat(): number;
    nextRange(min: number, max: number): number;
    nextBool(probability?: number): boolean;
    nextElement<T>(array: T[]): T | undefined;
    shuffle<T>(array: T[]): T[];
    getCallCount(): number;
}

export function createRng(seed: string): RNG {
    const state = seedFromString(String(seed));
    let callCount = 0;

    function nextUint32(): number {
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
        next(): number {
            return nextUint32();
        },

        nextFloat(): number {
            return nextUint32() / 0x100000000;
        },

        nextRange(min: number, max: number): number {
            const range = max - min + 1;
            return min + (nextUint32() % range);
        },

        nextBool(probability = 0.5): boolean {
            return this.nextFloat() < probability;
        },

        nextElement<T>(array: T[]): T | undefined {
            if (!array || array.length === 0) return undefined;
            return array[this.nextRange(0, array.length - 1)];
        },

        shuffle<T>(array: T[]): T[] {
            for (let i = array.length - 1; i > 0; i--) {
                const j = this.nextRange(0, i);
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        },

        getCallCount(): number {
            return callCount;
        }
    };
}

export function generateSeed(): string {
    return `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateDeterminism(seed: string): boolean {
    const rng1 = createRng(seed);
    const rng2 = createRng(seed);

    for (let i = 0; i < 1000; i++) {
        if (rng1.nextFloat() !== rng2.nextFloat()) {
            return false;
        }
    }
    return true;
}
