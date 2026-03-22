import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  LineChart, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Zap,
  RotateCcw,
  Info,
  ChevronDown,
  Trophy,
  Target,
  Sparkles,
  HelpCircle,
  Activity,
  FlaskConical,
  ScrollText,
  GraduationCap
} from 'lucide-react';
import { analyzeAnalyticity, AnalyticityResult } from './services/mathEngine';
import Visualizer from './components/Visualizer';
import LearningMode from './components/LearningMode';
import AnimationLab from './components/AnimationLab';
import TransformationVisualizer from './components/TransformationVisualizer';
import CRVisualizer from './components/CRVisualizer';
import ConformalLab from './components/ConformalLab';
import AnalyticitySolver from './components/AnalyticitySolver';
import StepByStepGuide from './components/StepByStepGuide';
import StepByStepAnimation from './components/StepByStepAnimation';
import TheorySection, { MilneThomsonSolver, CREquations, ConformalMappingTheory } from './components/TheorySection';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EXAMPLES = [
  "z^2", "exp(z)", "sin(z)", "1/z", "conj(z)", "x^2 + y^2", "log(z)", "z * conj(z)",
];

const TOOLTIPS = {
  cr: "Cauchy-Riemann equations are necessary conditions for a function to be analytic.",
  ux: "The partial derivative of the real part u with respect to x.",
  analytic: "A function is analytic if it is locally representable by a power series.",
};

export default function App() {
  const [input, setInput] = useState("z^2");
  const [result, setResult] = useState<AnalyticityResult | null>(null);
  const [activeTab, setActiveTab] = useState<'checker' | 'learning' | 'challenge' | 'animation' | 'conformal' | 'conformal-lab' | 'guide' | 'solver' | 'milne-thomson' | 'theory'>('checker');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0, 4]); // Default expand substitution and conclusion
  
  // Challenge Mode State
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  const handleCheck = (val: string = input) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = analyzeAnalyticity(val);
      setResult(res);
      setIsAnalyzing(false);
    }, 600);
  };

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const startChallenge = () => {
    const randomFunc = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setChallengeTarget(randomFunc);
    setChallengeFeedback(null);
  };

  const submitChallenge = (guess: boolean) => {
    const res = analyzeAnalyticity(challengeTarget);
    if (res.isAnalytic === guess) {
      setChallengeScore(s => s + 1);
      setChallengeFeedback("Correct! You've mastered this one. ✨");
    } else {
      setChallengeFeedback("Incorrect. Check the Checker tab to see why! 🧐");
    }
  };

  useEffect(() => {
    handleCheck();
    startChallenge();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"
            >
              <Zap className="w-6 h-6 fill-current" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">AnalyticExplorer</h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold bg-slate-100 px-1.5 py-0.5 rounded">v2.0 Professional</span>
              </div>
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {[
              { id: 'checker', icon: Activity, label: 'Analysis' },
              { id: 'solver', icon: Zap, label: 'Solver' },
              { id: 'animation', icon: Sparkles, label: 'Mapping' },
              { id: 'conformal', icon: Target, label: 'Geometry' },
              { id: 'conformal-lab', icon: FlaskConical, label: 'Conformal Lab' },
              { id: 'theory', icon: BookOpen, label: 'Theory' },
              { id: 'milne-thomson', icon: Calculator, label: 'Milne-Thomson' },
              { id: 'guide', icon: ScrollText, label: 'Step-by-Step' },
              { id: 'learning', icon: HelpCircle, label: 'Quiz' },
              { id: 'challenge', icon: Trophy, label: 'Challenge' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'checker' && (
            <motion.div
              key="checker"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-8"
            >
              {/* Left Column: Input & Logic */}
              <div className="xl:col-span-5 space-y-6">
                <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Function Lab</h2>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-slate-300 cursor-help hover:text-indigo-400 transition-colors" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {TOOLTIPS.analytic}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-serif italic text-2xl group-focus-within:text-indigo-400 transition-colors">f(z) =</span>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                        className="w-full pl-20 pr-5 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl text-2xl font-serif focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-200"
                        placeholder="z^2 + 1"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLES.slice(0, 6).map((ex) => (
                        <button
                          key={ex}
                          onClick={() => { setInput(ex); handleCheck(ex); }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-500 hover:text-indigo-600 text-[11px] font-bold rounded-xl transition-all"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCheck()}
                      disabled={isAnalyzing}
                      className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group"
                    >
                      {isAnalyzing ? (
                        <RotateCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Analyze Function 
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {result && !result.error && (
                  <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification Protocol</h2>
                    </div>
                    <StepByStepAnimation result={result} />
                  </section>
                )}
              </div>

              {/* Right Column: Visualization */}
              <div className="xl:col-span-7">
                <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Geometric Analysis</h2>
                      <p className="text-lg font-bold text-slate-800">Complex Surface Mapping</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Engine</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[600px]">
                    {result && !result.error ? (
                      <Visualizer uExpr={result.u} vExpr={result.v} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-200 space-y-6">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
                          <LineChart className="w-12 h-12 opacity-20" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Awaiting Input Data</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'solver' && (
            <motion.div
              key="solver"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticitySolver initialFunction={input} />
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <LearningMode />
            </motion.div>
          )}

          {activeTab === 'animation' && (
            <motion.div
              key="animation"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <TransformationVisualizer functionStr={input} />
            </motion.div>
          )}

          {activeTab === 'conformal' && (
            <motion.div
              key="conformal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CRVisualizer functionStr={input} />
            </motion.div>
          )}

          {activeTab === 'conformal-lab' && (
            <motion.div
              key="conformal-lab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <ConformalLab />
            </motion.div>
          )}

          {activeTab === 'theory' && (
            <motion.div
              key="theory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200">
                <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                  Complex Analysis Theory
                </h2>
                <div className="space-y-16">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Part 1: Cauchy-Riemann Equations</h3>
                    <CREquations />
                  </section>
                  <div className="h-px bg-slate-100" />
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Part 2: Conformal Mappings</h3>
                    <ConformalMappingTheory />
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'milne-thomson' && (
            <motion.div
              key="milne-thomson"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <MilneThomsonSolver />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StepByStepGuide functionStr={input} />
            </motion.div>
          )}

          {activeTab === 'challenge' && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <section className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-200/60 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
                  <Target className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Analyticity Challenge</h2>
                <p className="text-slate-400 font-medium mb-12">Test your intuition. Can you spot the analytic function?</p>
                
                <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 mb-12">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Current Target</p>
                  <div className="text-5xl font-serif italic text-indigo-600 tracking-tight">
                    f(z) = {challengeTarget}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => submitChallenge(true)}
                    disabled={!!challengeFeedback}
                    className="py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    Analytic
                  </button>
                  <button 
                    onClick={() => submitChallenge(false)}
                    disabled={!!challengeFeedback}
                    className="py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
                  >
                    Non-Analytic
                  </button>
                </div>

                {challengeFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-800 font-bold mb-8"
                  >
                    {challengeFeedback}
                  </motion.div>
                )}

                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Current Streak</p>
                      <p className="text-lg font-black text-slate-700">{challengeScore}</p>
                    </div>
                  </div>
                  <button 
                    onClick={startChallenge}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Next Challenge
                  </button>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-slate-200/60 py-12 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4" />
            <div className="h-px w-12 bg-slate-100" />
            <span className="text-[10px] font-black uppercase tracking-widest">AnalyticExplorer Professional</span>
            <div className="h-px w-12 bg-slate-100" />
          </div>
          <p className="text-slate-400 text-[11px] font-medium">
            Advanced Symbolic Engine • Real-time 3D Rendering • Academic Research Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
