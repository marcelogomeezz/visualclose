"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, MeshStandardMaterial, Vector3 } from "three";
import { gsap, EASE } from "@/lib/gsap";

export const CATEGORY_GROUPS = [
  { key: "outdoor", title: "EXTERIOR", items: ["Pérgolas", "Piscinas", "Jacuzzis", "Cocheras", "Placas solares"] },
  { key: "interior", title: "INTERIOR", items: ["Cocinas", "Armarios", "Mobiliario", "Baños"] },
  { key: "architecture", title: "ARQUITECTURA", items: ["Fachadas", "Ventanas", "Puertas", "Revestimientos", "Suelos"] },
  { key: "commercial", title: "COMERCIAL", items: ["Hoteles", "Gimnasios", "Retail", "Equipamiento comercial"] },
] as const;

type Mats = { dark: MeshStandardMaterial; ivory: MeshStandardMaterial; stone: MeshStandardMaterial; wood: MeshStandardMaterial; water: MeshStandardMaterial };

function useMats(): Mats {
  return useMemo(
    () => ({
      dark: new MeshStandardMaterial({ color: "#3a3835", roughness: 0.5, metalness: 0.35, transparent: true }),
      ivory: new MeshStandardMaterial({ color: "#d9d1c1", roughness: 0.85, transparent: true }),
      stone: new MeshStandardMaterial({ color: "#b9ad97", roughness: 0.95, transparent: true }),
      wood: new MeshStandardMaterial({ color: "#8a6e4b", roughness: 0.8, transparent: true }),
      water: new MeshStandardMaterial({ color: "#5f7d86", roughness: 0.2, metalness: 0.1, transparent: true }),
    }),
    [],
  );
}

const B = ({ p, s, m }: { p: [number, number, number]; s: [number, number, number]; m: MeshStandardMaterial }) => (
  <mesh position={p} material={m}>
    <boxGeometry args={s} />
  </mesh>
);

function Outdoor({ m }: { m: Mats }) {
  return (
    <group>
      {/* pergola */}
      {[[-2.6, -1.2], [-0.4, -1.2], [-2.6, 0.6], [-0.4, 0.6]].map(([x, z], i) => (
        <B key={i} p={[x, 1.1, z]} s={[0.1, 2.2, 0.1]} m={m.dark} />
      ))}
      <B p={[-1.5, 2.2, -0.3]} s={[2.4, 0.16, 2.0]} m={m.dark} />
      {/* pool */}
      <B p={[1.9, 0.03, -0.6]} s={[2.6, 0.06, 1.6]} m={m.water} />
      <B p={[1.9, 0.05, -0.6]} s={[2.8, 0.03, 1.8]} m={m.stone} />
      {/* solar */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[1.2 + i * 1.1, 0.55, 1.6]} rotation={[-0.5, 0, 0]} material={m.dark}>
          <boxGeometry args={[1.0, 0.04, 0.7]} />
        </mesh>
      ))}
      {/* jacuzzi */}
      <mesh position={[-2.2, 0.35, 2.0]} material={m.ivory}>
        <cylinderGeometry args={[0.6, 0.6, 0.7, 32]} />
      </mesh>
      <mesh position={[-2.2, 0.71, 2.0]} material={m.water}>
        <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
      </mesh>
    </group>
  );
}

function Interior({ m }: { m: Mats }) {
  return (
    <group>
      {/* kitchen run */}
      <B p={[-1.4, 0.45, -1.2]} s={[3.2, 0.9, 0.6]} m={m.dark} />
      <B p={[-1.4, 0.92, -1.2]} s={[3.3, 0.04, 0.66]} m={m.stone} />
      <B p={[-1.4, 1.9, -1.35]} s={[3.2, 0.7, 0.35]} m={m.wood} />
      {/* closet */}
      <B p={[1.6, 1.1, -1.0]} s={[1.4, 2.2, 0.6]} m={m.ivory} />
      {/* sofa */}
      <B p={[0.2, 0.22, 1.2]} s={[2.0, 0.44, 0.9]} m={m.ivory} />
      <B p={[0.2, 0.6, 1.55]} s={[2.0, 0.36, 0.2]} m={m.ivory} />
      {/* bathtub */}
      <B p={[2.3, 0.28, 1.3]} s={[1.6, 0.56, 0.8]} m={m.ivory} />
      <B p={[2.3, 0.57, 1.3]} s={[1.4, 0.02, 0.6]} m={m.water} />
    </group>
  );
}

