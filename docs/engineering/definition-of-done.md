# Package definition of done

- Purpose and ownership documented.
- Public API exported explicitly; no deep imports by consumers.
- Unit tests cover normal, malformed and failure paths as applicable.
- No dependency cycle; boundary check passes.
- Resource cleanup and cancellation implemented for long-running operations.
- Security/resource limits documented for untrusted input.
- Format/capability support claims match tested behavior.
- Provenance and lineage are preserved for derived artifacts.
- No secrets, private assets or generated build output committed.
