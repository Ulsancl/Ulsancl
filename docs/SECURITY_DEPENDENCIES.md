# Security dependency overrides

Reviewed on 2026-10-03. Recheck these overrides when Firebase updates its dependency ranges.

- The browser app's `firebase` package includes `@firebase/firestore`, which pins `@grpc/grpc-js` to the vulnerable `~1.9.0` line. The root package override selects `1.14.5`, which is outside that upstream range and addresses [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j). The app uses Firebase in the browser, where Firestore uses WebChannel. `npm ls @grpc/grpc-js`, the web build, and tests verify this resolved graph; server-side Firestore behavior is not covered by those tests.
- Cloud Functions use `firebase-admin@14.5.0` and `firebase-functions@7.4.0` on Node.js 22. `firebase-functions/v1` preserves the existing first-generation function definitions, while the Admin SDK uses modular imports. The Functions package override selects `uuid@11.1.1` only under `gaxios` because the storage dependency still pulls `gaxios@6` and its vulnerable `uuid@9` dependency ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). `gaxios@6` calls `uuid.v4()`, which remains available in v11.

Both npm audits currently report zero findings. The Functions build, replay regression tests, and handler import smoke test passed locally. The Functions CI workflow runs on Node.js 22. A production Firebase deployment is still required after review and merge; the repository change alone does not update deployed functions.
