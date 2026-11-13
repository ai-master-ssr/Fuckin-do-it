import { describe, expect, it } from "vitest";
import { depthScale, validateSceneState, type SemanticSceneState } from "./semantic-state.js";

const valid: SemanticSceneState = {
  entities: [{
    id: "core", primitive: "sphere", position: [0, 0, 0], color: "#d7b56d",
    verificationCost: 0.8, witnessedMoments: 3, epistemicDebt: 0.2,
    velocity: [1, 0, 0], refractionIndex: 1.6
  }]
};

describe("semantic scene state", () => {
  it("accepts a valid state without mutating it", () => {
    const before = structuredClone(valid);
    expect(() => validateSceneState(valid)).not.toThrow();
    expect(valid).toEqual(before);
  });

  it("rejects duplicate entity identities", () => {
    expect(() => validateSceneState({
      entities: [valid.entities[0]!, valid.entities[0]!]
    })).toThrow("Duplicate semantic entity id");
  });

  it("rejects non-finite coordinates", () => {
    expect(() => validateSceneState({
      entities: [{ id: "bad", primitive: "box", position: [0, Number.NaN, 0], color: "#fff" }]
    })).toThrow("must be finite");
  });

  it("rejects out-of-range verification cost", () => {
    expect(() => validateSceneState({
      entities: [{ id: "bad", primitive: "box", position: [0, 0, 0], color: "#fff", verificationCost: 1.1 }]
    })).toThrow("between 0 and 1");
  });

  it("enforces declared forced-perspective scales", () => {
    expect(depthScale("foreground")).toBe(1);
    expect(depthScale("midground")).toBe(0.66);
    expect(depthScale("background")).toBe(0.44);
  });
});
