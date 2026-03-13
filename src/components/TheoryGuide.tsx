import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  Target,
  Info
} from 'lucide-react';

const GUIDE_STEPS = [
  {
    title: "The Foundation: f(z) = u + iv",
    content: "Every complex function can be split into two real-valued functions. If we let z = x + iy, then f(z) = u(x,y) + i v(x,y). Understanding this split is the first step to checking analyticity.",
    example: "For f(z) = z², we have (x+iy)² = x² - y² + i(2xy). So u = x² - y² and v = 2xy.",
    icon: BookOpen
  },
  {
    title: "Partial Derivatives",
    content: "To use the Cauchy-Riemann equations, we need to find how u and v change with respect to x and y. This involves calculating four partial derivatives: ∂u/∂x, ∂u/∂y, ∂v/∂x, and ∂v/∂y.",
    example: "Using u = x² - y²: ∂u/∂x = 2x, ∂u/∂y = -2y. Using v = 2xy: ∂v/∂x = 2y, ∂v/∂y = 2x.",
    icon: Zap
  },
  {
    title: "The CR Equations",
    content: "The Cauchy-Riemann equations are: \n1. ∂u/∂x = ∂v/∂y \n2. ∂u/∂y = -∂v/∂x \nIf these hold at a point, the function might be differentiable there.",
    example: "In our z² example: 2x = 2x (Check!) and -2y = -(2y) (Check!). The equations hold everywhere.",
    icon: Target
  },
  {
    title: "Continuity & Analyticity",
    content: "Holding the CR equations isn't enough on its own. The partial derivatives must also be continuous in a neighborhood for the function to be analytic (holomorphic).",
    example: "Since 2x, -2y, 2y, and 2x are all continuous polynomials, f(z) = z² is analytic everywhere.",
    icon: CheckCircle2
  },
  {
    title: "Geometric Interpretation",
    content: "Analytic functions are 'conformal'—they preserve angles. If you draw two intersecting lines, their images under an analytic mapping will intersect at the same angle.",
    example: "This is why complex analysis is so powerful in physics and engineering for mapping complex shapes.",
    icon: Info
  }
];

const TheoryGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => setCurrentStep(s => Math.min(s + 1, GUIDE_STEPS.length - 1));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 0));

  const step = GUIDE_STEPS[currentStep];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex">
          {GUIDE_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-indigo-600' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <step.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {currentStep + 1} of {GUIDE_STEPS.length}</p>
                  <h2 className="text-3xl font-black text-slate-800">{step.title}</h2>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                  {step.content}
                </p>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Concrete Example
                  </h4>
                  <p className="text-slate-700 font-medium font-serif italic text-lg">
                    {step.example}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>

            <button
              onClick={next}
              disabled={currentStep === GUIDE_STEPS.length - 1}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              Next Step <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
          Mastering the Cauchy-Riemann Equations
        </p>
      </div>
    </div>
  );
};

export default TheoryGuide;
