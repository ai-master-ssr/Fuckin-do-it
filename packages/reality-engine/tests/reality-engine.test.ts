import { describe, expect, it } from 'vitest';
import {
  commitEvidence,
  createInitialRealityState,
  createKnowledgeBase,
  setSemanticState,
  toggleCloak,
  triggerAscension,
} from '../src/index';

describe('deterministic knowledge generation', () => {
  it('produces identical objects for the same seed', () => {
    expect(createKnowledgeBase('seed-a')).toEqual(createKnowledgeBase('seed-a'));
  });

  it('changes generated positions when the seed changes', () => {
    expect(createKnowledgeBase('seed-a')).not.toEqual(createKnowledgeBase('seed-b'));
  });

  it('rejects invalid knowledge counts', () => {
    expect(() => createKnowledgeBase('seed', -1)).toThrow(RangeError);
    expect(() => createKnowledgeBase('seed', 1.5)).toThrow(RangeError);
  });
});

describe('DPE-01 state transitions', () => {
  it('starts at generation zero, unverified and cloaked', () => {
    const state = createInitialRealityState();
    expect(state.dpeGeneration).toBe(0);
    expect(state.dpeVerification).toBe(0);
    expect(state.dpeCloak).toBe(1);
  });

  it('commits evidence with bounded verification and cloak values', () => {
    const state = createInitialRealityState();
    const next = commitEvidence(commitEvidence(commitEvidence(state)));
    expect(next.dpeVerification).toBe(1);
    expect(next.dpeCloak).toBe(0);
  });

  it('does not ascend before the verification threshold', () => {
    const state = commitEvidence(createInitialRealityState());
    expect(triggerAscension(state)).toBe(state);
  });

  it('ascends and resets the verification cycle at threshold', () => {
    const state = commitEvidence(commitEvidence(commitEvidence(createInitialRealityState())));
    const next = triggerAscension(state);
    expect(next.dpeGeneration).toBe(1);
    expect(next.dpeVerification).toBe(0);
    expect(next.dpeCloak).toBe(1);
  });

  it('toggles cloak deterministically', () => {
    const state = createInitialRealityState();
    expect(toggleCloak(state).dpeCloak).toBe(0);
    expect(toggleCloak(toggleCloak(state)).dpeCloak).toBe(1);
  });

  it('rejects non-finite semantic budgets and clamps negative values', () => {
    const state = createInitialRealityState();
    expect(() => setSemanticState(state, Number.NaN, 'AUTHORIZED')).toThrow(RangeError);
    expect(setSemanticState(state, -10, 'RESTRICTED').budget).toBe(0);
  });
});
