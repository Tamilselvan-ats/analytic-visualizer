import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Calculator, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizQuestion {
  f: string;
  u: string;
  v: string;
  ux: string;
  uy: string;
  vx: string;
  vy: string;
  isAnalytic: boolean;
  hint: string;
}

const QUESTIONS: QuizQuestion[] = [
  { 
    f: "z^2", 
    u: "x^2 - y^2", 
    v: "2xy",
    ux: "2x",
    uy: "-2y",
    vx: "2y",
    vy: "2x",
    isAnalytic: true, 
    hint: "ux = 2x, vy = 2x. uy = -2y, vx = 2y. Equations match!" 
  },
  { 
    f: "conj(z)", 
    u: "x", 
    v: "-y",
    ux: "1",
    uy: "0",
    vx: "0",
    vy: "-1",
    isAnalytic: false, 
    hint: "ux = 1, vy = -1. They are not equal, so it's not analytic." 
  },
  { 
    f: "exp(z)", 
    u: "exp(x)cos(y)", 
    v: "exp(x)sin(y)",
    ux: "exp(x)cos(y)",
    uy: "-exp(x)sin(y)",
    vx: "exp(x)sin(y)",
    vy: "exp(x)cos(y)",
    isAnalytic: true, 
    hint: "Exponential functions satisfy CR equations everywhere." 
  },
  { 
    f: "z^3", 
    u: "x^3 - 3xy^2", 
    v: "3x^2y - y^3",
    ux: "3x^2 - 3y^2",
    uy: "-6xy",
    vx: "6xy",
    vy: "3x^2 - 3y^2",
    isAnalytic: true, 
    hint: "Polynomials in z are always analytic." 
  },
  { 
    f: "z", 
    u: "x", 
    v: "y",
    ux: "1",
    uy: "0",
    vx: "0",
    vy: "1",
    isAnalytic: true, 
    hint: "The identity function is the simplest analytic function." 
  },
  { 
    f: "iz", 
    u: "-y", 
    v: "x",
    ux: "0",
    uy: "-1",
    vx: "1",
    vy: "0",
    isAnalytic: true, 
    hint: "ux = 0, vy = 0. uy = -1, vx = 1. -vx = -1. Match!" 
  },
  { 
    f: "z^2 + z", 
    u: "x^2 - y^2 + x", 
    v: "2xy + y",
    ux: "2x + 1",
    uy: "-2y",
    vx: "2y",
    vy: "2x + 1",
    isAnalytic: true, 
    hint: "Sum of two analytic functions is analytic." 
  },
  { 
    f: "x^2 + y^2", 
    u: "x^2 + y^2", 
    v: "0",
    ux: "2x",
    uy: "2y",
    vx: "0",
    vy: "0",
    isAnalytic: false, 
    hint: "ux = 2x, vy = 0. Only equal at x=0. Not analytic in any open set." 
  },
  { 
    f: "2x + i2y", 
    u: "2x", 
    v: "2y",
    ux: "2",
    uy: "0",
    vx: "0",
    vy: "2",
    isAnalytic: true, 
    hint: "This is just f(z) = 2z." 
  },
  { 
    f: "sin(z)", 
    u: "sin(x)cosh(y)", 
    v: "cos(x)sinh(y)",
    ux: "cos(x)cosh(y)",
    uy: "sin(x)sinh(y)",
    vx: "-sin(x)sinh(y)",
    vy: "cos(x)cosh(y)",
    isAnalytic: true, 
    hint: "Trigonometric functions of z are analytic." 
  },
  { 
    f: "cos(z)", 
    u: "cos(x)cosh(y)", 
    v: "-sin(x)sinh(y)",
    ux: "-sin(x)cosh(y)",
    uy: "cos(x)sinh(y)",
    vx: "-cos(x)sinh(y)",
    vy: "-sin(x)cosh(y)",
    isAnalytic: true, 
    hint: "ux = -sin(x)cosh(y), vy = -sin(x)cosh(y). Match!" 
  },
  { 
    f: "z^2 - i", 
    u: "x^2 - y^2", 
    v: "2xy - 1",
    ux: "2x",
    uy: "-2y",
    vx: "2y",
    vy: "2x",
    isAnalytic: true, 
    hint: "Adding a constant doesn't change analyticity." 
  },
  { 
    f: "3z + 1", 
    u: "3x + 1", 
    v: "3y",
    ux: "3",
    uy: "0",
    vx: "0",
    vy: "3",
    isAnalytic: true, 
    hint: "Linear functions are always analytic." 
  },
  { 
    f: "y + ix", 
    u: "y", 
    v: "x",
    ux: "0",
    uy: "1",
    vx: "1",
    vy: "0",
    isAnalytic: false, 
    hint: "ux = 0, vy = 0. But uy = 1 and vx = 1, so uy != -vx." 
  },
  { 
    f: "x^2 - y^2 - i2xy", 
    u: "x^2 - y^2", 
    v: "-2xy",
    ux: "2x",
    uy: "-2y",
    vx: "-2y",
    vy: "-2x",
    isAnalytic: false, 
    hint: "This is conj(z^2). ux = 2x, vy = -2x. Not equal!" 
  },
  { 
    f: "z + 1/z", 
    u: "x + x/(x^2+y^2)", 
    v: "y - y/(x^2+y^2)",
    ux: "1 + (y^2-x^2)/(x^2+y^2)^2",
    uy: "-2xy/(x^2+y^2)^2",
    vx: "-2xy/(x^2+y^2)^2",
    vy: "1 + (y^2-x^2)/(x^2+y^2)^2",
    isAnalytic: true, 
    hint: "This is the Joukowski transformation, analytic except at z=0." 
  },
  { 
    f: "z^2 + 5z + 6", 
    u: "x^2 - y^2 + 5x + 6", 
    v: "2xy + 5y",
    ux: "2x + 5",
    uy: "-2y",
    vx: "2y",
    vy: "2x + 5",
    isAnalytic: true, 
    hint: "All polynomial functions are analytic everywhere." 
  },
];

