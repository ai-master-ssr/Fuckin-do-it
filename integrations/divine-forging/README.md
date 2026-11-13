# Divine Forging integration

Registers Divine Artifact Forging Engine 0.2.0 as a provider in the artifact core. The Python forging implementation remains owned by `ai-master-ssr/mistrial-`; this package does not fork it.

## Host contract

The host supplies a `ForgeProcessRunner`. It must execute argument arrays without shell interpolation, enforce an execution timeout and output-size limit, honor abort signals, and run inside a restricted working directory. The host must also validate and authorize all filesystem paths before invoking the adapter.

Install the forge repository dependencies from its `requirements.txt` in the controlled runtime. Keep private signing keys outside source control and provide access through the host's protected key-custody mechanism.

## Use

```ts
import { createDivineForgeCore } from "@mgs/divine-forging";
import { NodeForgeProcessRunner } from "@mgs/divine-forging/node";

const runner = new NodeForgeProcessRunner({
  cwd: "/opt/divine-forge",
  timeoutMs: 120_000,
  maxOutputBytes: 4 * 1024 * 1024
});
const { forge } = createDivineForgeCore({ runner, executable: "python3" });

const receipt = await forge.forge("divine-artifact-forge", {
  source: { directory: "/workspace/source" },
  artifact: { id: "world-core", version: "1.0.0", name: "World Core" },
  storeDirectory: "/workspace/cas",
  outputDirectory: "/workspace/releases"
});
```

The included Node runner uses `spawn` with `shell: false`, an absolute forge-repository working directory, a timeout, bounded combined output, and abort handling. The host must still authorize source/store/output/key paths and keep signing keys outside source control. Install Python dependencies in the controlled runtime. The core exposes typed forge and verify operations; receipts are structurally validated before they are returned.

## Boundaries

- BLAKE3, canonical ARD-1, deterministic packaging, and Ed25519 behavior remain upstream responsibilities.
- No silent SHA-256 fallback or unsigned substitution is performed.
- A valid signature proves key possession, not artifact safety or policy approval.
- Blender scene production remains a separate capability; this adapter does not claim to invoke Blender.
- No remote key custody, R2/D1/Workers deployment, or sandbox is provided by this integration.
