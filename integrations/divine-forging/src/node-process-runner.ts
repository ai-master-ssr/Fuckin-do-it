import { spawn } from "node:child_process";
import path from "node:path";
import { ArtifactForgeError } from "@mgs/artifact-contracts";
import type { ForgeProcessResult, ForgeProcessRunner } from "./index.js";

export interface NodeForgeProcessRunnerOptions {
  readonly cwd: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  readonly env?: NodeJS.ProcessEnv;
}

export class NodeForgeProcessRunner implements ForgeProcessRunner {
  readonly #cwd: string;
  readonly #timeoutMs: number;
  readonly #maxOutputBytes: number;
  readonly #env: NodeJS.ProcessEnv;

  constructor(options: NodeForgeProcessRunnerOptions) {
    if (!path.isAbsolute(options.cwd)) throw new TypeError("Forge working directory must be an absolute path");
    this.#cwd = options.cwd;
    this.#timeoutMs = options.timeoutMs ?? 120_000;
    this.#maxOutputBytes = options.maxOutputBytes ?? 4 * 1024 * 1024;
    if (!Number.isSafeInteger(this.#timeoutMs) || this.#timeoutMs < 1) {
      throw new TypeError("Forge timeout must be a positive integer");
    }
    if (!Number.isSafeInteger(this.#maxOutputBytes) || this.#maxOutputBytes < 1) {
      throw new TypeError("Forge output limit must be a positive integer");
    }
    this.#env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      TEMP: process.env.TEMP,
      SYSTEMROOT: process.env.SYSTEMROOT,
      PYTHONUNBUFFERED: "1",
      ...options.env
    };
  }

  run(args: readonly string[], signal?: AbortSignal): Promise<ForgeProcessResult> {
    if (signal?.aborted) {
      return Promise.reject(new ArtifactForgeError("Forge operation aborted", "divine-artifact-forge"));
    }
    if (args.length < 1 || args.some((arg) => arg.includes("\0"))) {
      return Promise.reject(new TypeError("Forge command requires a valid executable and arguments"));
    }
    const [executable, ...argv] = args;
    if (!executable) return Promise.reject(new TypeError("Forge executable is missing"));

    return new Promise((resolve, reject) => {
      let settled = false;
      let outputBytes = 0;
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      let timer: NodeJS.Timeout | undefined;
      let child: ReturnType<typeof spawn> | undefined;

      const cleanup = (): void => {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      const fail = (error: Error): void => {
        if (settled) return;
        settled = true;
        cleanup();
        child?.kill("SIGKILL");
        reject(error);
      };
      const onAbort = (): void => fail(
        new ArtifactForgeError("Forge operation aborted", "divine-artifact-forge")
      );
      const collect = (target: Buffer[], chunk: Buffer | string): void => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (buffer.byteLength > this.#maxOutputBytes - outputBytes) {
          fail(new ArtifactForgeError(
            `Forge process exceeded ${this.#maxOutputBytes} output bytes`,
            "divine-artifact-forge"
          ));
          return;
        }
        outputBytes += buffer.byteLength;
        target.push(buffer);
      };

      try {
        child = spawn(executable, argv, {
          cwd: this.#cwd,
          env: this.#env,
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"]
        });
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      child.stdout.on("data", (chunk: Buffer | string) => collect(stdout, chunk));
      child.stderr.on("data", (chunk: Buffer | string) => collect(stderr, chunk));
      child.on("error", (error) => fail(new ArtifactForgeError(
        `Unable to start forge process: ${error.message}`,
        "divine-artifact-forge"
      )));
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({
          exitCode: code ?? 1,
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8")
        });
      });

      timer = setTimeout(() => fail(new ArtifactForgeError(
        `Forge process exceeded timeout of ${this.#timeoutMs} ms`,
        "divine-artifact-forge"
      )), this.#timeoutMs);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
  }
}
