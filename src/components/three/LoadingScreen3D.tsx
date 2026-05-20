"use client";

import React from "react";
import * as THREE from "three";

export type LoadingScreen3DProps = {
  title?: string;
  subtitle?: string;
};

type Size = { width: number; height: number };

function getSize(el: HTMLElement): Size {
  const rect = el.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  return { width, height };
}

function safeDispose(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((m) => m.dispose());
  } else {
    material.dispose();
  }
}

export default function LoadingScreen3D({
  title = "Loading",
  subtitle = "Preparing the experience…",
}: LoadingScreen3DProps): React.JSX.Element {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050816, 8, 18);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0.6, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));

    const { width, height } = getSize(mount);
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0x93c5fd, 1.15);
    key.position.set(3, 4, 3);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xa78bfa, 0.85);
    rim.position.set(-4, 2.5, -2);
    scene.add(rim);

    // Purpose: Create a clean, “premium” animated loader.
    const group = new THREE.Group();
    scene.add(group);

    const torusGeo = new THREE.TorusGeometry(1.35, 0.24, 36, 180);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.35,
      metalness: 0.35,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.1,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    group.add(torus);

    const knotGeo = new THREE.TorusKnotGeometry(0.55, 0.16, 180, 24);
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      roughness: 0.3,
      metalness: 0.45,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.08,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, 0.15, 0.05);
    group.add(knot);

    const dotsGeo = new THREE.IcosahedronGeometry(0.04, 0);
    const dotsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    });

    const dots: THREE.Mesh[] = [];
    for (let i = 0; i < 160; i += 1) {
      const dot = new THREE.Mesh(dotsGeo, dotsMat);
      const r = 2.8 + Math.random() * 3.3;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.2;
      dot.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      dot.scale.setScalar(0.8 + Math.random() * 1.6);
      dots.push(dot);
      group.add(dot);
    }

    let raf = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    function renderFrame(): void {
      if (isDisposed) return;
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        torus.rotation.x = t * 0.35;
        torus.rotation.y = t * 0.75;

        knot.rotation.x = t * 0.7;
        knot.rotation.y = t * 0.9;

        group.rotation.y = t * 0.18;
        group.position.y = Math.sin(t * 1.15) * 0.06;

        for (let i = 0; i < dots.length; i += 1) {
          const d = dots[i];
          d.position.y += Math.sin(t * 0.9 + i) * 0.0004;
        }
      }

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(renderFrame);
    }

    raf = window.requestAnimationFrame(renderFrame);

    const ro = new ResizeObserver(() => {
      const next = getSize(mount);
      camera.aspect = next.width / next.height;
      camera.updateProjectionMatrix();
      renderer.setSize(next.width, next.height, false);
    });
    ro.observe(mount);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(raf);
      ro.disconnect();

      scene.remove(group);
      torusGeo.dispose();
      knotGeo.dispose();
      dotsGeo.dispose();
      safeDispose(torusMat);
      safeDispose(knotMat);
      safeDispose(dotsMat);

      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-transparent">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_-10%,rgba(96,165,250,0.16),transparent_60%),radial-gradient(900px_600px_at_90%_10%,rgba(167,139,250,0.14),transparent_58%)]" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="relative mx-auto w-[92vw] max-w-3xl px-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200/30 bg-white/5 backdrop-blur-xl">
          <div className="grid gap-0 md:grid-cols-12">
            <div className="md:col-span-7">
              <div ref={mountRef} className="h-[320px] w-full md:h-[420px]" />
            </div>
            <div className="md:col-span-5">
              <div className="flex h-full flex-col justify-center p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-wider text-blue-200 uppercase">
                  Three.js demo
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  {title}
                  <span className="text-blue-200">…</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {subtitle}
                </p>

                <div className="mt-6 space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-violet-400" />
                  </div>
                  <p className="text-xs text-white/60">
                    Tip: this is a segment `loading.tsx` screen—navigate away to
                    see it again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

