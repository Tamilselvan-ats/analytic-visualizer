import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ArrowRight, 
  Layers, 
  Zap, 
  Settings2, 
  ChevronDown, 
  ChevronUp,
  Grid3X3,
  Activity,
  Target,
  Sparkles,
  BookOpen,
  MousePointer2,
  RotateCw
} from 'lucide-react';
import { analyzeConformal, evaluateFunction } from '../services/mathEngine';
import Complex2DVisualizer from './Complex2DVisualizer';
import Complex3DVisualizer from './Complex3DVisualizer';
import TheorySection from './TheorySection';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DomainConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  step: number;
}

type MappingType = 'linear' | 'bilinear' | 'power' | 'exponential' | 'trigonometric' | 'inversion' | 'custom';
type DomainShape = 'grid' | 'circle' | 'square' | 'triangle';

interface Preset {
  name: string;
  type: MappingType;
  params: Record<string, string>;
  description: string;
}

const PRESETS: Preset[] = [
  { name: 'Translation (z + 1+i)', type: 'linear', params: { a: '1', b: '1 + i' }, description: 'Shifts the entire plane by 1 unit right and 1 unit up.' },
  { name: 'Magnification (2z)', type: 'linear', params: { a: '2', b: '0' }, description: 'Expands the plane by a factor of 2 from the origin.' },
  { name: 'Rotation (i*z)', type: 'linear', params: { a: 'i', b: '0' }, description: 'Rotates the plane by 90° counter-clockwise.' },
  { name: 'Inversion (1/z)', type: 'bilinear', params: { a: '0', b: '1', c: '1', d: '0' }, description: 'Maps the interior of the unit circle to the exterior and vice versa.' },
  { name: 'Cayley (HHP to Disk)', type: 'bilinear', params: { a: '1', b: '-i', c: '1', d: 'i' }, description: 'Maps the upper half-plane to the unit disk.' },
  { name: 'Disk to HHP', type: 'bilinear', params: { a: 'i', b: 'i', c: '-1', d: '1' }, description: 'Maps the unit disk back to the upper half-plane.' },
  { name: 'Power (z^2)', type: 'power', params: { n: '2' }, description: 'Doubles the argument and squares the modulus.' },
];

