import { create } from 'zustand';
import {
  commitEvidence as commitEvidenceTransition,
  createInitialRealityState,
  selectDistrict,
  selectEntity,
  setMotionPreference,
  setRupture,
  setSemanticState as setSemanticStateTransition,
  toggleCloak as toggleCloakTransition,
  triggerAscension as triggerAscensionTransition,
  type DistrictId,
  type RealityState,
  type RuptureEvent,
} from '@mgs/reality-engine';

export interface RealityStore extends RealityState {
  setActiveDistrict: (id: DistrictId | null) => void;
  inspectEntity: (id: string | null) => void;
  setSemanticState: (budget: number, access: string) => void;
  triggerCausalRupture: (rupture: RuptureEvent | null) => void;
  setReducedMotion: (state: boolean) => void;
  commitEvidence: () => void;
  triggerAscension: () => void;
  toggleCloak: () => void;
}

/**
 * Zustand is the UI-facing adapter. All domain transitions are delegated to
 * the deterministic, framework-independent @mgs/reality-engine package.
 */
export const useRealityStore = create<RealityStore>((set) => ({
  ...createInitialRealityState(),
  setActiveDistrict: (id) => set((state) => selectDistrict(state, id)),
  inspectEntity: (id) => set((state) => selectEntity(state, id)),
  setSemanticState: (budget, access) =>
    set((state) => setSemanticStateTransition(state, budget, access)),
  triggerCausalRupture: (rupture) => set((state) => setRupture(state, rupture)),
  setReducedMotion: (reducedMotion) =>
    set((state) => setMotionPreference(state, reducedMotion)),
  commitEvidence: () => set((state) => commitEvidenceTransition(state)),
  triggerAscension: () => set((state) => triggerAscensionTransition(state)),
  toggleCloak: () => set((state) => toggleCloakTransition(state)),
}));
