import { describe, expect, it } from "vitest";
import { NodeForgeProcessRunner } from "./node-process-runner.js";

describe("NodeForgeProcessRunner", () => {
  it("passes arguments literally without shell interpolation", async () => {
    const runner = new NodeForgeProcessRunner({ cwd: process.cwd() });
    const literal = "$(echo should-not-run)";
    const result = await runner.run([
      process.execPath, "-e", "process.stdout.write(process.argv[1])", literal
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(literal);
  });

  it("rejects output beyond the configured limit", async () => {
    const runner = new NodeForgeProcessRunner({ cwd: process.cwd(), maxOutputBytes: 4 });
    await expect(runner.run([
      process.execPath, "-e", "process.stdout.write('123456789')"
    ])).rejects.toThrow("output bytes");
  });

  it("requires an absolute working directory", () => {
    expect(() => new NodeForgeProcessRunner({ cwd: "." })).toThrow("absolute path");
  });
});
