# Artifact core

The artifact core owns engine-provider registration and capability-based dispatch. It validates basic forge request metadata and delegates execution through versioned provider contracts. It does not import concrete format engines, execute subprocesses, own signing keys, or make artifact safety/policy decisions.

## Registered provider

- `divine-artifact-forge` — BLAKE3 content-addressed ingestion, canonical ARD-1 descriptors, deterministic ZIP delivery, optional Ed25519 signing, and verification. The implementation is maintained in `ai-master-ssr/mistrial-`; this workspace contains only the integration adapter.

Use `EngineRegistry` to register providers and `ArtifactForgeService` to invoke forge/verify capabilities. The host remains responsible for execution isolation, filesystem authorization, resource limits, and key custody.
