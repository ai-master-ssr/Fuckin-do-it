# Artifact contracts

Versioned TypeScript contracts shared by the artifact core and engine integrations. This package owns the provider interface, forge/verify request types, capability identifiers, and receipt shapes. It contains no filesystem, process, rendering, cryptographic, or browser implementation.

The first provider contract is implemented by `@mgs/divine-forging`, which adapts the upstream Divine Artifact Forging Engine 0.2.0 CLI.
