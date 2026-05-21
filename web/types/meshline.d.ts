// Minimal typings for the `meshline` package + its JSX intrinsic elements
// registered with @react-three/fiber's extend().
import type { Object3DNode, MaterialNode } from "@react-three/fiber";
import type * as THREE from "three";

declare module "meshline" {
  export class MeshLineGeometry extends THREE.BufferGeometry {
    setPoints(
      points: Array<THREE.Vector3 | [number, number, number]> | Float32Array
    ): void;
  }
  export class MeshLineMaterial extends THREE.Material {
    constructor(parameters?: Record<string, unknown>);
    lineWidth: number;
    color: THREE.Color;
    map: THREE.Texture | null;
    useMap: number;
    repeat: THREE.Vector2;
    resolution: THREE.Vector2;
    depthTest: boolean;
  }
}

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<
      import("meshline").MeshLineGeometry,
      typeof import("meshline").MeshLineGeometry
    >;
    meshLineMaterial: MaterialNode<
      import("meshline").MeshLineMaterial,
      typeof import("meshline").MeshLineMaterial
    >;
  }
}
