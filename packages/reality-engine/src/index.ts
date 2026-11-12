export type KnowledgeType = 'FACT' | 'VERIFIED' | 'INFERRED' | 'SIMULATED';
export type DistrictId = 'KERNEL' | 'THINK' | 'BUILD' | 'SEE' | 'VERIFY';

export interface KnowledgeObject {
  id: string;
  type: KnowledgeType;
  label: string;
  position: [number, number, number];
  isStale?: boolean;
}

export interface RuptureEvent {
  sourceId: string;
  targetId: string;
  reason: string;
  rupturePoint: [number, number, number];
}

export interface RealityState {
  activeDistrict: DistrictId | null;
  inspectingEntity: string | null;
  knowledgeBase: KnowledgeObject[];
  budget: number;
  accessStatus: string;
  reducedMotion: boolean;
  dpeGeneration: number;
  dpeVerification: number;
  dpeCloak: number;
  activeRupture: RuptureEvent | null;
}

export const DEFAULT_KNOWLEDGE_SEED = 'MGS-REALITY-ENGINE-v1';
export const DEFAULT_KNOWLEDGE_COUNT = 50;
const KNOWLEDGE_TYPES: readonly KnowledgeType[] = ['FACT', 'VERIFIED', 'INFERRED', 'SIMULATED'];

/** Stable 32-bit seed derivation; independent of runtime and wall-clock state. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG: deterministic for a given unsigned 32-bit seed. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createKnowledgeBase(
  seed: string = DEFAULT_KNOWLEDGE_SEED,
  count: number = DEFAULT_KNOWLEDGE_COUNT,
): KnowledgeObject[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Knowledge count must be a non-negative integer.');
  }

  const random = createRandom(hashSeed(seed));
  return Array.from({ length: count }, (_, index) => ({
    id: `KB-${index.toString().padStart(3, '0')}`,
    type: KNOWLEDGE_TYPES[index % KNOWLEDGE_TYPES.length]!,
    label: `Data Node ${index}`,
    position: [
      (random() - 0.5) * 20,
      random() * 5,
      (random() - 0.5) * 20,
    ] as [number, number, number],
    isStale: index % 7 === 0,
  }));
}

export function createInitialRealityState(options: {
  seed?: string;
  knowledgeCount?: number;
} = {}): RealityState {
  return {
    activeDistrict: null,
    inspectingEntity: null,
    knowledgeBase: createKnowledgeBase(
      options.seed ?? DEFAULT_KNOWLEDGE_SEED,
      options.knowledgeCount ?? DEFAULT_KNOWLEDGE_COUNT,
    ),
    budget: 100,
    accessStatus: 'AUTHORIZED',
    reducedMotion: false,
    dpeGeneration: 0,
    dpeVerification: 0,
    dpeCloak: 1,
    activeRupture: null,
  };
}

export function selectDistrict(state: RealityState, id: DistrictId | null): RealityState {
  return {
    ...state,
    activeDistrict: id,
    inspectingEntity: id ? `DISTRICT_${id}` : null,
  };
}

export function selectEntity(state: RealityState, id: string | null): RealityState {
  return { ...state, inspectingEntity: id };
}

export function setSemanticState(state: RealityState, budget: number, access: string): RealityState {
  if (!Number.isFinite(budget)) throw new RangeError('Budget must be finite.');
  return { ...state, budget: Math.max(0, budget), accessStatus: access };
}

export function setRupture(state: RealityState, rupture: RuptureEvent | null): RealityState {
  return { ...state, activeRupture: rupture };
}

export function setMotionPreference(state: RealityState, reducedMotion: boolean): RealityState {
  return { ...state, reducedMotion };
}

export function commitEvidence(state: RealityState): RealityState {
  return {
    ...state,
    dpeVerification: Math.min(state.dpeVerification + 0.35, 1),
    dpeCloak: Math.max(state.dpeCloak - 0.5, 0),
  };
}

export function triggerAscension(state: RealityState): RealityState {
  if (state.dpeVerification < 0.9) return state;
  return {
    ...state,
    dpeGeneration: state.dpeGeneration + 1,
    dpeVerification: 0,
    dpeCloak: 1,
  };
}

export function toggleCloak(state: RealityState): RealityState {
  return { ...state, dpeCloak: state.dpeCloak > 0.5 ? 0 : 1 };
}
