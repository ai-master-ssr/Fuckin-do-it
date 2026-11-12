# MGS Viewing Artifact — Repository Blueprint

Status: proposed repository scaffold; not an approved implementation baseline.

## Structural rules

1. `apps/` contains user-facing applications only. It must not own artifact identity, parsing rules, or format-specific domain logic.
2. `packages/` contains reusable contracts and platform-independent services. Keep dependencies flowing inward: apps and engines may depend on packages; core packages must not depend on apps or concrete engines.
3. `engines/` contains format-family implementations behind the shared engine contract. Add a new engine only when it has distinct parsing/rendering/inspection dependencies or lifecycle needs; do not create a package per file extension by default.
4. `integrations/` contains adapters to external or separately governed MGS systems. The Divine Forging integration must call its public contract; it must not fork its internals.
5. `tests/fixtures/` contains small, licensed, non-sensitive test artifacts with provenance notes. Large/private assets stay out of Git and are referenced by controlled test manifests.
6. `docs/decisions/` records accepted architecture decisions. Proposals are not decisions until explicitly approved.
7. `tooling/` owns repository automation, lint/test/build configuration and code generation. No application business logic belongs here.

## Dependency direction

`apps/viewer-shell -> packages/* -> (contracts)`

`engines/* -> packages/artifact-contracts + packages/engine-runtime`

`packages/format-detection -> packages/artifact-contracts`

`integrations/divine-forging -> packages/artifact-contracts + packages/artifact-core`

The dispatcher depends on engine registrations through interfaces/tokens. Core packages must never import concrete engine packages. The app composes engines at the application boundary.

## Suggested workspace conventions

- TypeScript for shared contracts and new modular code; retain the current HTML viewer as a compatibility shell during migration.
- pnpm workspace with strict package boundaries and TypeScript project references.
- Package names use `@mgs/<domain>`; engine IDs are stable identifiers independent of package names.
- Public exports are explicit through each package's `src/index.ts` and `package.json` `exports` field.
- No cross-package deep imports. Import only declared public exports.
- Each package owns its tests and README; cross-package behavior belongs in root integration tests.
- No circular dependencies. Enforce with lint/dep-graph checks in CI.
- Version contracts deliberately. Breaking descriptor/engine changes require a migration note and compatibility tests.

## Migration sequence

1. Create this structure in the confirmed repository; do not overwrite the current viewer.
2. Move the current shell into `apps/viewer-shell` unchanged and record a baseline screenshot/behavior test.
3. Extract only shared types into `packages/artifact-contracts`.
4. Add `packages/engine-runtime` and one reference engine wrapping the current GLB/glTF path.
5. Add format detection and dispatcher; preserve unsupported files as source assets.
6. Add remaining engines incrementally, each with fixtures, capability declarations and tests.
7. Add the Divine Forging adapter only after its public ARD/BLAKE3/Ed25519 contracts are defined and verified. Do not assume the v0.1.0 archive already implements those choices.
8. Add storage and security implementations behind interfaces; avoid binding core packages to browser APIs.

## Explicit non-goals

- No microservices or runtime plugin marketplace at the outset.
- No package per extension without a real isolation/dependency reason.
- No duplicate artifact repository or cryptographic implementation inside the viewer.
- No framework migration until the existing shell and target deployment constraints are inspected.
