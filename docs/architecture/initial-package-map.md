# Initial package map

- `@mgs/artifact-contracts`: ArtifactDescriptor, ArtifactEngine, EngineResult, capability and error types.
- `@mgs/artifact-core`: identity, immutable source reference, lineage and lifecycle orchestration.
- `@mgs/format-detection`: extension hints, magic-byte signatures, structural probes and detection result.
- `@mgs/engine-runtime`: registry, dispatcher, cancellation, resource budgets and disposal.
- `@mgs/storage-abstraction`: local/session/persistent storage interfaces; implementations added by platform.
- `@mgs/security-policy`: trust classification, sandbox requirements and parser resource limits.
- `@mgs/engine-web`: HTML/CSS/JS inspection and isolated preview.
- `@mgs/engine-svg`: SVG parse, render and structural inspection.
- `@mgs/engine-typography`: font loading and OpenType metadata/glyph inspection.
- `@mgs/engine-three-d`: GLB/glTF first, then OBJ/STL/FBX/3DS/DAE/PLY as verified.
- `@mgs/engine-terrain`: raster elevation, point clouds and terrain mesh paths kept distinct.
- `@mgs/engine-image`: raster/texture formats and metadata.
- `@mgs/integration-divine-forging`: adapter to the canonical forging contracts; no duplicate hashing/signing implementation.
