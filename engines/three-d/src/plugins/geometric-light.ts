import * as THREE from "three";
import type { SemanticEntity } from "../semantic-state.js";

export interface RenderPluginContext {
  readonly scene: THREE.Scene;
  readonly entityObjects: ReadonlyMap<string, THREE.Object3D>;
  readonly entities: readonly SemanticEntity[];
}

export interface RenderPlugin {
  readonly id: string;
  apply(context: RenderPluginContext): void;
  dispose(): void;
}

const GOLD = 0xd7b56d;
const SHARD = 0xb8d5e8;

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Encodes semantic evidence state as geometry. It does not infer evidence,
 * authority, certainty, or momentum; it only renders values supplied by the scene.
 */
export class GeometricLightPlugin implements RenderPlugin {
  readonly id = "divine.geometric-light";
  readonly #root = new THREE.Group();
  readonly #groups = new Map<string, THREE.Group>();

  constructor(private readonly maxShardsPerEntity = 24) {
    if (!Number.isInteger(maxShardsPerEntity) || maxShardsPerEntity < 0) {
      throw new RangeError("maxShardsPerEntity must be a non-negative integer");
    }
    this.#root.name = "geometric-light-effects";
  }

  apply(context: RenderPluginContext): void {
    if (this.#root.parent !== context.scene) context.scene.add(this.#root);
    const active = new Set<string>();

    for (const entity of context.entities) {
      const cost = entity.verificationCost ?? 0;
      const witnessed = entity.witnessedMoments ?? 0;
      const debt = entity.epistemicDebt ?? 0;
      const velocity = entity.velocity ?? [0, 0, 0];
      const speed = Math.hypot(...velocity);
      const refraction = entity.refractionIndex ?? 1;
      const group = this.#groups.get(entity.id) ?? this.#createGroup(entity.id);
      active.add(entity.id);
      this.#disposeObject(group);
      group.clear();
      group.position.set(...entity.position);
      const scale = entity.scale ?? [1, 1, 1];
      group.scale.set(...scale);

      // Verification cost: hard concentric rings, with intensity and count
      // increasing with the supplied cost value.
      const ringCount = Math.ceil(cost * 5);
      for (let i = 0; i < ringCount; i += 1) {
        const radius = 0.72 + i * 0.17;
        const geometry = new THREE.TorusGeometry(radius, 0.012 + cost * 0.018, 4, 96);
        const material = new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.45 + cost * 0.55
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 0.012;
        group.add(ring);
      }

      // Witnessed moments and epistemic debt become discrete data shards.
      const shardCount = Math.min(this.maxShardsPerEntity, witnessed + Math.ceil(debt * 12));
      for (let i = 0; i < shardCount; i += 1) {
        const angle = seededUnit(i + entity.id.length * 13) * Math.PI * 2;
        const radius = 0.9 + seededUnit(i + 41) * 0.65;
        const height = (seededUnit(i + 83) - 0.5) * 1.8;
        const size = 0.025 + debt * 0.045;
        const shard = new THREE.Mesh(
          new THREE.OctahedronGeometry(size, 0),
          new THREE.MeshBasicMaterial({ color: debt > 0.5 ? 0xe28a64 : SHARD })
        );
        shard.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        group.add(shard);
      }

      // Momentum is shown as a sharp vector trail; zero velocity produces none.
      if (speed > 0.0001) {
        const direction = new THREE.Vector3(...velocity).normalize();
        const origin = new THREE.Vector3(0, 0, 0);
        const end = direction.clone().multiplyScalar(Math.min(3, 0.35 + speed));
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([origin, end]),
          new THREE.LineBasicMaterial({ color: 0x9ed5ff })
        );
        group.add(line);
      }

      // High-index geometry receives deterministic fracture lines as a
      // state marker; this is a visual encoding, not a physical refraction solver.
      if (refraction >= 1.5) {
        const fracture = new THREE.Group();
        const count = Math.min(18, Math.ceil((refraction - 1) * 8));
        for (let i = 0; i < count; i += 1) {
          const a = seededUnit(i + 101) * Math.PI * 2;
          const b = a + (seededUnit(i + 211) - 0.5) * 0.8;
          const points = [
            new THREE.Vector3(Math.cos(a), Math.sin(a), 0),
            new THREE.Vector3(Math.cos(b) * 0.75, Math.sin(b) * 0.75, 0.08)
          ];
          fracture.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xc4d9ed, transparent: true, opacity: 0.85 })
          ));
        }
        group.add(fracture);
      }
    }

    for (const [id, group] of this.#groups) {
      if (!active.has(id)) {
        this.#disposeObject(group);
        this.#root.remove(group);
        this.#groups.delete(id);
      }
    }
  }

  dispose(): void {
    this.#disposeObject(this.#root);
    this.#root.removeFromParent();
    this.#groups.clear();
  }

  #createGroup(id: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `glr:${id}`;
    this.#groups.set(id, group);
    this.#root.add(group);
    return group;
  }

  #disposeObject(root: THREE.Object3D): void {
    root.traverse((object) => {
      const renderable = object as THREE.Mesh;
      renderable.geometry?.dispose?.();
      const material = renderable.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
  }
}