const ConformalLab: React.FC = () => {
  const [mappingType, setMappingType] = useState<MappingType>('linear');
  const [domainShape, setDomainShape] = useState<DomainShape>('grid');
  
  // Linear params
  const [linA, setLinA] = useState('1');
  const [linB, setLinB] = useState('0');

  // Bilinear params (Real and Imaginary)
  const [aRe, setARe] = useState(1);
  const [aIm, setAIm] = useState(0);
  const [bRe, setBRe] = useState(0);
  const [bIm, setBIm] = useState(0);
  const [cRe, setCRe] = useState(0);
  const [cIm, setCIm] = useState(0);
  const [dRe, setDRe] = useState(1);
  const [dIm, setDIm] = useState(0);
  
  // Power params
  const [n, setN] = useState('2');
  
  // Custom function
  const [customFunc, setCustomFunc] = useState('z^2');

  const [domain, setDomain] = useState<DomainConfig>({
    minX: -2,
    maxX: 2,
    minY: -2,
    maxY: 2,
    step: 0.5
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [showTheory, setShowTheory] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const currentFunction = useMemo(() => {
    const a = `${aRe} + ${aIm}i`;
    const b = `${bRe} + ${bIm}i`;
    const c = `${cRe} + ${cIm}i`;
    const d = `${dRe} + ${dIm}i`;

    switch (mappingType) {
      case 'linear':
        return `((${linA}) * z + (${linB}))`;
      case 'bilinear':
        return `((${a}) * z + (${b})) / ((${c}) * z + (${d}))`;
      case 'power':
        return `z^(${n})`;
      case 'exponential':
        return `exp(z)`;
      case 'trigonometric':
        return `sin(z)`;
      case 'inversion':
        return `1/z`;
      case 'custom':
        return customFunc;
      default:
        return 'z';
    }
  }, [mappingType, linA, linB, aRe, aIm, bRe, bIm, cRe, cIm, dRe, dIm, n, customFunc]);

  const applyPreset = (preset: Preset) => {
    setMappingType(preset.type);
    if (preset.type === 'linear') {
      setLinA(preset.params.a || '1');
      setLinB(preset.params.b || '0');
    } else if (preset.type === 'bilinear') {
      // Parse preset params if they are complex strings (simplified)
      // For now, just reset to defaults or handle specific ones
      if (preset.name.includes('HHP to Disk')) {
        setARe(1); setAIm(0);
        setBRe(0); setBIm(-1);
        setCRe(1); setCIm(0);
        setDRe(0); setDIm(1);
      } else {
        setARe(1); setAIm(0);
        setBRe(0); setBIm(0);
        setCRe(0); setCIm(0);
        setDRe(1); setDIm(0);
      }
    } else if (preset.type === 'power') {
      setN(preset.params.n || '2');
    }
  };

  const result = useMemo(() => {
    return analyzeConformal(currentFunction);
  }, [currentFunction]);

  const pole = useMemo(() => {
    if (mappingType !== 'bilinear') return null;
    // w = (az + b) / (cz + d) => pole at z = -d/c
    // c = cRe + cIm*i, d = dRe + dIm*i
    const denomSq = cRe * cRe + cIm * cIm;
    if (denomSq < 1e-9) return null; // No pole (linear case)
    
    // -d/c = -(dRe + dIm*i) * (cRe - cIm*i) / denomSq
    const re = -(dRe * cRe + dIm * cIm) / denomSq;
    const im = -(dIm * cRe - dRe * cIm) / denomSq;
    return { x: re, y: im };
  }, [mappingType, cRe, cIm, dRe, dIm]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {/* Header & Transformation Selector */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-3xl rounded-full -mr-48 -mt-48" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Target className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">Conformal Lab</h2>
              <p className="text-base text-slate-400 font-medium tracking-wide">Advanced Geometric Mapping Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTheory(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Theory & Solvers
            </button>
            <div className="flex flex-wrap gap-2 bg-slate-100/80 p-2 rounded-3xl border border-slate-200/60 backdrop-blur-sm">
              {(['linear', 'bilinear', 'power', 'exponential', 'trigonometric', 'inversion', 'custom'] as MappingType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMappingType(type)}
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-[11px] font-black tracking-widest transition-all uppercase",
                    mappingType === type ? "bg-white text-indigo-600 shadow-md scale-105" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Presets Section */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Standard Sums & Presets</h3>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="group relative px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-start"
              >
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">{preset.name}</span>
                <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {mappingType === 'linear' && (
                <motion.div 
                  key="linear-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {[
                    { label: 'A (Magnification/Rotation)', value: linA, setter: setLinA, placeholder: 'e.g., 2, i, 1+i' },
                    { label: 'B (Translation)', value: linB, setter: setLinB, placeholder: 'e.g., 1, 1-i' }
                  ].map((param) => (
                    <div key={param.label} className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{param.label}</label>
                      <input 
                        type="text" 
                        value={param.value} 
                        onChange={e => param.setter(e.target.value)} 
                        placeholder={param.placeholder}
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-serif text-xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" 
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {mappingType === 'bilinear' && (
                <motion.div 
                  key="bilinear-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: 'a', re: aRe, setRe: setARe, im: aIm, setIm: setAIm },
                      { label: 'b', re: bRe, setRe: setBRe, im: bIm, setIm: setBIm },
                      { label: 'c', re: cRe, setRe: setCRe, im: cIm, setIm: setCIm },
                      { label: 'd', re: dRe, setRe: setDRe, im: dIm, setIm: setDIm }
                    ].map((param) => (
                      <div key={param.label} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Parameter {param.label}</label>
                          <span className="text-xs font-mono text-indigo-600 font-bold">
                            {param.re.toFixed(2)} {param.im >= 0 ? '+' : '-'} {Math.abs(param.im).toFixed(2)}i
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold">
                              <span>Real</span>
                              <span>{param.re}</span>
                            </div>
                            <input 
                              type="range" min="-2" max="2" step="0.1" 
                              value={param.re} 
                              onChange={e => param.setRe(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold">
                              <span>Imaginary</span>
                              <span>{param.im}</span>
                            </div>
                            <input 
                              type="range" min="-2" max="2" step="0.1" 
                              value={param.im} 
                              onChange={e => param.setIm(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {mappingType === 'power' && (
                <motion.div 
                  key="power-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Exponent (n)</label>
                  <input 
                    type="number" 
                    value={n} 
                    onChange={e => setN(e.target.value)} 
                    className="w-full max-w-xs p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-serif text-xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" 
                  />
                </motion.div>
              )}

              {mappingType === 'custom' && (
                <motion.div 
                  key="custom-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Custom Function f(z)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={customFunc} 
                      onChange={e => setCustomFunc(e.target.value)} 
                      className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-serif text-xl focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm pr-16" 
                      placeholder="e.g., z^3 + 1" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-serif italic text-lg">f(z)</div>
                  </div>
                </motion.div>
              )}

              {['exponential', 'trigonometric', 'inversion'].includes(mappingType) && (
                <motion.div 
                  key="fixed-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8 bg-gradient-to-r from-indigo-50 to-white rounded-[2rem] border border-indigo-100 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Mapping</p>
                    <p className="text-2xl font-serif italic text-indigo-900">w = {currentFunction}</p>
                  </div>
                  <Sparkles className="w-8 h-8 text-indigo-200" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-[2rem] border border-slate-200 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Settings2 className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Domain & Shape</span>
              </div>
              {showSettings ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 mt-4 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-inner">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain Shape</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['grid', 'circle', 'square', 'triangle'] as DomainShape[]).map((shape) => (
                          <button
                            key={shape}
                            onClick={() => setDomainShape(shape)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all",
                              domainShape === shape ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-200"
                            )}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'Min X', value: domain.minX, key: 'minX' },
                        { label: 'Max X', value: domain.maxX, key: 'maxX' },
                        { label: 'Min Y', value: domain.minY, key: 'minY' },
                        { label: 'Max Y', value: domain.maxY, key: 'maxY' }
                      ].map((d) => (
                        <div key={d.key} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{d.label}</label>
                          <input 
                            type="number" 
                            value={d.value} 
                            onChange={e => setDomain({...domain, [d.key]: Number(e.target.value)})} 
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all" 
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grid Step Size (Min 0.05)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0.05"
                        value={domain.step} 
                        onChange={e => setDomain({...domain, step: Math.max(Number(e.target.value), 0.05)})} 
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTheory && <TheorySection onClose={() => setShowTheory(false)} />}
      </AnimatePresence>

      {/* Main Analysis Section */}
      <div className="space-y-12">
        {/* Visual Mapping */}
        <div className="bg-slate-900 rounded-[4rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%)]" />
          
          <div className="relative z-10 space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                  <Grid3X3 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Mapping Visualization</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">Domain to Range Transformation</p>
                </div>
              </div>
              
              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <button 
                  onClick={() => setViewMode('2d')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all uppercase",
                    viewMode === '2d' ? "bg-white text-slate-900 shadow-lg scale-105" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  2D View
                </button>
                <button 
                  onClick={() => setViewMode('3d')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all uppercase",
                    viewMode === '3d' ? "bg-white text-slate-900 shadow-lg scale-105" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  3D View
                </button>
              </div>
            </div>

            <div className="relative">
              {viewMode === '2d' ? (
                <Complex2DVisualizer
                  uExpr={result.u}
                  vExpr={result.v}
                  minX={domain.minX}
                  maxX={domain.maxX}
                  minY={domain.minY}
                  maxY={domain.maxY}
                  step={domain.step}
                  domainShape={domainShape}
                  pole={pole}
                />
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Surface Plot</span>
                      <p className="text-sm text-slate-500 italic">Magnitude |f(z)| as height</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RotateCw className="w-4 h-4 animate-spin-slow" />
                      Interactive 3D
                    </div>
                  </div>
                  <div className="h-[500px] bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                    <Complex3DVisualizer 
                      uExpr={result.u} 
                      vExpr={result.v} 
                      minX={domain.minX} 
                      maxX={domain.maxX} 
                      minY={domain.minY} 
                      maxY={domain.maxY} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Math & Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mathematical Derivation</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">Step-by-Step Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSteps(!showSteps)}
                className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center hover:bg-indigo-50 transition-colors border border-slate-100"
              >
                {showSteps ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showSteps && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-10">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="relative pl-12 pb-10 last:pb-0">
                        {idx !== result.steps.length - 1 && (
                          <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-slate-100" />
                        )}
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white z-10 shadow-lg shadow-indigo-200">
                          {idx + 1}
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">{step.step}</h5>
                          <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 font-serif text-xl text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
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

          {/* Additional Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Geometric Insights</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Conformality</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      A mapping is conformal if it preserves angles in both magnitude and orientation. This happens wherever f(z) is analytic and f'(z) ≠ 0.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Critical Points</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Points where f'(z) = 0 are called critical points. At these points, the mapping is not conformal and angles may be multiplied.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Current Function
                    </div>
                    <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-white/10 font-mono text-xs text-indigo-300 break-all">
                      f(z) = {currentFunction}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200">
              <h4 className="text-lg font-black mb-4 tracking-tight">Pro Tip</h4>
              <p className="text-sm text-indigo-100 leading-relaxed font-medium opacity-90">
                Try using the "Custom" mode to explore any complex function. Use 'z' as the variable, e.g., <code className="bg-indigo-700 px-1 rounded">z^2 + 1/z</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConformalLab;
