import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Target, Zap, CheckCircle2, Sparkles, Calculator } from 'lucide-react';
import { analyzeAnalyticity } from '../services/mathEngine';

interface StepByStepGuideProps {
  functionStr: string;
}

const StepByStepGuide: React.FC<StepByStepGuideProps> = ({ functionStr }) => {
  const [page, setPage] = useState(0);
  
  const result = useMemo(() => analyzeAnalyticity(functionStr), [functionStr]);

  const PAGES = [
    {
      title: "The Foundation: Real and Imaginary Parts",
      content: (
        <div className="space-y-4">
          <p>For your function <span className="font-serif italic font-bold text-indigo-600">f(z) = {functionStr}</span>, we first substitute <span className="italic">z = x + iy</span> and split it into real and imaginary components:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Real Part u(x, y)</p>
              <p className="text-xl font-serif break-all">{result.u || '...'}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Imaginary Part v(x, y)</p>
              <p className="text-xl font-serif break-all">{result.v || '...'}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 italic">This decomposition is the first step in checking for complex differentiability.</p>
        </div>
      ),
      icon: BookOpen
    },
    {
      title: "Cauchy-Riemann: The Derivation Process",
      content: (
        <div className="space-y-6">
          <p>To find the components of the C-R equations, we perform <strong>partial differentiation</strong>. This means we differentiate with respect to one variable while treating the other as a constant.</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-600 uppercase mb-3 flex items-center gap-2">
                <Calculator className="w-3 h-3" /> Finding ∂u/∂x and ∂u/∂y
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5">1</div>
                  <p>Take <span className="font-serif italic">u = {result.u}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5">2</div>
                  <p>To find <span className="font-bold">uₓ</span>, treat <span className="italic">y</span> as a constant: <br/>
                  <span className="font-mono text-xs text-slate-500">∂/∂x ({result.u}) = {result.ux}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5">3</div>
                  <p>To find <span className="font-bold">uᵧ</span>, treat <span className="italic">x</span> as a constant: <br/>
                  <span className="font-mono text-xs text-slate-500">∂/∂y ({result.u}) = {result.uy}</span></p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <h4 className="text-xs font-black text-emerald-600 uppercase mb-3 flex items-center gap-2">
                <Calculator className="w-3 h-3" /> Finding ∂v/∂x and ∂v/∂y
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">1</div>
                  <p>Take <span className="font-serif italic">v = {result.v}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">2</div>
                  <p>To find <span className="font-bold">vₓ</span>, treat <span className="italic">y</span> as a constant: <br/>
                  <span className="font-mono text-xs text-slate-500">∂/∂x ({result.v}) = {result.vx}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-white border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">3</div>
                  <p>To find <span className="font-bold">vᵧ</span>, treat <span className="italic">x</span> as a constant: <br/>
                  <span className="font-mono text-xs text-slate-500">∂/∂y ({result.v}) = {result.vy}</span></p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 italic">Note: We use standard rules (Power, Product, Chain) while holding the other variable fixed.</p>
        </div>
      ),
      icon: Zap
    },
    {
      title: "Cauchy-Riemann Verification",
      content: (
        <div className="space-y-4">
          <p>Next, we compute the partial derivatives and check if they satisfy the <strong>Cauchy-Riemann equations</strong>:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">uₓ = ∂u/∂x</p>
              <p className="font-serif text-sm break-all">{result.ux}</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">vᵧ = ∂v/∂y</p>
              <p className="font-serif text-sm break-all">{result.vy}</p>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">uᵧ = ∂u/∂y</p>
              <p className="font-serif text-sm break-all">{result.uy}</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">vₓ = ∂v/∂x</p>
              <p className="font-serif text-sm break-all">{result.vx}</p>
            </div>
          </div>
          <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono">uₓ = vᵧ?</span>
              <span className={result.isAnalytic ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {result.isAnalytic ? "Satisfied" : "Failed"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono">uᵧ = -vₓ?</span>
              <span className={result.isAnalytic ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {result.isAnalytic ? "Satisfied" : "Failed"}
              </span>
            </div>
          </div>
        </div>
      ),
      icon: Zap
    },
    {
      title: "Final Conclusion",
      content: (
        <div className="space-y-6">
          <div className={cn(
            "p-8 rounded-[2rem] border-2 text-center",
            result.isAnalytic ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
              result.isAnalytic ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            )}>
              {result.isAnalytic ? <CheckCircle2 className="w-10 h-10" /> : <Target className="w-10 h-10" />}
            </div>
            <h3 className="text-2xl font-black mb-2">
              {result.isAnalytic ? "Function is Analytic" : "Function is Not Analytic"}
            </h3>
            <p className="text-slate-600 font-medium">
              {result.isAnalytic 
                ? "Since the C-R equations are satisfied and the partial derivatives are continuous, the function is differentiable everywhere in its domain."
                : "The Cauchy-Riemann equations are not satisfied, meaning the derivative depends on the direction of approach."}
            </p>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Mathematical Summary</p>
            <p className="text-sm font-serif italic text-slate-700">
              f'(z) = uₓ + i vₓ = {result.ux} + i({result.vx})
            </p>
          </div>
        </div>
      ),
      icon: Target
    },
    {
      title: "Geometric Mapping",
      content: (
        <div className="space-y-4">
          <p>Analytic functions like <span className="italic font-bold">{functionStr}</span> act as <strong>conformal maps</strong>.</p>
          <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center p-8 overflow-hidden relative">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
             <div className="relative z-10 text-center space-y-4">
               <p className="text-indigo-300 font-mono text-xs uppercase tracking-widest">Visual Insight</p>
               <p className="text-white text-lg font-medium">
                 {result.isAnalytic 
                   ? "Angles between intersecting curves are preserved under this transformation."
                   : "This mapping distorts angles, indicating a lack of complex differentiability."}
               </p>
             </div>
          </div>
          <p className="text-sm text-slate-500">Check the 'Mapping' and 'Geometry' tabs to see this transformation in real-time!</p>
        </div>
      ),
      icon: Sparkles
    }
  ];

  const next = () => setPage(p => Math.min(p + 1, PAGES.length - 1));
  const prev = () => setPage(p => Math.max(p - 1, 0));

  const Icon = PAGES[page].icon;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={false}
            animate={{ width: `${((page + 1) / PAGES.length) * 100}%` }}
          />
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {page + 1} of {PAGES.length}</p>
                  <h2 className="text-2xl font-black text-slate-800">{PAGES[page].title}</h2>
                </div>
              </div>

              <div className="text-slate-600 leading-relaxed">
                {PAGES[page].content}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={page === 0}
              className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
              Before
            </button>

            <div className="flex gap-2">
              {PAGES.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-indigo-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={page === PAGES.length - 1}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-400 text-xs font-medium">
          Detailed Analysis for f(z) = {functionStr}
        </p>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default StepByStepGuide;
