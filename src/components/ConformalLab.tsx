import React, { useState, useMemo, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { create, all } from 'mathjs';
import { motion } from 'motion/react';
import { MousePointer2, Move, RotateCw, Info, Zap } from 'lucide-react';

const math = create(all);

interface ConformalLabProps {
  functionStr: string;
}

const ConformalLab: React.FC<ConformalLabProps> = ({ functionStr }) => {
  // State for the intersection point and two directions
  const [z0, setZ0] = useState({ x: 0, y: 0 });
  const [theta1, setTheta1] = useState(0); // Angle in radians
  const [theta2, setTheta2] = useState(Math.PI / 2); // Angle in radians
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Math compilation
  const compiled = useMemo(() => {
    try {
      const node = math.parse(functionStr);
      const zSub = math.parse('(x + i * y)');
      const substituted = node.transform((n) => {
        if ((n as any).isSymbolNode && (n as any).name === 'z') return zSub;
        return n;
      });
      
      const f = substituted.compile();
      const ux = math.derivative(substituted, 'x').compile();
      const uy = math.derivative(substituted, 'y').compile();
      const vx = math.simplify(`im(${substituted.toString()})`).compile(); // This is a bit hacky
      
      // Better way to get partials:
      const dfdx = math.derivative(substituted, 'x');
      const dfdy = math.derivative(substituted, 'y');
      
      return {
        f,
        ux: math.simplify(`re(${dfdx.toString()})`).compile(),
        vx: math.simplify(`im(${dfdx.toString()})`).compile(),
        uy: math.simplify(`re(${dfdy.toString()})`).compile(),
        vy: math.simplify(`im(${dfdy.toString()})`).compile(),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [functionStr]);

  // Animation loop
  useEffect(() => {
    let frame: number;
    if (isAnimating) {
      const start = performance.now();
      const duration = 2000;
      const animate = (time: number) => {
        const elapsed = time - start;
        const p = Math.min(elapsed / duration, 1);
        setProgress(p);
        if (p < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      frame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frame);
  }, [isAnimating]);

  const calculateAngle = (v1: { x: number, y: number }, v2: { x: number, y: number }) => {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const cos = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
  };

  const data = useMemo(() => {
    if (!compiled) return null;

    const scope0 = { x: z0.x, y: z0.y, i: math.complex(0, 1) };
    
    // Jacobian at z0
    let J = [[1, 0], [0, 1]];
    try {
      J = [
        [compiled.ux.evaluate(scope0), compiled.uy.evaluate(scope0)],
        [compiled.vx.evaluate(scope0), compiled.vy.evaluate(scope0)]
      ];
    } catch (e) {
      console.error("Jacobian evaluation failed", e);
    }

    // Vectors in Z-plane
    const v1z = { x: Math.cos(theta1), y: Math.sin(theta1) };
    const v2z = { x: Math.cos(theta2), y: Math.sin(theta2) };
    const angleZ = calculateAngle(v1z, v2z);

    // Transformed vectors in W-plane
    const v1w = {
      x: J[0][0] * v1z.x + J[0][1] * v1z.y,
      y: J[1][0] * v1z.x + J[1][1] * v1z.y
    };
    const v2w = {
      x: J[0][0] * v2z.x + J[0][1] * v2z.y,
      y: J[1][0] * v2z.x + J[1][1] * v2z.y
    };
    const angleW = calculateAngle(v1w, v2w);

    // Generate curve points for animation
    const numPoints = 50;
    const length = 1.5;
    
    const generateCurve = (angle: number, t: number) => {
      const pointsX: number[] = [];
      const pointsY: number[] = [];
      for (let i = 0; i <= numPoints; i++) {
        const s = (i / numPoints) * length;
        const x = z0.x + s * Math.cos(angle);
        const y = z0.y + s * Math.sin(angle);
        
        const scope = { x, y, i: math.complex(0, 1) };
        try {
          const val = compiled.f.evaluate(scope);
          const re = val.re ?? val;
          const im = val.im ?? 0;
          
          // Interpolate
          pointsX.push((1 - t) * x + t * re);
          pointsY.push((1 - t) * y + t * im);
        } catch {
          pointsX.push(x);
          pointsY.push(y);
        }
      }
      return { x: pointsX, y: pointsY };
    };

    const curve1 = generateCurve(theta1, progress);
    const curve2 = generateCurve(theta2, progress);

    // Arc for angle visualization
    const generateArc = (startAngle: number, endAngle: number, radius: number, center: { x: number, y: number }) => {
      const arcX: number[] = [];
      const arcY: number[] = [];
      const steps = 20;
      const sA = Math.min(startAngle, endAngle);
      const eA = Math.max(startAngle, endAngle);
      for (let i = 0; i <= steps; i++) {
        const a = sA + (i / steps) * (eA - sA);
        arcX.push(center.x + radius * Math.cos(a));
        arcY.push(center.y + radius * Math.sin(a));
      }
      return { x: arcX, y: arcY };
    };

    // For W-plane arc, we need the transformed angles
    const phi1 = Math.atan2(v1w.y, v1w.x);
    const phi2 = Math.atan2(v2w.y, v2w.x);
    const w0Val = compiled.f.evaluate(scope0);
    const w0 = { x: w0Val.re ?? w0Val, y: w0Val.im ?? 0 };

    const arcZ = generateArc(theta1, theta2, 0.3, z0);
    const arcW = generateArc(phi1, phi2, 0.3 * Math.sqrt(v1w.x**2 + v1w.y**2), w0);

    return {
      angleZ,
      angleW,
      curve1,
      curve2,
      arcZ,
      arcW,
      z0,
      w0
    };
  }, [compiled, z0, theta1, theta2, progress]);

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Conformal Lab</h2>
          <p className="text-2xl font-black text-slate-800">Angle Preservation Explorer</p>
          <p className="text-slate-500 text-sm max-w-md">
            Drag the intersection point or rotate the lines to see how angles are preserved under analytic mappings.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase">Intersection Z₀</span>
            <div className="flex gap-2">
              <input 
                type="number" step="0.1" value={z0.x} 
                onChange={e => setZ0(p => ({ ...p, x: parseFloat(e.target.value) }))}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
              <input 
                type="number" step="0.1" value={z0.y} 
                onChange={e => setZ0(p => ({ ...p, y: parseFloat(e.target.value) }))}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase">Rotation</span>
            <div className="flex gap-2">
              <input 
                type="range" min="0" max={Math.PI * 2} step="0.1" value={theta1} 
                onChange={e => setTheta1(parseFloat(e.target.value))}
                className="w-24"
              />
              <input 
                type="range" min="0" max={Math.PI * 2} step="0.1" value={theta2} 
                onChange={e => setTheta2(parseFloat(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          <button 
            onClick={() => { setProgress(0); setIsAnimating(true); }}
            disabled={isAnimating}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isAnimating ? 'Transforming...' : 'Animate Mapping'}
          </button>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Z-Plane */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <MousePointer2 className="w-3 h-3" /> Z-Plane (Domain)
            </div>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">
              Angle: {data.angleZ.toFixed(2)}°
            </div>
          </div>
          
          <Plot
            data={[
              {
                x: data.curve1.x, y: data.curve1.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#4F46E5', width: 3 },
                name: 'Curve 1'
              },
              {
                x: data.curve2.x, y: data.curve2.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#10B981', width: 3 },
                name: 'Curve 2'
              },
              {
                x: data.arcZ.x, y: data.arcZ.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#F59E0B', width: 2, dash: 'dot' },
                fill: 'toself', fillcolor: 'rgba(245, 158, 11, 0.1)',
                name: 'Angle Arc'
              },
              {
                x: [data.z0.x], y: [data.z0.y],
                type: 'scatter', mode: 'markers',
                marker: { color: '#1E293B', size: 10, line: { color: 'white', width: 2 } },
                name: 'Z0'
              }
            ]}
            layout={{
              autosize: true, margin: { l: 40, r: 40, b: 40, t: 40 },
              xaxis: { range: [-3, 3], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
              yaxis: { range: [-3, 3], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            className="w-full h-[400px]"
          />
        </div>

        {/* W-Plane */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <RotateCw className="w-3 h-3" /> W-Plane (Range)
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                Transformed Angle: {data.angleW.toFixed(2)}°
              </div>
            </div>
          </div>

          <Plot
            data={[
              {
                x: data.curve1.x, y: data.curve1.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#4F46E5', width: 3 },
                name: 'Curve 1'
              },
              {
                x: data.curve2.x, y: data.curve2.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#10B981', width: 3 },
                name: 'Curve 2'
              },
              {
                x: data.arcW.x, y: data.arcW.y,
                type: 'scatter', mode: 'lines',
                line: { color: '#F59E0B', width: 2, dash: 'dot' },
                fill: 'toself', fillcolor: 'rgba(245, 158, 11, 0.1)',
                name: 'Angle Arc'
              },
              {
                x: [data.w0.x], y: [data.w0.y],
                type: 'scatter', mode: 'markers',
                marker: { color: '#1E293B', size: 10, line: { color: 'white', width: 2 } },
                name: 'W0'
              }
            ]}
            layout={{
              autosize: true, margin: { l: 40, r: 40, b: 40, t: 40 },
              xaxis: { range: [-4, 4], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
              yaxis: { range: [-4, 4], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            className="w-full h-[400px]"
          />
        </div>
      </div>

      {/* Analysis Card */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">Conformality Verdict</h3>
            <p className="text-slate-400 text-sm">Mathematical verification of angle preservation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Initial Angle (α)</p>
            <p className="text-3xl font-black text-indigo-400">{data.angleZ.toFixed(2)}°</p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Angle (β)</p>
            <p className="text-3xl font-black text-emerald-400">{data.angleW.toFixed(2)}°</p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Deviation</p>
            <p className="text-3xl font-black text-rose-400">
              {Math.abs(data.angleZ - data.angleW).toFixed(4)}°
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-indigo-600 rounded-3xl flex items-center gap-6">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Info className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-indigo-50 leading-relaxed">
            {Math.abs(data.angleZ - data.angleW) < 0.1 
              ? "The mapping is conformal at this point. Angles are preserved, indicating the function is analytic and its derivative is non-zero here."
              : "The mapping is NOT conformal. Angles are distorted, which typically happens if the function is non-analytic or if the derivative is zero at this point."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConformalLab;
