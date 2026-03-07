import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { create, all } from 'mathjs';
import { motion } from 'motion/react';

const math = create(all);

interface CRVisualizerProps {
  functionStr: string;
}

const TangentVectors: React.FC<{ functionStr: string, t: number }> = ({ functionStr, t }) => {
  const center = { x: 0.5, y: 0.5 };
  
  const derivatives = useMemo(() => {
    try {
      const node = math.parse(functionStr);
      const zSub = math.parse('(x + i * y)');
      const substituted = node.transform((n) => {
        if ((n as any).isSymbolNode && (n as any).name === 'z') return zSub;
        return n;
      });
      
      const u = math.simplify(math.parse(`re(${substituted.toString()})`));
      const v = math.simplify(math.parse(`im(${substituted.toString()})`));
      
      const du_dx = math.derivative(u, 'x').compile();
      const du_dy = math.derivative(u, 'y').compile();
      const dv_dx = math.derivative(v, 'x').compile();
      const dv_dy = math.derivative(v, 'y').compile();
      
      const scope = { x: center.x, y: center.y, i: math.complex(0, 1) };
      
      return {
        ux: du_dx.evaluate(scope),
        uy: du_dy.evaluate(scope),
        vx: dv_dx.evaluate(scope),
        vy: dv_dy.evaluate(scope)
      };
    } catch (e) {
      return { ux: 1, uy: 0, vx: 0, vy: 1 };
    }
  }, [functionStr]);

  // Basis vectors in Z-plane
  const v1_z = new THREE.Vector3(1, 0, 0);
  const v2_z = new THREE.Vector3(0, 1, 0);

  // Transformed vectors in W-plane (columns of Jacobian)
  const v1_w = new THREE.Vector3(derivatives.ux, derivatives.vx, 0).multiplyScalar(0.5);
  const v2_w = new THREE.Vector3(derivatives.uy, derivatives.vy, 0).multiplyScalar(0.5);

  // Interpolated vectors
  const cur_v1 = new THREE.Vector3().lerpVectors(v1_z, v1_w, t);
  const cur_v2 = new THREE.Vector3().lerpVectors(v2_z, v2_w, t);

  return (
    <group position={[0, 0, 0.01]}>
      {/* Vector 1: X-direction derivative */}
      <Line points={[[0, 0, 0], [cur_v1.x, cur_v1.y, 0]]} color="#f43f5e" lineWidth={5} />
      <Html position={[cur_v1.x, cur_v1.y, 0]}>
        <div className="bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] font-black whitespace-nowrap shadow-lg">
          ∂f/∂x = ({derivatives.ux.toFixed(2)}, {derivatives.vx.toFixed(2)})
        </div>
      </Html>

      {/* Vector 2: Y-direction derivative */}
      <Line points={[[0, 0, 0], [cur_v2.x, cur_v2.y, 0]]} color="#0ea5e9" lineWidth={5} />
      <Html position={[cur_v2.x, cur_v2.y, 0]}>
        <div className="bg-sky-500 text-white px-2 py-0.5 rounded text-[8px] font-black whitespace-nowrap shadow-lg">
          ∂f/∂y = ({derivatives.uy.toFixed(2)}, {derivatives.vy.toFixed(2)})
        </div>
      </Html>
    </group>
  );
};

const SquareMapping: React.FC<{ functionStr: string }> = ({ functionStr }) => {
  const meshRef = useRef<THREE.Points>(null);
  const [t, setT] = useState(0);

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const size = 20;
    const step = 1 / size;
    const offset = -0.5;

    for (let i = 0; i <= size; i++) {
      for (let j = 0; j <= size; j++) {
        pts.push(new THREE.Vector3(offset + i * step, offset + j * step, 0));
      }
    }
    return pts;
  }, []);

  const transformedPoints = useMemo(() => {
    try {
      const node = math.parse(functionStr);
      const zSub = math.parse('(x + i * y)');
      const substituted = node.transform((n) => {
        if ((n as any).isSymbolNode && (n as any).name === 'z') return zSub;
        return n;
      });
      const code = substituted.compile();

      return points.map(p => {
        const scope = { x: p.x, y: p.y, i: math.complex(0, 1) };
        const val = code.evaluate(scope);
        const re = val.re ?? val;
        const im = val.im ?? 0;
        return new THREE.Vector3(re, im, 0);
      });
    } catch (e) {
      return points;
    }
  }, [functionStr, points]);

  useFrame(({ clock }) => {
    const val = (Math.sin(clock.getElapsedTime() * 0.8) + 1) / 2;
    setT(val);
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < points.length; i++) {
        positions[i * 3] = THREE.MathUtils.lerp(points[i].x, transformedPoints[i].x, val);
        positions[i * 3 + 1] = THREE.MathUtils.lerp(points[i].y, transformedPoints[i].y, val);
        positions[i * 3 + 2] = THREE.MathUtils.lerp(points[i].z, transformedPoints[i].z, val);
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.length * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#4f46e5" size={0.03} transparent opacity={0.6} />
      </points>
      
      <TangentVectors functionStr={functionStr} t={t} />
      
      <gridHelper args={[10, 10, 0x334155, 0x1e293b]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

const CRVisualizer: React.FC<CRVisualizerProps> = ({ functionStr }) => {
  return (
    <div className="w-full h-[600px] bg-slate-950 rounded-[3rem] overflow-hidden relative shadow-2xl border border-slate-800">
      <div className="absolute top-10 left-10 z-10 text-white max-w-md">
        <h3 className="text-2xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
          Cauchy-Riemann Geometry
        </h3>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          Watch how the basis vectors transform. In analytic functions, the red and blue vectors stay orthogonal and equal in length (conformal mapping).
        </p>
      </div>
      
      <div className="absolute bottom-10 left-10 z-10 flex gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">∂f/∂x</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl">
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">∂f/∂y</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <SquareMapping functionStr={functionStr} />
        <OrbitControls enablePan={true} makeDefault />
      </Canvas>
    </div>
  );
};

export default CRVisualizer;
