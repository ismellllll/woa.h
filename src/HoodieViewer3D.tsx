import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function HoodieModel() {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/grjr-hoodie.glb");

  // Center model and enable shadows
  useLayoutEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center); // move center to (0,0,0)
  }, [scene]);

  // Slow auto-rotation
  useFrame((_state, delta: number) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={group} scale={1.8}>
      <primitive object={scene} />
    </group>
  );
}

export default function HoodieViewer3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3], fov: 40 }}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      {/* Dark neutral background so black hoodie is visible */}
      <color attach="background" args={["#0a0a0a"]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />

      <Suspense fallback={null}>
        <HoodieModel />
      </Suspense>
    </Canvas>
  );
}

// Preload model
useGLTF.preload("/grjr-hoodie.glb");
