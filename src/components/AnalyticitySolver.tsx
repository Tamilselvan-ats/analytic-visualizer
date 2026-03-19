import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Layers, 
  Zap, 
  Settings2, 
  ChevronDown, 
  ChevronUp,
  Grid3X3,
  Activity,
  Box
} from 'lucide-react';
import { analyzeAnalyticity, evaluateFunction } from '../services/mathEngine';
import Complex3DVisualizer from './Complex3DVisualizer';

interface DomainConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  step: number;
}

const AnalyticitySolver: React.FC<{ initialFunction?: string }> = ({ initialFunction = 'z^2' }) => {
  const [mode, setMode] = useState<'function' | 'components'>('function');
  const [fInput, setFInput] = useState(initialFunction);
  const [uInput, setUInput] = useState('x^2 - y^2');
  const [vInput, setVInput] = useState('2xy');
  
  const [domain, setDomain] = useState<DomainConfig>({
    minX: -2,
    maxX: 2,
    minY: -2,
    maxY: 2,
    step: 0.5
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const result = useMemo(() => {
    if (mode === 'function') {
      return analyzeAnalyticity(fInput);
    } else {
      return analyzeAnalyticity(`(${uInput}) + i*(${vInput})`);
    }
  }, [mode, fInput, uInput, vInput]);

  // Grid Generation for Visualization
  const gridData = useMemo(() => {
    if (result.error) return null;
    
    // Safety check: prevent excessive computation
    const xRange = domain.maxX - domain.minX;
    const yRange = domain.maxY - domain.minY;
    const safeStep = Math.max(domain.step, 0.05); // Enforce minimum step size
    
    if (xRange / safeStep > 100 || yRange / safeStep > 100) {
      return null; // Too many lines, skip rendering to prevent crash
    }

    const lines: { type: 'h' | 'v', points: { x: number, y: number, u: number, v: number }[] }[] = [];
    
    // Vertical lines (constant x)
    for (let x = domain.minX; x <= domain.maxX; x += safeStep) {
      const points = [];
      for (let y = domain.minY; y <= domain.maxY; y += 0.1) {
        const u = evaluateFunction(result.u, x, y);
        const v = evaluateFunction(result.v, x, y);
        points.push({ x, y, u, v });
      }
      lines.push({ type: 'v', points });
    }
    
    // Horizontal lines (constant y)
    for (let y = domain.minY; y <= domain.maxY; y += safeStep) {
      const points = [];
      for (let x = domain.minX; x <= domain.maxX; x += 0.1) {
        const u = evaluateFunction(result.u, x, y);
        const v = evaluateFunction(result.v, x, y);
        points.push({ x, y, u, v });
      }
      lines.push({ type: 'h', points });
    }
    
    return lines;
  }, [result, domain]);

  const renderGrid = (plane: 'z' | 'w') => {
    if (!gridData) return null;
    
    const width = 300;
    const height = 300;
    const padding = 20;
    
    // Scale functions for z-plane
    const scaleX = (val: number) => padding + ((val - domain.minX) / (domain.maxX - domain.minX)) * (width - 2 * padding);
    const scaleY = (val: number) => height - (padding + ((val - domain.minY) / (domain.maxY - domain.minY)) * (height - 2 * padding));
    
    // For w-plane, we need dynamic scaling based on the range of u and v
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    if (plane === 'w') {
      gridData.forEach(line => {
        line.points.forEach(p => {
          if (p.u < minU) minU = p.u;
          if (p.u > maxU) maxU = p.u;
          if (p.v < minV) minV = p.v;
          if (p.v > maxV) maxV = p.v;
        });
      });
      // Add some padding to the range
      const uRange = maxU - minU || 1;
      const vRange = maxV - minV || 1;
      minU -= uRange * 0.1;
      maxU += uRange * 0.1;
      minV -= vRange * 0.1;
      maxV += vRange * 0.1;
    }

    const scaleU = (val: number) => padding + ((val - minU) / (maxU - minU)) * (width - 2 * padding);
    const scaleV = (val: number) => height - (padding + ((val - minV) / (maxV - minV)) * (height - 2 * padding));

    return (
      <div className="relative">
        <svg width={width} height={height} className="bg-slate-900/50 rounded-2xl border border-white/10 shadow-inner">
          {/* Grid Lines */}
          {gridData.map((line, i) => {
            const pathData = line.points.map((p, j) => {
              const px = plane === 'z' ? scaleX(p.x) : scaleU(p.u);
              const py = plane === 'z' ? scaleY(p.y) : scaleV(p.v);
              return `${j === 0 ? 'M' : 'L'} ${px} ${py}`;
            }).join(' ');
            
            return (
              <path 
                key={i} 
                d={pathData} 
                fill="none" 
                stroke={line.type === 'v' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(16, 185, 129, 0.6)'} 
                strokeWidth="1.5"
                className="transition-all duration-700 ease-in-out"
              />
            );
          })}
          
          {/* Origin Marker */}
          <circle 
            cx={plane === 'z' ? scaleX(0) : scaleU(evaluateFunction(result.u, 0, 0))} 
            cy={plane === 'z' ? scaleY(0) : scaleV(evaluateFunction(result.v, 0, 0))} 
            r="4" 
            fill="#f59e0b" 
            className="animate-pulse"
          />
        </svg>
        {!gridData && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">
              Grid too dense to render safely.<br/>Increase step size.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header & Input */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Calculator className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Analyticity Solver</h2>
              <p className="text-sm text-slate-400 font-medium tracking-wide">Complex Mapping Engine v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setMode('function')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'function' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              f(z)
            </button>
            <button 
              onClick={() => setMode('components')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'components' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              u + iv
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {mode === 'function' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Complex Function f(z)</label>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Symbolic Input</span>
                </div>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-serif italic text-3xl group-focus-within:text-indigo-500 transition-colors">f(z) =</div>
                  <input 
                    type="text" 
                    value={fInput}
                    onChange={(e) => setFInput(e.target.value)}
                    className="w-full pl-24 pr-8 py-7 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-serif text-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                    placeholder="e.g., z^2, exp(z), sin(z)"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Real Part u(x, y)</label>
                  <input 
                    type="text" 
                    value={uInput}
                    onChange={(e) => setUInput(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-serif text-xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Imaginary Part v(x, y)</label>
                  <input 
                    type="text" 
                    value={vInput}
                    onChange={(e) => setVInput(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-serif text-xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-[2rem] border border-slate-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-bold text-slate-600">Domain Settings</span>
              </div>
              {showSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 mt-4 bg-slate-50 rounded-[2rem] border border-slate-200 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Min X</label>
                      <input type="number" value={domain.minX} onChange={e => setDomain({...domain, minX: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Max X</label>
                      <input type="number" value={domain.maxX} onChange={e => setDomain({...domain, maxX: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Min Y</label>
                      <input type="number" value={domain.minY} onChange={e => setDomain({...domain, minY: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Max Y</label>
                      <input type="number" value={domain.maxY} onChange={e => setDomain({...domain, maxY: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Grid Step Size (Min 0.05)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0.05"
                        value={domain.step} 
                        onChange={e => setDomain({...domain, step: Math.max(Number(e.target.value), 0.05)})} 
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Visual Mapping */}
        <div className="xl:col-span-5 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -ml-32 -mb-32" />
          
          <div className="relative z-10 space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Grid3X3 className="w-6 h-6 text-indigo-400" />
                Conformal Mapping
              </h3>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === '2d' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  2D
                </button>
                <button 
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === '3d' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  3D
                </button>
              </div>
            </div>

            <div className="space-y-12">
              {viewMode === '2d' ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">z-Plane (Domain)</span>
                      <span className="text-[10px] text-slate-500 italic">x + iy</span>
                    </div>
                    <div className="flex justify-center">
                      {renderGrid('z')}
                    </div>
                  </div>

                  <div className="flex justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <ArrowRight className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">ω-Plane (Range)</span>
                      <span className="text-[10px] text-slate-500 italic">u + iv</span>
                    </div>
                    <div className="flex justify-center">
                      {renderGrid('w')}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">3D Surface Plot</span>
                    <span className="text-[10px] text-slate-500 italic">|f(z)| as height</span>
                  </div>
                  <Complex3DVisualizer 
                    uExpr={result.u} 
                    vExpr={result.v} 
                    minX={domain.minX} 
                    maxX={domain.maxX} 
                    minY={domain.minY} 
                    maxY={domain.maxY} 
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observation</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {result.isAnalytic 
                  ? "The mapping is conformal. Grid lines intersect at 90°, preserving local angles and shapes."
                  : "The mapping is non-conformal. Grid lines are distorted, and angles are not preserved."}
              </p>
            </div>
          </div>
        </div>

        {/* Math & Steps */}
        <div className="xl:col-span-7 space-y-8">
          {/* Result Card */}
          <div className={`p-10 rounded-[3rem] border-2 shadow-2xl transition-all ${result.isAnalytic ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100' : 'bg-rose-50 border-rose-100 shadow-rose-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {result.isAnalytic ? (
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h4 className="text-2xl font-black text-slate-800">
                    {result.isAnalytic ? 'Analytic Function' : 'Non-Analytic Function'}
                  </h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cauchy-Riemann Status</p>
                </div>
              </div>
            </div>
            
            <p className="text-slate-600 leading-relaxed font-medium">
              {result.isAnalytic 
                ? "This function satisfies the Cauchy-Riemann equations throughout its domain. It is differentiable at every point and exhibits conformal mapping properties."
                : "This function violates the Cauchy-Riemann equations. It is not complex-differentiable, meaning its real and imaginary parts do not vary together in a way that preserves complex structure."}
            </p>
          </div>

          {/* C-R Details */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
              <Zap className="w-6 h-6 text-amber-500" />
              Equation Verification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition 1</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.ux === result.vy ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {result.ux === result.vy ? 'Satisfied' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">uₓ</p>
                    <p className="font-serif text-lg font-bold text-indigo-600">{result.ux}</p>
                  </div>
                  <div className="text-2xl font-serif text-slate-300">=</div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">vᵧ</p>
                    <p className="font-serif text-lg font-bold text-emerald-600">{result.vy}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition 2</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.isAnalytic ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {result.isAnalytic ? 'Satisfied' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">uᵧ</p>
                    <p className="font-serif text-lg font-bold text-indigo-600">{result.uy}</p>
                  </div>
                  <div className="text-2xl font-serif text-slate-300">=</div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">-vₓ</p>
                    <p className="font-serif text-lg font-bold text-rose-600">{result.vx.startsWith('-') ? result.vx.substring(1) : `-${result.vx}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Explanation */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200">
            <button 
              onClick={() => setShowSteps(!showSteps)}
              className="w-full flex items-center justify-between mb-8 group"
            >
              <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
                <Layers className="w-6 h-6 text-indigo-50" />
                Step-by-Step Derivation
              </h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                {showSteps ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>

            <AnimatePresence>
              {showSteps && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="relative pl-10 pb-8 last:pb-0">
                        {idx !== result.steps.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-100" />
                        )}
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white z-10">
                          {idx + 1}
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-sm font-black text-slate-800 uppercase tracking-wider">{step.step}</h5>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-serif text-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {step.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticitySolver;
