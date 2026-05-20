import LoadingScreen3D from "@/src/components/three/LoadingScreen3D";

/**
 * Route segment loading UI for `/three-loading-demo`.
 *
 * Purpose:
 * - Demonstrate a Three.js-powered 3D loading screen using Next.js App Router.
 */
export default function Loading(): React.JSX.Element {
  return (
    <LoadingScreen3D
      title="Loading the 3D demo"
      subtitle="Rendering WebGL and streaming the page…"
    />
  );
}

