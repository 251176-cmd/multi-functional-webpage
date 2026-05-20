"use client";

import React, { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, OrbitControls, Sparkles, Text } from "@react-three/drei";
import type { JSX } from "react";
import * as THREE from "three";

/**
 * ThreeAboutHeroProps
 *
 * Purpose:
 * - Define the props for the Three.js hero canvas wrapper.
 *
 * Inputs:
 * - className: Optional string of Tailwind classes for layout control.
 *
 * Outputs:
 * - A responsive Three.js canvas showing a simple animated 3D shape.
 *
 * Side effects:
 * - Uses requestAnimationFrame inside @react-three/fiber for animation.
 */
export interface ThreeAboutHeroProps {
  className?: string;
}

/**
 * usePressedKeys
 *
 * Purpose:
 * - Track pressed keys for simple game controls.
 *
 * Inputs:
 * - None (listens to window keyboard events).
 *
 * Outputs:
 * - A Set of currently pressed keys (lowercased where appropriate).
 *
 * Side effects:
 * - Adds/removes global keydown/keyup listeners.
 */
function usePressedKeys(): ReadonlySet<string> {
  const [keys, setKeys] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = new Set(prev);
        next.add(e.key.toLowerCase());
        return next;
      });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("keyup", onKeyUp, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keys;
}

type Collectible = {
  id: string;
  position: [number, number, number];
  collected: boolean;
};

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function makeCollectibles(count: number): Collectible[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `c_${idx}_${Math.random().toString(16).slice(2)}`,
    position: [randomInRange(-3.2, 3.2), 0.25, randomInRange(-2.2, 2.2)],
    collected: false,
  }));
}

/**
 * UraniumRunner
 *
 * Purpose:
 * - A tiny playable 3D “game” for the About hero section.
 *
 * Inputs:
 * - onScore: Callback invoked when score changes.
 * - onGameOver: Callback invoked when the player hits the hazard.
 * - resetSeed: Changing this resets the game state.
 *
 * Outputs:
 * - A small scene: player, floor, collectibles, and a moving hazard.
 *
 * Side effects:
 * - Uses the render loop for movement/collisions.
 */
