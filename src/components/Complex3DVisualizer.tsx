import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Center, Text } from '@react-three/drei';
import * as THREE from 'three';
import { evaluateFunction } from '../services/mathEngine';

interface Complex3DVisualizerProps {
  uExpr: string;
  vExpr: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const Surface: React.FC<Complex3DVisualizerProps> = ({ uExpr, vExpr, minX, maxX, minY, maxY }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const resolution = 50;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, resolution - 1, resolution - 1);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = minX + (i / (resolution - 1)) * (maxX - minX);
        const y = minY + (j / (resolution - 1)) * (maxY - minY);
        
        const u = evaluateFunction(uExpr, x, y);
        const v = evaluateFunction(vExpr, x, y);
        
        const mag = Math.sqrt(u * u + v * v);
        const phase = Math.atan2(v, u);
        
        const index = (j * resolution + i) * 3;
        
        // Scale height for visualization
        positions[index + 2] = Math.min(Math.max(mag, 0), 5); // Z is height

        // Color based on phase (HSL to RGB)
        const color = new THREE.Color();
        color.setHSL((phase + Math.PI) / (2 * Math.PI), 0.8, 0.5);
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
      }
    }
    
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    return geo;
  }, [uExpr, vExpr, minX, maxX, minY, maxY]);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} wireframe={false} flatShading={false} />
    </mesh>
  );
};

const Complex3DVisualizer: React.FC<Complex3DVisualizerProps> = (props) => {
  return (
    <div className="w-full h-[400px] bg-slate-950 rounded-3xl border border-white/10 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Height: |f(z)|</p>
        </div>
        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Color: Arg(f(z))</p>
        </div>
      </div>
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={40} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={20} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Center top>
          <Surface {...props} />
        </Center>
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          fadeStrength={5} 
          cellSize={1} 
          sectionSize={5} 
          sectionColor="#4f46e5" 
          cellColor="#1e293b" 
        />
        
        <axesHelper args={[5]} />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 font-mono italic">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Complex3DVisualizer;