const LearningMode: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({ ux: '', uy: '', vx: '', vy: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState({ ux: false, uy: false, vx: false, vy: false });

  const current = QUESTIONS[currentIdx];

  const checkAnswers = () => {
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase().replace(/e\^x/g, 'exp(x)');
    const newResults = {
      ux: normalize(answers.ux) === normalize(current.ux),
      uy: normalize(answers.uy) === normalize(current.uy),
      vx: normalize(answers.vx) === normalize(current.vx),
      vy: normalize(answers.vy) === normalize(current.vy),
    };
    setResults(newResults);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setCurrentIdx((prev) => (prev + 1) % QUESTIONS.length);
    resetState();
  };

  const prevQuestion = () => {
    setCurrentIdx((prev) => (prev - 1 + QUESTIONS.length) % QUESTIONS.length);
    resetState();
  };

  const resetState = () => {
    setAnswers({ ux: '', uy: '', vx: '', vy: '' });
    setShowFeedback(false);
  };

  const allCorrect = results.ux && results.uy && results.vx && results.vy;

  return (
    <div className="space-y-8">
      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Interactive Lab</h2>
            <p className="text-2xl font-black text-slate-800">C-R Equation Verification</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Problem {currentIdx + 1} of {QUESTIONS.length}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-[2rem] text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={false}
                animate={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Function</p>
            <div className="text-4xl font-serif italic text-slate-800">
              f(z) = {current.f}
            </div>
            <div className="mt-4 text-sm text-slate-500 font-medium">
              Given: u = {current.u}, v = {current.v}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['ux', 'uy', 'vx', 'vy'] as const).map((key) => (
              <div key={key} className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  ∂{key[0]}/∂{key[1]}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={answers[key]}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                    disabled={showFeedback && results[key]}
                    className={cn(
                      "w-full px-6 py-4 bg-slate-50 border rounded-2xl font-serif text-lg transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/5",
                      showFeedback 
                        ? (results[key] ? "border-emerald-200 bg-emerald-50/30 text-emerald-700" : "border-rose-200 bg-rose-50/30 text-rose-700")
                        : "border-slate-200 focus:border-indigo-500"
                    )}
                    placeholder={`Enter ∂${key[0]}/∂${key[1]}...`}
                  />
                  {showFeedback && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {results[key] ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={checkAnswers}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              Check Components
            </button>
            <button
              onClick={() => { resetState(); }}
              className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={prevQuestion}
              className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Before
            </button>
            <button 
              onClick={nextQuestion}
              className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "p-6 rounded-[2rem] border flex items-start gap-4",
                  allCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-700"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  allCorrect ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                )}>
                  {allCorrect ? <CheckCircle2 className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <p className="font-black">{allCorrect ? "Excellent! All components are correct." : "Keep trying! Some components need adjustment."}</p>
                  <p className="text-sm opacity-80 leading-relaxed">{current.hint}</p>
                  {allCorrect && (
                    <button 
                      onClick={nextQuestion}
                      className="mt-4 flex items-center gap-2 text-emerald-700 font-bold hover:underline"
                    >
                      Next Problem <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default LearningMode;
