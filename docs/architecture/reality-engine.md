# Deterministic Reality Engine

Status: implementation proposal, pending architecture approval.

## Responsibility split

- `packages/reality-engine` owns framework-independent state types, seeded knowledge generation, and pure state transitions.
- `apps/viewer-shell` owns the Zustand adapter and UI-facing actions.
- Rendering, persistence, cryptographic identity, and authoritative distributed consensus are outside this initial integration.

## Determinism contract

Given the same seed, knowledge count, initial state, and ordered action sequence, the engine produces the same knowledge objects and state transitions. Knowledge positions are generated with a local seeded 32-bit PRNG; no ambient randomness or wall-clock input is used.

## DPE-01 transition rules

- Evidence commitment increases verification by 0.35, capped at 1.0, and reduces cloak by 0.5, floored at 0.0.
- Ascension is permitted at verification >= 0.9; it increments generation and resets verification to 0.0 and cloak to 1.0.
- Cloak toggles between 0.0 and 1.0.
- Semantic budget must be finite and is clamped at zero minimum.

## Boundaries

This is deterministic in-process state logic, not yet a persisted event-sourced ledger, multi-client consensus protocol, or cryptographically sealed reality state. The Zustand store is a presentation adapter and must not be treated as an authoritative persistence layer.
