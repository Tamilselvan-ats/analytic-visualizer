import React, { useState, useMemo, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { create, all } from 'mathjs';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Move, RotateCw, Info, Zap, Calculator, Target, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const math = create(all);

interface ConformalLabProps {
  functionStr: string;
}

const ConformalLab: React.FC<ConformalLabProps> = ({ functionStr }) => {
  // State for the intersection point and two directions
  const [z0, setZ0] = useState({ x: 0, y: 0 });
  const [theta1, setTheta1] = useState(0); 
  const [theta2, setTheta2] = useState(Math.PI / 2); 
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTool, setActiveTool] = useState<'explorer' | 'bilinear' | 'fixed-points'>('explorer');

  // Bilinear Solver State
  const [zPoints, setZPoints] = useState(['1', 'i', '-1']);
  const [wPoints, setWPoints] = useState(['i', '0', '-i']);
  const [bilinearResult, setBilinearResult] = useState<string | null>(null);

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
      const dfdx = math.derivative(substituted, 'x');
      const dfdy = math.derivative(substituted, 'y');
      
      return {
        f,
        ux: math.simplify(`re(${dfdx.toString()})`).compile(),
        vx: math.simplify(`im(${dfdx.toString()})`).compile(),
        uy: math.simplify(`re(${dfdy.toString()})`).compile(),
        vy: math.simplify(`im(${dfdy.toString()})`).compile(),
        raw: node
      };
    } catch (e) {
      return null;
    }
  }, [functionStr]);

  // Fixed Points Calculation
  const fixedPoints = useMemo(() => {
    if (!compiled) return [];
    try {
      // For SRM syllabus, these are usually quadratic or linear
      // We'll provide a symbolic representation of the equation to solve
      return [`Solve: ${functionStr} = z`];
    } catch {
      return [];
    }
  }, [functionStr, compiled]);

  const solveBilinear = () => {
    try {
      // Cross-ratio formula: (w-w1)(w2-w3)/((w-w3)(w2-w1)) = (z-z1)(z2-z3)/((z-z3)(z2-z1))
      // For SRM syllabus, we'll show the step-by-step setup
      setBilinearResult(`Setup: (w - ${wPoints[0]})(${wPoints[1]} - ${wPoints[2]}) / ((w - ${wPoints[2]})(${wPoints[1]} - ${wPoints[0]})) = (z - ${zPoints[0]})(${zPoints[1]} - ${zPoints[2]}) / ((z - ${zPoints[2]})(${zPoints[1]} - ${zPoints[0]}))`);
    } catch (e) {
      setBilinearResult("Error in points format. Use 1, i, -1, etc.");
    }
  };

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
    
    let J = [[1, 0], [0, 1]];
    try {
      J = [
        [compiled.ux.evaluate(scope0), compiled.uy.evaluate(scope0)],
        [compiled.vx.evaluate(scope0), compiled.vy.evaluate(scope0)]
      ];
    } catch (e) {}

    const v1z = { x: Math.cos(theta1), y: Math.sin(theta1) };
    const v2z = { x: Math.cos(theta2), y: Math.sin(theta2) };
    const angleZ = calculateAngle(v1z, v2z);

    const v1w = {
      x: J[0][0] * v1z.x + J[0][1] * v1z.y,
      y: J[1][0] * v1z.x + J[1][1] * v1z.y
    };
    const v2w = {
      x: J[0][0] * v2z.x + J[0][1] * v2z.y,
      y: J[1][0] * v2z.x + J[1][1] * v2z.y
    };
    const angleW = calculateAngle(v1w, v2w);

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
      {/* Syllabus Header */}
      <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xs font-black text-indigo-200 uppercase tracking-widest">SRM 21MAB102T</h2>
            <p className="text-2xl font-black">Conformal Mapping Lab</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['explorer', 'bilinear', 'fixed-points'].map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTool === tool ? "bg-white text-indigo-600" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {tool.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTool === 'explorer' && (
          <motion.div
            key="explorer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Explorer Controls */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Interactive Explorer</h2>
                <p className="text-xl font-black text-slate-800">Angle Preservation</p>
                <p className="text-slate-500 text-sm max-w-md">
                  Verify the fundamental property of analytic functions: they preserve angles between curves.
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
                <button 
                  onClick={() => { setProgress(0); setIsAnimating(true); }}
                  disabled={isAnimating}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isAnimating ? 'Transforming...' : 'Animate Mapping'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    { x: data.curve1.x, y: data.curve1.y, type: 'scatter', mode: 'lines', line: { color: '#4F46E5', width: 3 } },
                    { x: data.curve2.x, y: data.curve2.y, type: 'scatter', mode: 'lines', line: { color: '#10B981', width: 3 } },
                    { x: data.arcZ.x, y: data.arcZ.y, type: 'scatter', mode: 'lines', line: { color: '#F59E0B', width: 2, dash: 'dot' }, fill: 'toself', fillcolor: 'rgba(245, 158, 11, 0.1)' },
                    { x: [data.z0.x], y: [data.z0.y], type: 'scatter', mode: 'markers', marker: { color: '#1E293B', size: 10, line: { color: 'white', width: 2 } } }
                  ]}
                  layout={{ autosize: true, margin: { l: 40, r: 40, b: 40, t: 40 }, xaxis: { range: [-3, 3], gridcolor: '#f1f5f9' }, yaxis: { range: [-3, 3], gridcolor: '#f1f5f9' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false }}
                  config={{ displayModeBar: false, responsive: true }}
                  className="w-full h-[400px]"
                />
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <RotateCw className="w-3 h-3" /> W-Plane (Range)
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                    Transformed Angle: {data.angleW.toFixed(2)}°
                  </div>
                </div>
                <Plot
                  data={[
                    { x: data.curve1.x, y: data.curve1.y, type: 'scatter', mode: 'lines', line: { color: '#4F46E5', width: 3 } },
                    { x: data.curve2.x, y: data.curve2.y, type: 'scatter', mode: 'lines', line: { color: '#10B981', width: 3 } },
                    { x: data.arcW.x, y: data.arcW.y, type: 'scatter', mode: 'lines', line: { color: '#F59E0B', width: 2, dash: 'dot' }, fill: 'toself', fillcolor: 'rgba(245, 158, 11, 0.1)' },
                    { x: [data.w0.x], y: [data.w0.y], type: 'scatter', mode: 'markers', marker: { color: '#1E293B', size: 10, line: { color: 'white', width: 2 } } }
                  ]}
                  layout={{ autosize: true, margin: { l: 40, r: 40, b: 40, t: 40 }, xaxis: { range: [-4, 4], gridcolor: '#f1f5f9' }, yaxis: { range: [-4, 4], gridcolor: '#f1f5f9' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false }}
                  config={{ displayModeBar: false, responsive: true }}
                  className="w-full h-[400px]"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTool === 'bilinear' && (
          <motion.div
            key="bilinear"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Bilinear Transformation Solver</h3>
                <p className="text-sm text-slate-500 italic">Find w = (az+b)/(cz+d) mapping (z₁, z₂, z₃) to (w₁, w₂, w₃)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Z-Plane Points</h4>
                {zPoints.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">z{i+1}</span>
                    <input 
                      value={p} 
                      onChange={e => { const n = [...zPoints]; n[i] = e.target.value; setZPoints(n); }}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">W-Plane Points</h4>
                {wPoints.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">w{i+1}</span>
                    <input 
                      value={p} 
                      onChange={e => { const n = [...wPoints]; n[i] = e.target.value; setWPoints(n); }}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={solveBilinear}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Solve Transformation
            </button>

            {bilinearResult && (
              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Resulting Mapping</p>
                <p className="text-sm font-serif italic text-indigo-900 break-all">{bilinearResult}</p>
                <p className="mt-4 text-[10px] text-indigo-400 leading-relaxed">
                  Formula used: Cross-ratio invariance <br/>
                  (w-w₁)(w₂-w₃)/(w-w₃)(w₂-w₁) = (z-z₁)(z₂-z₃)/(z-z₃)(z₂-z₁)
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTool === 'fixed-points' && (
          <motion.div
            key="fixed-points"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Fixed & Critical Points</h3>
                <p className="text-sm text-slate-500 italic">Analyze invariant points and points where conformality fails</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Fixed Points (w = z)</h4>
                <div className="space-y-2">
                  {fixedPoints.map((p, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-sm">
                      {p}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] text-slate-400">Points that map to themselves under the transformation.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Critical Points (f'(z) = 0)</h4>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-sm">
                  Solve f'(z) = 0
                </div>
                <p className="mt-4 text-[10px] text-slate-400">Points where the mapping is NOT conformal (angles are not preserved).</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syllabus Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
          <div className="flex items-center gap-4 mb-6">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-black">Syllabus Insights</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standard Mappings</p>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Translation: w = z + c</li>
                <li>• Rotation/Magnification: w = cz</li>
                <li>• Inversion: w = 1/z</li>
                <li>• Squaring: w = z²</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Exam Topics</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Bilinear transformations map circles/lines to circles/lines. Fixed points are found by solving the quadratic equation resulting from w = z.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Practice Problems</h3>
          </div>
          <div className="space-y-4">
            {[
              { q: "Find fixed points of w = (3z-4)/(z-1)", a: "z = 2 (double root)" },
              { q: "Map z=1, i, -1 to w=i, 0, -i", a: "Use Bilinear Solver tab" },
              { q: "Critical points of w = z + 1/z", a: "z = ±1" },
              { q: "Invariant points of w = (z-1)/(z+1)", a: "z = ±i" }
            ].map((item, i) => (
              <div key={i} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                <p className="text-xs font-bold text-slate-700 mb-1">{item.q}</p>
                <p className="text-[10px] text-slate-400 font-mono group-hover:text-indigo-500 transition-colors">Ans: {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default ConformalLab;