function UraniumRunner(props: {
  onScore: (score: number) => void;
  onGameOver: () => void;
  resetSeed: number;
}): JSX.Element {
  const { onScore, onGameOver, resetSeed } = props;
  const keys = usePressedKeys();

  const playerRef = React.useRef<THREE.Mesh | null>(null);
  const hazardRef = React.useRef<THREE.Mesh | null>(null);

  const [collectibles, setCollectibles] = React.useState<Collectible[]>(
    () => makeCollectibles(9),
  );
  const [score, setScore] = React.useState<number>(0);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);

  React.useEffect(() => {
    setCollectibles(makeCollectibles(9));
    setScore(0);
    setIsGameOver(false);

    if (playerRef.current) {
      playerRef.current.position.set(0, 0.35, 0);
    }
  }, [resetSeed]);

  React.useEffect(() => {
    onScore(score);
  }, [onScore, score]);

  useFrame((state, delta) => {
    const player = playerRef.current;
    const hazard = hazardRef.current;
    if (!player || !hazard) return;
    if (isGameOver) return;

    // Movement.
    const left = keys.has("a") || keys.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright");
    const up = keys.has("w") || keys.has("arrowup");
    const down = keys.has("s") || keys.has("arrowdown");

    const speed = 3.2; // units / second
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vz = (down ? 1 : 0) - (up ? 1 : 0);
    const v = new THREE.Vector3(vx, 0, vz);
    if (v.lengthSq() > 0) v.normalize();

    player.position.x = THREE.MathUtils.clamp(
      player.position.x + v.x * speed * delta,
      -3.6,
      3.6,
    );
    player.position.z = THREE.MathUtils.clamp(
      player.position.z + v.z * speed * delta,
      -2.6,
      2.6,
    );

    // Face direction a bit.
    if (v.lengthSq() > 0) {
      const targetYaw = Math.atan2(v.x, v.z);
      player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetYaw, 0.18);
    } else {
      player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, player.rotation.y + 0.25 * delta, 0.02);
    }

    // Hazard movement (simple orbit).
    const t = state.clock.elapsedTime;
    hazard.position.x = Math.cos(t * 0.9) * 2.9;
    hazard.position.z = Math.sin(t * 1.05) * 2.0;
    hazard.rotation.y += delta * 0.8;

    // Collision with hazard.
    const hazardRadius = 0.42;
    const playerRadius = 0.34;
    const dx = player.position.x - hazard.position.x;
    const dz = player.position.z - hazard.position.z;
    const dist2 = dx * dx + dz * dz;
    if (dist2 < (hazardRadius + playerRadius) ** 2) {
      setIsGameOver(true);
      onGameOver();
      return;
    }

    // Collectibles.
    setCollectibles((prev) => {
      let changed = false;
      let gained = 0;
      const next = prev.map((c) => {
        if (c.collected) return c;
        const cx = c.position[0];
        const cz = c.position[2];
        const ddx = player.position.x - cx;
        const ddz = player.position.z - cz;
        if (ddx * ddx + ddz * ddz < 0.52 ** 2) {
          changed = true;
          gained += 1;
          return { ...c, collected: true };
        }
        return c;
      });

      if (changed) setScore((s) => s + gained);
      return changed ? next : prev;
    });
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Soft grid */}
      <gridHelper
        args={[9, 18, "#14532d", "#052e16"]}
        position={[0, 0.001, 0]}
      />

      {/* Player */}
      <mesh ref={playerRef} position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.28, 0.7, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Player glow */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.48, 24, 24]} />
        <meshBasicMaterial
          color="#86efac"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Hazard */}
      <mesh ref={hazardRef} position={[2.2, 0.35, 0]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.25}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Collectibles */}
      {collectibles
        .filter((c) => !c.collected)
        .map((c) => (
          <group key={c.id} position={c.position}>
            <mesh castShadow>
              <sphereGeometry args={[0.18, 18, 18]} />
              <meshStandardMaterial
                color="#a3e635"
                emissive="#a3e635"
                emissiveIntensity={1.7}
                roughness={0.25}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.32, 18, 18]} />
              <meshBasicMaterial
                color="#bef264"
                transparent
                opacity={0.15}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}

      <Sparkles
        count={34}
        scale={[9, 3.5, 7]}
        size={2.5}
        speed={0.5}
        color="#86efac"
        opacity={0.6}
      />

      {/* In-world HUD */}
      <Billboard position={[0, 2.0, -2.8]} follow>
        <Text
          fontSize={0.24}
          color={isGameOver ? "#fecaca" : "#bbf7d0"}
          outlineColor="#020617"
          outlineWidth={0.02}
          anchorX="center"
          anchorY="middle"
        >
          {isGameOver ? "GAME OVER" : "WASD / Arrows to move"}
        </Text>
      </Billboard>
    </group>
  );
}

/**
 * ThreeAboutHero
 *
 * Purpose:
 * - Provide an isolated, reusable 3D hero illustration for the About page.
 *
 * Inputs:
 * - className: Optional string of Tailwind classes for layout control.
 *
 * Outputs:
 * - A responsive container that renders a Three.js canvas.
 *
 * Side effects:
 * - None beyond normal canvas rendering in the browser.
 */
export default function ThreeAboutHero(
  props: ThreeAboutHeroProps,
): JSX.Element {
  const { className } = props;
  const [score, setScore] = React.useState<number>(0);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);
  const [resetSeed, setResetSeed] = React.useState<number>(0);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/95
        shadow-[0_18px_60px_rgba(15,23,42,0.65)] backdrop-blur
        ${className ?? ""}
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(96,165,250,0.55),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(129,140,248,0.6),transparent_55%)]" />

      <div className="relative aspect-[4/3] sm:aspect-[5/4]">
        <Canvas
          camera={{ position: [0, 5.2, 5.4], fov: 45 }}
          dpr={[1, 2]}
          shadows
        >
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.28} />
          <directionalLight
            intensity={1.35}
            position={[3.5, 6, 3.5]}
            castShadow
          />
          <pointLight
            intensity={1}
            position={[-4, -2, -3]}
            color="#38bdf8"
          />

          <Suspense fallback={null}>
            <UraniumRunner
              resetSeed={resetSeed}
              onScore={(nextScore) => setScore(nextScore)}
              onGameOver={() => setIsGameOver(true)}
            />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center justify-between text-[11px] font-medium text-slate-300/80">
        <span className="uppercase tracking-[0.18em] text-slate-400">
          Uranium Runner
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-semibold text-slate-200/90">
            Score: {score}
          </span>
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-200/90 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
            onClick={() => {
              setIsGameOver(false);
              setResetSeed((s) => s + 1);
            }}
          >
            {isGameOver ? "Restart" : "Reset"}
          </button>
        </span>
      </div>
    </div>
  );
}

