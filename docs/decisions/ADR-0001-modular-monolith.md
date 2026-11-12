# ADR-0001: Modular monolith with explicit package boundaries

- Status: Proposed
- Decision owner: MGS owner
- Context: The viewer needs many format engines and integration points, but there is no verified need for independently deployed services.
- Proposal: Use one repository/workspace with strict package boundaries. Keep UI, core contracts, engines and external-system adapters separate.
- Benefits: incremental migration, reusable engines, explicit dependencies, simpler local development and CI.
- Costs: requires boundary enforcement and disciplined public APIs.
- Revisit when: independent deployment, security isolation, team ownership or measured build/runtime constraints justify a split.