function Architecture({ m }: { m: Mats }) {
  const panels = useMemo(() => {
    const out: [number, number][] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) out.push([-2.4 + c * 0.82 + (r % 2 ? 0.41 : 0), 0.4 + r * 0.62]);
    return out;
  }, []);
  return (
    <group>
      <B p={[0, 1.4, -1.6]} s={[5.4, 2.8, 0.3]} m={m.ivory} />
      {panels.map(([x, y], i) => (
        <B key={i} p={[x, y, -1.42]} s={[0.78, 0.58, 0.06]} m={m.stone} />
      ))}
      {/* window + door */}
      <B p={[-1.2, 1.5, -1.36]} s={[1.1, 0.8, 0.05]} m={m.dark} />
      <B p={[1.5, 1.0, -1.36]} s={[0.8, 1.9, 0.05]} m={m.dark} />
      {/* flooring */}
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => <B key={`${r}-${c}`} p={[-2.4 + c * 0.8, 0.02, 0.2 + r * 0.6]} s={[0.76, 0.04, 0.56]} m={m.stone} />),
      )}
    </group>
  );
}

function Commercial({ m }: { m: Mats }) {
  return (
    <group>
      {/* hotel bed */}
      <B p={[-1.8, 0.28, -0.6]} s={[1.8, 0.5, 2.0]} m={m.ivory} />
      <B p={[-1.8, 0.75, -1.6]} s={[1.9, 1.0, 0.12]} m={m.wood} />
      {/* gym rack */}
      {[[0.6, -1.2], [1.6, -1.2], [0.6, 0.0], [1.6, 0.0]].map(([x, z], i) => (
        <B key={i} p={[x, 1.1, z]} s={[0.08, 2.2, 0.08]} m={m.dark} />
      ))}
      <B p={[1.1, 2.15, -0.6]} s={[1.1, 0.06, 1.3]} m={m.dark} />
      <mesh position={[1.1, 1.2, -1.2]} rotation={[0, 0, Math.PI / 2]} material={m.dark}>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 12]} />
      </mesh>
      {/* retail shelves */}
      {[0.3, 0.9, 1.5].map((y, i) => (
        <B key={i} p={[0.9, y, 1.5]} s={[2.6, 0.05, 0.5]} m={m.wood} />
      ))}
      <B p={[-0.35, 0.9, 1.5]} s={[0.05, 1.8, 0.5]} m={m.dark} />
      <B p={[2.15, 0.9, 1.5]} s={[0.05, 1.8, 0.5]} m={m.dark} />
      {/* reception counter */}
      <B p={[-2.0, 0.55, 1.6]} s={[1.4, 1.1, 0.6]} m={m.dark} />
      <B p={[-2.0, 1.12, 1.6]} s={[1.5, 0.04, 0.7]} m={m.stone} />
    </group>
  );
}

function Rig({ active }: { active: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const angle = useRef(0);
  useFrame((_, dt) => {
    const target = -0.3 + active * 0.3;
    angle.current = MathUtils.damp(angle.current, target, 2.2, dt);
    const portrait = size.width < size.height;
    const r = portrait ? 15 : 11.5;
    camera.position.set(Math.sin(angle.current) * r + 1.5, portrait ? 6.5 : 5.4, Math.cos(angle.current) * r + 2);
    camera.lookAt(new Vector3(0, 0.6, 0));
  });
  return null;
}

function Groups({ active }: { active: number }) {
  const m = useMats();
  const refs = useRef<(Group | null)[]>([]);
  useEffect(() => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      const on = i === active;
      if (on) g.visible = true;
      gsap.to(g.position, { y: on ? 0 : -0.9, duration: 0.9, ease: EASE.inOut });
      gsap.to(g.scale, {
        x: on ? 1 : 0.88,
        y: on ? 1 : 0.88,
        z: on ? 1 : 0.88,
        duration: 0.9,
        ease: EASE.inOut,
        onComplete: () => {
          if (!on) g.visible = false;
        },
      });
    });
  }, [active]);
  const scenes = [Outdoor, Interior, Architecture, Commercial];
  return (
    <>
      {scenes.map((Scene, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={i === active}
          position={[0, i === active ? 0 : -0.9, 0]}
        >
          <Scene m={m} />
        </group>
      ))}
    </>
  );
}

export function CategoryScene({ active }: { active: number }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 30, near: 0.1, far: 60, position: [4, 4.2, 10] }} gl={{ antialias: true }} className="!absolute inset-0">
      <color attach="background" args={["#f1eee8"]} />
      <fog attach="fog" args={["#f1eee8", 16, 32]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[5, 8, 5]} intensity={2} color="#f4ead8" />
      <directionalLight position={[-6, 3, -4]} intensity={0.9} color="#8a7452" />
      <Rig active={active} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#e4dccd" roughness={1} />
      </mesh>
      <Groups active={active} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.28} scale={16} blur={2.6} far={4} color="#3a3128" />
    </Canvas>
  );
}
