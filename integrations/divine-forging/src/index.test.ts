import { describe, expect, it, vi } from "vitest";
import { createDivineForgeCore, type ForgeProcessRunner } from "./index.js";

describe("DivineForgeAdapter", () => {
  it("forwards forge arguments without shell-string construction and validates receipts", async () => {
    const run = vi.fn<ForgeProcessRunner["run"]>().mockResolvedValue({
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({
        artifact_blake3: "a".repeat(64), bundle_blake3: "b".repeat(64),
        bundle_size_bytes: 12, descriptor: "/cas/a.ard.json", signature: null,
        bundle: "/out/a.zip", object_count: 2, signed: false
      })
    });
    const { forge } = createDivineForgeCore({ runner: { run } });
    const receipt = await forge.forge("divine-artifact-forge", {
      source: { directory: "/source with spaces" },
      artifact: { id: "test-artifact", version: "1.0.0", name: "Test Artifact" },
      storeDirectory: "/cas", outputDirectory: "/out"
    });

    expect(receipt.object_count).toBe(2);
    expect(run).toHaveBeenCalledWith([
      "python3", "workshop/forge_engine.py", "forge",
      "--source", "/source with spaces", "--store", "/cas", "--output", "/out",
      "--id", "test-artifact", "--version", "1.0.0", "--name", "Test Artifact"
    ], undefined);
  });

  it("surfaces non-zero process exits", async () => {
    const runner: ForgeProcessRunner = {
      run: async () => ({ exitCode: 1, stdout: "", stderr: "dependency missing" })
    };
    const { forge } = createDivineForgeCore({ runner });
    await expect(forge.forge("divine-artifact-forge", {
      source: { directory: "/source" },
      artifact: { id: "test", version: "1.0.0", name: "Test" },
      storeDirectory: "/cas", outputDirectory: "/out"
    })).rejects.toThrow("dependency missing");
  });
});
