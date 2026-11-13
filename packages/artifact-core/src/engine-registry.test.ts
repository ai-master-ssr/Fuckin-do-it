import { describe, expect, it } from "vitest";
import type { ArtifactForgeProvider } from "@mgs/artifact-contracts";
import { EngineRegistry } from "./engine-registry.js";

function provider(id: string): ArtifactForgeProvider {
  return {
    id, version: "1.0.0", capabilities: new Set(["forge", "verify"]),
    async forge() { throw new Error("not used"); },
    async verify() { throw new Error("not used"); }
  };
}

describe("EngineRegistry", () => {
  it("registers and resolves providers", () => {
    const registry = new EngineRegistry();
    registry.register(provider("test"));
    expect(registry.get("test").version).toBe("1.0.0");
    expect(registry.findByCapability("forge")).toHaveLength(1);
  });

  it("rejects duplicate provider identities", () => {
    const registry = new EngineRegistry();
    registry.register(provider("test"));
    expect(() => registry.register(provider("test"))).toThrow("already registered");
  });

  it("rejects unknown providers", () => {
    expect(() => new EngineRegistry().get("missing")).toThrow("Unknown artifact engine provider");
  });
});
