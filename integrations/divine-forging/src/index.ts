import {
  ArtifactForgeError,
  type ArtifactForgeProvider,
  type ForgeCapability,
  type ForgeReceipt,
  type ForgeRequest,
  type VerificationReceipt,
  type VerifyRequest
} from "@mgs/artifact-contracts";
import { EngineRegistry, ArtifactForgeService } from "@mgs/artifact-core";

export interface ForgeProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ForgeProcessRunner {
  /** Execute argv without a shell; enforce timeout, output limits, and abort handling. */
  run(args: readonly string[], signal?: AbortSignal): Promise<ForgeProcessResult>;
}

export interface DivineForgeAdapterOptions {
  readonly runner: ForgeProcessRunner;
  readonly executable?: string;
}

const CAPABILITIES: ReadonlySet<ForgeCapability> = new Set([
  "forge", "verify", "sign", "content-addressed-storage"
]);

export class DivineForgeAdapter implements ArtifactForgeProvider {
  readonly id = "divine-artifact-forge";
  readonly version = "0.2.0";
  readonly capabilities = CAPABILITIES;
  readonly #runner: ForgeProcessRunner;
  readonly #executable: string;

  constructor(options: DivineForgeAdapterOptions) {
    this.#runner = options.runner;
    this.#executable = options.executable ?? "python3";
  }

  async forge(request: ForgeRequest, signal?: AbortSignal): Promise<ForgeReceipt> {
    const args = [
      "workshop/forge_engine.py", "forge",
      "--source", request.source.directory,
      "--store", request.storeDirectory,
      "--output", request.outputDirectory,
      "--id", request.artifact.id,
      "--version", request.artifact.version,
      "--name", request.artifact.name
    ];
    if (request.signingKeyPath) args.push("--signing-key", request.signingKeyPath);
    const result = await this.execute(args, signal);
    return validateForgeReceipt(parseJson(result, "forge"));
  }

  async verify(request: VerifyRequest, signal?: AbortSignal): Promise<VerificationReceipt> {
    const args = [
      "workshop/forge_engine.py", "verify",
      "--store", request.storeDirectory,
      "--descriptor", request.descriptorPath
    ];
    if (request.signaturePath) args.push("--signature", request.signaturePath);
    if (request.publicKeyPath) args.push("--public-key", request.publicKeyPath);
    if (request.requireSignature) args.push("--require-signature");
    const result = await this.execute(args, signal);
    const receipt = parseJson(result, "verify");
    if (!isRecord(receipt) || receipt.valid !== true ||
        typeof receipt.artifact_blake3 !== "string" ||
        !Number.isInteger(receipt.objects_verified) || typeof receipt.signed !== "boolean") {
      throw new ArtifactForgeError("Forge verification returned an invalid receipt", this.id);
    }
    return receipt as unknown as VerificationReceipt;
  }

  private async execute(args: readonly string[], signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw new ArtifactForgeError("Forge operation aborted", this.id);
    const result = await this.#runner.run([this.#executable, ...args], signal);
    if (result.exitCode !== 0) {
      throw new ArtifactForgeError(
        result.stderr.trim() || `Forge process exited with code ${result.exitCode}`,
        this.id,
        result.exitCode
      );
    }
    return result.stdout;
  }
}

function parseJson(stdout: string, operation: string): unknown {
  try { return JSON.parse(stdout) as unknown; }
  catch {
    throw new ArtifactForgeError(`Divine Forge ${operation} returned invalid JSON`, "divine-artifact-forge");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateForgeReceipt(value: unknown): ForgeReceipt {
  if (!isRecord(value) ||
      typeof value.artifact_blake3 !== "string" ||
      typeof value.bundle_blake3 !== "string" ||
      !Number.isSafeInteger(value.bundle_size_bytes) ||
      typeof value.descriptor !== "string" ||
      !(typeof value.signature === "string" || value.signature === null) ||
      typeof value.bundle !== "string" ||
      !Number.isSafeInteger(value.object_count) ||
      typeof value.signed !== "boolean") {
    throw new ArtifactForgeError("Forge returned an invalid receipt", "divine-artifact-forge");
  }
  return value as unknown as ForgeReceipt;
}

export function createDivineForgeCore(options: DivineForgeAdapterOptions): {
  readonly registry: EngineRegistry;
  readonly forge: ArtifactForgeService;
  readonly provider: DivineForgeAdapter;
} {
  const registry = new EngineRegistry();
  const provider = new DivineForgeAdapter(options);
  registry.register(provider);
  return { registry, forge: new ArtifactForgeService(registry), provider };
}
