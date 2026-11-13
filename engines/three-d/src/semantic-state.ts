export type Vec3 = readonly [number, number, number];
export type PrimitiveKind = "box" | "sphere" | "torus";
export type DepthLayer = "foreground" | "midground" | "background";

export interface SemanticEntity {
  readonly id: string;
  readonly primitive: PrimitiveKind;
  readonly position: Vec3;
  readonly scale?: Vec3;
  readonly color: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly verificationCost?: number;
  readonly witnessedMoments?: number;
  readonly epistemicDebt?: number;
  readonly velocity?: Vec3;
  readonly depthLayer?: DepthLayer;
  readonly contradiction?: boolean;
  readonly refractionIndex?: number;
}

export interface SemanticSceneState {
  readonly background?: string;
  readonly camera?: {
    readonly position?: Vec3;
    readonly target?: Vec3;
    readonly fov?: number;
  };
  readonly entities: readonly SemanticEntity[];
}

const DEPTH_SCALE: Record<DepthLayer, number> = {
  foreground: 1,
  midground: 0.66,
  background: 0.44
};

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
}

function unitInterval(value: number, label: string): void {
  finite(value, label);
  if (value < 0 || value > 1) throw new RangeError(`${label} must be between 0 and 1`);
}

export function depthScale(layer: DepthLayer = "foreground"): number {
  return DEPTH_SCALE[layer];
}

export function validateSceneState(state: SemanticSceneState): void {
  if (!state || !Array.isArray(state.entities)) {
    throw new TypeError("Scene state must contain an entities array");
  }

  const ids = new Set<string>();
  for (const entity of state.entities) {
    if (!entity.id.trim()) throw new TypeError("Entity id must not be empty");
    if (ids.has(entity.id)) throw new Error(`Duplicate semantic entity id: ${entity.id}`);
    ids.add(entity.id);
    for (const [index, value] of entity.position.entries()) finite(value, `${entity.id}.position[${index}]`);
    if (entity.scale) {
      for (const [index, value] of entity.scale.entries()) {
        finite(value, `${entity.id}.scale[${index}]`);
        if (value <= 0) throw new RangeError(`${entity.id}.scale[${index}] must be positive`);
      }
    }
    if (entity.verificationCost !== undefined) unitInterval(entity.verificationCost, `${entity.id}.verificationCost`);
    if (entity.epistemicDebt !== undefined) unitInterval(entity.epistemicDebt, `${entity.id}.epistemicDebt`);
    if (entity.refractionIndex !== undefined) {
      finite(entity.refractionIndex, `${entity.id}.refractionIndex`);
      if (entity.refractionIndex < 1) throw new RangeError(`${entity.id}.refractionIndex must be >= 1`);
    }
    if (entity.witnessedMoments !== undefined &&
        (!Number.isInteger(entity.witnessedMoments) || entity.witnessedMoments < 0)) {
      throw new RangeError(`${entity.id}.witnessedMoments must be a non-negative integer`);
    }
    if (entity.velocity) {
      for (const [index, value] of entity.velocity.entries()) finite(value, `${entity.id}.velocity[${index}]`);
    }
  }
}
