# Three-dimensional rendering engine

Status: **implemented vertical slice** — browser WebGL renderer, semantic scene model, GLB/glTF loading, and geometric-light plugin pipeline.

## Package

- Package: `@mgs/engine-three-d`
- Runtime: Three.js / WebGL2-capable browser
- Language: strict TypeScript
- Entry: `src/index.ts`

## Implemented

- Owns a Three.js scene, perspective camera, WebGL renderer, baseline lighting, viewport resize, and deterministic disposal.
- Renders validated semantic entities as box, sphere, and torus primitives.
- Supports GLB/glTF loading through Three.js `GLTFLoader`.
- Exposes a plugin lifecycle: register, apply during render, unregister, dispose.
- Encodes the supplied semantic state through the Geometric Light Renderer plugin:
  - verification cost → hard concentric emissive rings;
  - witnessed moments / epistemic debt → discrete geometric shards;
  - velocity → directional vector trails;
  - forced perspective → fixed foreground/midground/background scale ratios (1.0 / 0.66 / 0.44);
  - contradictions → black geometry;
  - high refraction index → geometric fracture markers (not a physical refraction solver).
- Validates IDs, numeric ranges, coordinates, and duplicate entities before rendering.

## Minimal use

```ts
import { ThreeDEngine, GeometricLightPlugin } from "@mgs/engine-three-d";

const engine = new ThreeDEngine(canvas);
engine.registerPlugin(new GeometricLightPlugin());

engine.render({
  background: "#080b10",
  camera: { position: [4, 3, 6], target: [0, 0, 0] },
  entities: [{
    id: "verification-core",
    primitive: "sphere",
    position: [0, 0, 0],
    color: "#d7b56d",
    verificationCost: 0.9,
    witnessedMoments: 5,
    epistemicDebt: 0.2,
    velocity: [1, 0.2, 0],
    depthLayer: "foreground"
  }]
});

// Later:
engine.dispose();
```

## Commands

From the repository root:

- `pnpm --filter @mgs/engine-three-d typecheck`
- `pnpm --filter @mgs/engine-three-d test`
- `pnpm --filter @mgs/engine-three-d build`

## Explicit limits

This is a working rendering foundation, not a claim that every rendering feature is complete. It does not yet implement a physically based refraction solver, shadow/contradiction compositing beyond black semantic geometry, post-processing render graph, temporal accumulation, 3D Gaussian Splatting, or a full asset-format matrix. The plugin API is the extension seam for those systems.

Semantic state is authoritative input. The renderer visualizes supplied values; it does not invent evidence, authority, certainty, or momentum.
