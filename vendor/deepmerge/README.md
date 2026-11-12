# Patched deepmerge for the development toolchain

Vendored from TehShrike/deepmerge 4.3.1 (`dist/cjs.js` and `index.d.ts`, MIT).
The package retains the upstream merge API. Its three destination writes use
`Object.defineProperty` to create own data properties instead of invoking the
legacy `__proto__` setter. This fixes GHSA-gcqx-w48m-w2h4 for both target and
source keys, including recursive merges and null-prototype targets.

The npm package has no patched upstream release as of 2026-11-12. The root
`overrides.deepmerge` selects this explicit local fork for Jest's configuration
merging. `src/__tests__/deepmerge-security.test.js` covers the attack and normal
array/custom merges. Remove the override when upstream ships a verified fix.
