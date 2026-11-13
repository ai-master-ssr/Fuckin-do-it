export type ForgeCapability = "forge" | "verify" | "sign" | "content-addressed-storage";

export interface ForgePayloadSource { readonly directory: string; }

export interface ForgeRequest {
  readonly source: ForgePayloadSource;
  readonly artifact: { readonly id: string; readonly version: string; readonly name: string };
  readonly storeDirectory: string;
  readonly outputDirectory: string;
  readonly signingKeyPath?: string;
}

export interface ForgeReceipt {
  readonly artifact_blake3: string;
  readonly bundle_blake3: string;
  readonly bundle_size_bytes: number;
  readonly descriptor: string;
  readonly signature: string | null;
  readonly bundle: string;
  readonly object_count: number;
  readonly signed: boolean;
}

export interface VerifyRequest {
  readonly storeDirectory: string;
  readonly descriptorPath: string;
  readonly signaturePath?: string;
  readonly publicKeyPath?: string;
  readonly requireSignature?: boolean;
}

export interface VerificationReceipt {
  readonly valid: true;
  readonly artifact_blake3: string;
  readonly objects_verified: number;
  readonly signed: boolean;
}

export interface ArtifactForgeProvider {
  readonly id: string;
  readonly version: string;
  readonly capabilities: ReadonlySet<ForgeCapability>;
  forge(request: ForgeRequest, signal?: AbortSignal): Promise<ForgeReceipt>;
  verify(request: VerifyRequest, signal?: AbortSignal): Promise<VerificationReceipt>;
}

export class ArtifactForgeError extends Error {
  readonly providerId: string;
  readonly exitCode: number | null;

  constructor(message: string, providerId: string, exitCode: number | null = null) {
    super(message);
    this.name = "ArtifactForgeError";
    this.providerId = providerId;
    this.exitCode = exitCode;
  }
}
