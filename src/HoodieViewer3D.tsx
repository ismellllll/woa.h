import React, { Suspense, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function HoodieModel() {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/grjr-hoodie.glb");

  // Center the model based on its bounding box
  useLayoutEffect(() => {
    scene.traverse((child) => {
      // give all meshes shadows
      // @ts-ignore
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Move model so its center is at (0, 0, 0)
    scene.position.x -= center.x;
    scene.position.y -= center.y;
    scene.position.z -= center.z;
  }, [scene]);

  // Auto-rotation
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={group} scale={1.8}>
      <primitive object={scene} />
      {/* GRJR badge removed */}
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
      {/* Neutral dark bg so black hoodie is visible */}
      <color attach="background" args={["#0a0a0a"]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#8ab4ff" />

      <Environment preset="city" />

      <Suspense fallback={null}>
        <HoodieModel />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}

useGLTF.preload("/grjr-hoodie.glb");
