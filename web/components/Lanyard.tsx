"use client";

// Draggable 3D lanyard ID-card hanging by a physics band.
// Adapted for Next.js (App Router / Turbopack) from React Bits' Lanyard
// (DavidHDev/react-bits, MIT). Key Next adaptations:
//   - "use client" + meant to be loaded via next/dynamic({ ssr:false })
//   - assets referenced by public-URL string, not bundler imports
//   - TypeScript-friendly; meshline JSX typed in types/meshline.d.ts

import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

const CARD_GLB = "/lanyard/card.glb";
const LANYARD_TEXTURE = "/lanyard/lanyard.png";

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
}: LanyardProps) {
  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={1 / 60}>
          <Band />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

type GLTFResult = GLTF & {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
  };
};

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
}

function Band({ maxSpeed = 50, minSpeed = 0 }: BandProps) {
  const band = useRef<THREE.Mesh>(null);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    type: "dynamic" as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  const { nodes, materials } = useGLTF(CARD_GLB) as unknown as GLTFResult;
  const texture = useTexture(LANYARD_TEXTURE);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, setDragged] = useState<false | THREE.Vector3>(false);
  const [hovered, setHovered] = useState(false);
  const [isSmall, setIsSmall] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024
  );

  // rapier's joint hooks expect non-null RefObjects; our refs start null.
  type RBRef = RefObject<RapierRigidBody>;
  useRopeJoint(fixed as RBRef, j1 as RBRef, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1 as RBRef, j2 as RBRef, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2 as RBRef, j3 as RBRef, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3 as RBRef, card as RBRef, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const r = ref.current;
        if (!r) return;
        // typed as any-free: lerped is our own augmentation
        const lr = r as RapierRigidBody & { lerped?: THREE.Vector3 };
        if (!lr.lerped) lr.lerped = new THREE.Vector3().copy(r.translation());
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, lr.lerped.distanceTo(r.translation()))
        );
        lr.lerped.lerp(
          r.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      const j3t = j3.current!.translation();
      const j2l =
        (j2.current as RapierRigidBody & { lerped?: THREE.Vector3 }).lerped ??
        new THREE.Vector3().copy(j2.current!.translation());
      const j1l =
        (j1.current as RapierRigidBody & { lerped?: THREE.Vector3 }).lerped ??
        new THREE.Vector3().copy(j1.current!.translation());
      const fixedt = fixed.current.translation();
      curve.points[0].copy(j3t);
      curve.points[1].copy(j2l);
      curve.points[2].copy(j1l);
      curve.points[3].copy(fixedt);
      const bandGeom = band.current?.geometry as
        | (THREE.BufferGeometry & {
            setPoints?: (pts: THREE.Vector3[]) => void;
          })
        | undefined;
      bandGeom?.setPoints?.(curve.getPoints(32));
      // keep card upright-ish
      if (card.current) {
        ang.copy(card.current.angvel() as THREE.Vector3);
        rot.copy(card.current.rotation() as unknown as THREE.Vector3);
        card.current.setAngvel(
          { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
          true
        );
      }
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture?.(e.pointerId);
              setDragged(false);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              setDragged(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current!.translation()))
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={materials.base.map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isSmall ? [1000, 2000] : [1000, 1000]}
          useMap={1}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB);
