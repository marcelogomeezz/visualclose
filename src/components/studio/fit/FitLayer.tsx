"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, PerspectiveCamera } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Matrix4, DoubleSide, type PerspectiveCamera as ThreePerspectiveCamera } from "three";
import type { CameraSolve } from "@/core/geometry/camera";
import { unitDecimals } from "@/core/geometry/units";
import type { Dimensions } from "@/core/types";

const IVORY = "#ece6da";

/** Drives the Three.js camera from the homography solve. Converts from the CV frame (y down, z forward) to Three (y up, z backward). */
function SolvedCamera({ solve }: { solve: CameraSolve }) {
  const camRef = useRef<ThreePerspectiveCamera>(null);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const camera = camRef.current;
    if (!camera) return;
    const R = solve.R;
    const t = solve.t;
    const view = new Matrix4().set(
      R[0][0], R[0][1], R[0][2], t[0],
      -R[1][0], -R[1][1], -R[1][2], -t[1],
      -R[2][0], -R[2][1], -R[2][2], -t[2],
      0, 0, 0, 1,
    );
    const world = view.clone().invert();
    camera.position.setFromMatrixPosition(world);
    camera.quaternion.setFromRotationMatrix(world);
    camera.fov = solve.fovDeg;
    camera.aspect = size.width / size.height;
    camera.near = 0.05;
    camera.far = 500;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  }, [solve, size, invalidate]);
  return <PerspectiveCamera ref={camRef} makeDefault manual fov={solve.fovDeg} near={0.05} far={500} />;
}

function DimensionLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <span
        className="t-mono whitespace-nowrap"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.06em",
          color: IVORY,
          background: "rgba(13,13,13,0.72)",
          padding: "3px 6px",
          border: "1px solid rgba(236,230,218,0.18)",
        }}
      >
        {text}
      </span>
    </Html>
  );
}

/** Translucent architectural placement volume. Thin ivory lines, faint planes, corner ticks, dimension labels. */
export function PlacementVolume({ dimensions, showLabels = true, emphasis = 1 }: { dimensions: Dimensions; showLabels?: boolean; emphasis?: number }) {
  const { width: w, depth: d, height: h, units } = dimensions;
  const hw = w / 2;
  const hd = d / 2;
  const dec = unitDecimals(units);

  const edges = useMemo(() => {
    const b = { FL: [-hw, 0, hd], FR: [hw, 0, hd], BL: [-hw, 0, -hd], BR: [hw, 0, -hd] } as const;
    const t = { FL: [-hw, h, hd], FR: [hw, h, hd], BL: [-hw, h, -hd], BR: [hw, h, -hd] } as const;
    const base: [number, number, number][] = [b.FL, b.FR, b.BR, b.BL, b.FL].map((p) => [...p] as [number, number, number]);
    const top: [number, number, number][] = [t.FL, t.FR, t.BR, t.BL, t.FL].map((p) => [...p] as [number, number, number]);
    const verticals: [number, number, number][][] = (["FL", "FR", "BL", "BR"] as const).map((k) => [[...b[k]], [...t[k]]] as [number, number, number][]);
    return { base, top, verticals, b, t };
  }, [hw, hd, h]);

  const tick = Math.min(w, d) * 0.06;

  return (
    <group>
      {/* Faint planes */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color={IVORY} transparent opacity={0.045 * emphasis} depthWrite={false} side={DoubleSide} />
      </mesh>
      {/* Footprint plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={IVORY} transparent opacity={0.11 * emphasis} depthWrite={false} side={DoubleSide} />
      </mesh>
      {/* Edges */}
      <Line points={edges.base} color={IVORY} lineWidth={1.6} transparent opacity={0.95} />
      <Line points={edges.top} color={IVORY} lineWidth={1.1} transparent opacity={0.85} />
      {edges.verticals.map((pts, i) => (
        <Line key={i} points={pts} color={IVORY} lineWidth={1.1} transparent opacity={0.85} />
      ))}
      {/* Corner ticks */}
      {(["FL", "FR", "BL", "BR"] as const).map((k) => {
        const [x, , z] = edges.b[k];
        return (
          <group key={k}>
            <Line points={[[x - tick, 0.003, z], [x + tick, 0.003, z]]} color={IVORY} lineWidth={1.2} />
            <Line points={[[x, 0.003, z - tick], [x, 0.003, z + tick]]} color={IVORY} lineWidth={1.2} />
          </group>
        );
      })}
      {showLabels && (
        <>
          <DimensionLabel position={[0, 0, hd]} text={`W ${w.toFixed(dec)} ${units}`} />
          <DimensionLabel position={[hw, 0, 0]} text={`D ${d.toFixed(dec)} ${units}`} />
          <DimensionLabel position={[-hw, h / 2, hd]} text={`H ${h.toFixed(dec)} ${units}`} />
        </>
      )}
    </group>
  );
}

export function FitLayer({ solve, dimensions, zoom = 1, showLabels = true }: { solve: CameraSolve | null; dimensions: Dimensions; zoom?: number; showLabels?: boolean }) {
  const dpr = typeof window === "undefined" ? 1 : Math.min(3, (window.devicePixelRatio || 1) * zoom);
  if (!solve) return null;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        dpr={dpr}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, background: "transparent" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <SolvedCamera solve={solve} />
        <PlacementVolume dimensions={dimensions} showLabels={showLabels} />
      </Canvas>
    </div>
  );
}
