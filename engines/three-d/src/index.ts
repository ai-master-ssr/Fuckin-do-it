import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  depthScale,
  validateSceneState,
  type SemanticEntity,
  type SemanticSceneState
} from "./semantic-state.js";
import type { RenderPlugin } from "./plugins/geometric-light.js";

export interface ThreeDEngineOptions {
  readonly antialias?: boolean;
  readonly alpha?: boolean;
  readonly pixelRatioLimit?: number;
  readonly clearColor?: string | number;
}

export interface EngineCapabilities {
  readonly webgl: true;
  readonly gltf: true;
  readonly glb: true;
  readonly semanticScene: true;
  readonly pluginPipeline: true;
}

const CAPABILITIES: EngineCapabilities = Object.freeze({
  webgl: true, gltf: true, glb: true, semanticScene: true, pluginPipeline: true
});

function makeGeometry(kind: SemanticEntity["primitive"]): THREE.BufferGeometry {
  switch (kind) {
    case "box": return new THREE.BoxGeometry(1, 1, 1);
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 24);
    case "torus": return new THREE.TorusGeometry(0.5, 0.16, 16, 64);
  }
}

export class ThreeDEngine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly #loader = new GLTFLoader();
  readonly #plugins = new Map<string, RenderPlugin>();
  readonly #objects = new Map<string, THREE.Mesh>();
  readonly #pixelRatioLimit: number;
  #disposed = false;

  constructor(canvas: HTMLCanvasElement, options: ThreeDEngineOptions = {}) {
    this.#pixelRatioLimit = options.pixelRatioLimit ?? 2;
    if (!Number.isFinite(this.#pixelRatioLimit) || this.#pixelRatioLimit < 1) {
      throw new RangeError("pixelRatioLimit must be a finite number >= 1");
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.#pixelRatioLimit));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.scene.background = new THREE.Color(options.clearColor ?? 0x080b10);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    this.camera.position.set(4, 3, 6);
    this.camera.lookAt(0, 0, 0);

    const ambient = new THREE.HemisphereLight(0xc6d8eb, 0x141820, 1.4);
    ambient.name = "engine:ambient";
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.name = "engine:key";
    key.position.set(4, 7, 5);
    this.scene.add(key);
    this.resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
  }

  get capabilities(): EngineCapabilities {
    return CAPABILITIES;
  }

  registerPlugin(plugin: RenderPlugin): void {
    this.#assertLive();
    if (!plugin.id.trim()) throw new TypeError("Plugin id must not be empty");
    if (this.#plugins.has(plugin.id)) throw new Error(`Render plugin already registered: ${plugin.id}`);
    this.#plugins.set(plugin.id, plugin);
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.#plugins.get(pluginId);
    if (!plugin) return;
    plugin.dispose();
    this.#plugins.delete(pluginId);
  }

  resize(width: number, height: number): void {
    this.#assertLive();
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new RangeError("Viewport width and height must be positive finite numbers");
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(Math.floor(width), Math.floor(height), false);
  }

  render(state: SemanticSceneState): void {
    this.#assertLive();
    validateSceneState(state);
    if (state.background) this.scene.background = new THREE.Color(state.background);

    const active = new Set<string>();
    for (const entity of state.entities) {
      active.add(entity.id);
      let mesh = this.#objects.get(entity.id);
      if (!mesh) {
        mesh = new THREE.Mesh(makeGeometry(entity.primitive), new THREE.MeshStandardMaterial());
        mesh.name = entity.id;
        this.#objects.set(entity.id, mesh);
        this.scene.add(mesh);
      } else if (mesh.userData.primitive !== entity.primitive) {
        mesh.geometry.dispose();
        mesh.geometry = makeGeometry(entity.primitive);
      }

      const material = mesh.material as THREE.MeshStandardMaterial;
      material.color.set(entity.contradiction ? 0x000000 : entity.color);
      material.roughness = entity.roughness ?? 0.55;
      material.metalness = entity.metalness ?? 0.15;
      material.needsUpdate = true;
      mesh.userData.primitive = entity.primitive;

      const scale = entity.scale ?? [1, 1, 1];
      const perspectiveScale = depthScale(entity.depthLayer);
      mesh.position.set(...entity.position);
      mesh.scale.set(
        scale[0] * perspectiveScale,
        scale[1] * perspectiveScale,
        scale[2] * perspectiveScale
      );
    }

    for (const [id, mesh] of this.#objects) {
      if (!active.has(id)) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.scene.remove(mesh);
        this.#objects.delete(id);
      }
    }

    if (state.camera?.position) this.camera.position.set(...state.camera.position);
    if (state.camera?.target) this.camera.lookAt(...state.camera.target);
    if (state.camera?.fov !== undefined) {
      if (state.camera.fov <= 0 || state.camera.fov >= 180) throw new RangeError("Camera fov must be between 0 and 180");
      this.camera.fov = state.camera.fov;
      this.camera.updateProjectionMatrix();
    }

    for (const plugin of this.#plugins.values()) {
      plugin.apply({ scene: this.scene, entityObjects: this.#objects, entities: state.entities });
    }
    this.renderer.render(this.scene, this.camera);
  }

  async loadGLTF(source: string | ArrayBuffer): Promise<THREE.Group> {
    this.#assertLive();
    const gltf = typeof source === "string"
      ? await this.#loader.loadAsync(source)
      : await this.#loader.parseAsync(source, "");
    this.#assertLive();
    this.scene.add(gltf.scene);
    return gltf.scene;
  }

  dispose(): void {
    if (this.#disposed) return;
    for (const plugin of this.#plugins.values()) plugin.dispose();
    this.#plugins.clear();
    for (const mesh of this.#objects.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.#objects.clear();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
    this.renderer.dispose();
    this.#disposed = true;
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error("ThreeDEngine has been disposed");
  }
}

export { depthScale, validateSceneState } from "./semantic-state.js";
export type { SemanticEntity, SemanticSceneState, DepthLayer, PrimitiveKind } from "./semantic-state.js";
export { GeometricLightPlugin } from "./plugins/geometric-light.js";
export type { RenderPlugin, RenderPluginContext } from "./plugins/geometric-light.js";
