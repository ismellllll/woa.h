import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// 🔹 Adjust this path if needed:
// - If HoodieViewer3D.tsx is in src/ and model is in src/assets/grjr-hoodie.glb → "./assets/grjr-hoodie.glb"
// - If HoodieViewer3D.tsx is in src/ui/ and model is in src/assets/grjr-hoodie.glb → "../assets/grjr-hoodie.glb"
import hoodieModelUrl from "./assets/gjrj-hoodie.glb";

function HoodieModel() {
  const group = useRef<THREE.Group>(null!);

  // Use `any` to avoid TS union type noise from useGLTF
  const gltf: any = useGLTF(hoodieModelUrl);
  const scene = gltf.scene as THREE.Group;

  // Center model & enable shadows
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
    scene.position.sub(center); // move so center is at 0,0,0
  }, [scene]);

  // Slow auto-rotation
  useFrame((_state, delta) => {
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
      {/* Dark neutral background */}
      <color attach="background" args={["#050509"]} />

      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />

      {/* Subtle reflections */}
      <Environment preset="city" />

      <Suspense fallback={null}>
        <HoodieModel />
      </Suspense>

      {/* Mouse / touch controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}

// Preload model
useGLTF.preload(hoodieModelUrl as any);
