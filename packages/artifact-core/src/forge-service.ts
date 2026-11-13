import type {
  ArtifactForgeProvider, ForgeReceipt, ForgeRequest, VerifyRequest, VerificationReceipt
} from "@mgs/artifact-contracts";
import { EngineRegistry } from "./engine-registry.js";

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9.+-]{0,63}$/;

export class ArtifactForgeService {
  constructor(private readonly registry: EngineRegistry) {}

  async forge(providerId: string, request: ForgeRequest, signal?: AbortSignal): Promise<ForgeReceipt> {
    validateForgeRequest(request);
    return this.requireCapability(providerId, "forge").forge(request, signal);
  }

  async verify(providerId: string, request: VerifyRequest, signal?: AbortSignal): Promise<VerificationReceipt> {
    if (!request.storeDirectory.trim() || !request.descriptorPath.trim()) {
      throw new TypeError("Store directory and descriptor path are required");
    }
    return this.requireCapability(providerId, "verify").verify(request, signal);
  }

  private requireCapability(providerId: string, capability: "forge" | "verify"): ArtifactForgeProvider {
    const provider = this.registry.get(providerId);
    if (!provider.capabilities.has(capability)) {
      throw new Error(`Provider ${providerId} does not support ${capability}`);
    }
    return provider;
  }
}

function validateForgeRequest(request: ForgeRequest): void {
  if (!SAFE_ID.test(request.artifact.id)) throw new TypeError("Artifact id is invalid");
  if (!SAFE_VERSION.test(request.artifact.version)) throw new TypeError("Artifact version is invalid");
  if (!request.artifact.name.trim()) throw new TypeError("Artifact name must not be empty");
  if (!request.source.directory.trim()) throw new TypeError("Source directory is required");
  if (!request.storeDirectory.trim() || !request.outputDirectory.trim()) {
    throw new TypeError("Store and output directories are required");
  }
}
