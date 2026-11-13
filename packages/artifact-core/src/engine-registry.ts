import type { ArtifactForgeProvider, ForgeCapability } from "@mgs/artifact-contracts";

export class EngineRegistry {
  readonly #providers = new Map<string, ArtifactForgeProvider>();

  register(provider: ArtifactForgeProvider): void {
    if (!provider.id.trim()) throw new TypeError("Engine provider id must not be empty");
    if (!provider.version.trim()) throw new TypeError("Engine provider version must not be empty");
    if (this.#providers.has(provider.id)) {
      throw new Error(`Engine provider already registered: ${provider.id}`);
    }
    this.#providers.set(provider.id, provider);
  }

  get(providerId: string): ArtifactForgeProvider {
    const provider = this.#providers.get(providerId);
    if (!provider) throw new Error(`Unknown artifact engine provider: ${providerId}`);
    return provider;
  }

  findByCapability(capability: ForgeCapability): readonly ArtifactForgeProvider[] {
    return [...this.#providers.values()].filter((provider) => provider.capabilities.has(capability));
  }

  list(): readonly Pick<ArtifactForgeProvider, "id" | "version" | "capabilities">[] {
    return [...this.#providers.values()].map(({ id, version, capabilities }) => ({
      id, version, capabilities
    }));
  }
}
