"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Grid } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { Group, MathUtils, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { PlacementVolume } from "@/components/studio/fit/FitLayer";

const BASE = new Vector3(9.2, 3.9, 11.2);
const LOOK = new Vector3(-1.6, 1.0, -0.4);

/** Slow camera drift, faint mouse parallax, scroll push-in. No orbiting. */
function Rig() {
  const camera = useThree((s) => s.camera);
  const mouse = useRef({ x: 0, y: 0 });
  useFrame((state, dt) => {
    mouse.current.x = MathUtils.damp(mouse.current.x, state.pointer.x, 2.2, dt);
    mouse.current.y = MathUtils.damp(mouse.current.y, state.pointer.y, 2.2, dt);
    const scroll = typeof window === "undefined" ? 0 : Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    const t = state.clock.elapsedTime;
    const drift = Math.sin(t * 0.12) * 0.25;
    const target = new Vector3(
      BASE.x + mouse.current.x * 0.5 + drift - scroll * 1.6,
      BASE.y + mouse.current.y * 0.25 + scroll * 0.4,
      BASE.z - scroll * 2.4,
    );
    camera.position.lerp(target, 1 - Math.exp(-dt * 2.5));
    camera.lookAt(LOOK);
  });
  return null;
}

/** The first product, built from architectural primitives. Materialises over a few seconds: "see it before it exists". */
function Product({ appearAfter = 0.6 }: { appearAfter?: number }) {
  const group = useRef<Group>(null);
  const material = useMemo(() => new MeshStandardMaterial({ color: "#1b1b1b", roughness: 0.55, metalness: 0.3, transparent: true, opacity: 0 }), []);
  const light = useMemo(() => new MeshStandardMaterial({ color: "#2c2b29", roughness: 0.6, metalness: 0.25, transparent: true, opacity: 0 }), []);
  const w = 5;
  const d = 4;
  const h = 2.7;
  const post = 0.14;
  const beam = 0.24;
  useFrame((state) => {
    const t = Math.max(0, state.clock.elapsedTime - appearAfter);
    const k = 1 - Math.exp(-t * 0.9);
    const g = group.current;
    if (!g) return;
    g.position.y = (1 - k) * 0.25;
    g.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) (mesh.material as MeshStandardMaterial).opacity = k;
    });
  });
  const louvers = useMemo(() => Array.from({ length: 13 }, (_, i) => -d / 2 + 0.3 + i * 0.28), [d]);
  return (
    <group ref={group}>
      {[
        [-w / 2 + post / 2, d / 2 - post / 2],
        [w / 2 - post / 2, d / 2 - post / 2],
        [-w / 2 + post / 2, -d / 2 + post / 2],
        [w / 2 - post / 2, -d / 2 + post / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, h / 2, z]} material={material} castShadow>
          <boxGeometry args={[post, h, post]} />
        </mesh>
      ))}
      <mesh position={[0, h - beam / 2, d / 2 - 0.1]} material={material}>
        <boxGeometry args={[w, beam, 0.2]} />
      </mesh>
      <mesh position={[0, h - beam / 2, -d / 2 + 0.1]} material={material}>
        <boxGeometry args={[w, beam, 0.2]} />
      </mesh>
      <mesh position={[-w / 2 + 0.1, h - beam / 2, 0]} material={material}>
        <boxGeometry args={[0.2, beam, d]} />
      </mesh>
      <mesh position={[w / 2 - 0.1, h - beam / 2, 0]} material={material}>
        <boxGeometry args={[0.2, beam, d]} />
      </mesh>
      {louvers.map((z, i) => (
        <mesh key={i} position={[0, h - 0.1, z]} rotation={[-0.6, 0, 0]} material={light}>
          <boxGeometry args={[w - 0.4, 0.03, 0.24]} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 30, near: 0.1, far: 80, position: BASE.toArray() }} gl={{ antialias: true, powerPreference: "high-performance" }} shadows={false} className="!absolute inset-0">
      <color attach="background" args={["#0f0f0f"]} />
      <fog attach="fog" args={["#0f0f0f", 14, 34]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 9, 4]} intensity={1.6} color="#f4ead8" />
      <directionalLight position={[-8, 4, -6]} intensity={0.7} color="#c9b48c" />
      <Rig />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#141414" roughness={1} />
      </mesh>
      <Grid args={[60, 60]} cellSize={1} cellThickness={0.5} cellColor="#242424" sectionSize={5} sectionThickness={0.8} sectionColor="#2f2d29" fadeDistance={26} fadeStrength={1.6} infiniteGrid position={[0, 0.001, 0]} />
      <PlacementVolume dimensions={{ width: 5, depth: 4, height: 2.7, units: "m" }} showLabels={false} emphasis={1.2} />
      <Product />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={22} blur={2.6} far={5} color="#000000" />
    </Canvas>
  );
}
