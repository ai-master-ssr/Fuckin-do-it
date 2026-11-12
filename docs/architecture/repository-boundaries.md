# Repository boundaries

## Ownership by directory

| Directory | Owns | Must not own |
|---|---|---|
| `apps/` | UX, routing, session composition | canonical identity, parsers, signing keys |
| `packages/artifact-contracts` | versioned descriptor and engine interfaces | browser rendering implementation |
| `packages/artifact-core` | artifact lifecycle, provenance, capability model | concrete format parsers |
| `packages/format-detection` | signature/structure detection and confidence | rendering |
| `packages/engine-runtime` | engine registration, lifecycle, dispatch contracts | format-specific logic |
| `packages/storage-abstraction` | storage interfaces and adapters | policy decisions about artifact trust |
| `packages/security-policy` | sandbox/resource policy interfaces | private key custody implementation |
| `engines/` | format-family parsing/rendering/inspection | app navigation and global state |
| `integrations/` | adapters to MGS systems | copied/forked external system internals |
| `tests/` | cross-package fixtures and integration tests | production code |
| `docs/` | architecture, decisions, format support | undocumented normative behavior |

## Rules that prevent repository entropy

- A dependency may point from an outer layer to an inner contract, never from core to a concrete engine or app.
- Cross-package imports use package public exports only.
- One canonical type definition; no duplicated `ArtifactDescriptor` interfaces.
- Engines declare supported formats and capabilities; UI must not maintain a second format registry.
- Keep source bytes immutable. Derived previews/thumbnails/normalized representations carry parent identity and transformation metadata.
- Every new format support claim requires a fixture, positive test, malformed-input test and explicit capability statement.
- Every package needs an owner, purpose, public API and tests before it is considered production code.
- Prefer a modular monolith. Split deployment/runtime services only when measured scaling, isolation or operational requirements justify it.
