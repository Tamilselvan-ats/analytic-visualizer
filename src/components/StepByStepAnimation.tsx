import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, ChevronRight, Zap, Calculator, Sparkles } from 'lucide-react';
import { AnalyticityResult } from '../services/mathEngine';

interface StepByStepAnimationProps {
  result: AnalyticityResult;
}

const StepByStepAnimation: React.FC<StepByStepAnimationProps> = ({ result }) => {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    setCurrentStep(-1);
    const timers: any[] = [];
    result.steps.forEach((_, idx) => {
      timers.push(setTimeout(() => setCurrentStep(idx), (idx + 1) * 800));
    });
    // Final result delay
    timers.push(setTimeout(() => setCurrentStep(result.steps.length), (result.steps.length + 1) * 800));
    
    return () => timers.forEach(clearTimeout);
  }, [result]);

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {result.steps.map((step, idx) => (
          idx <= currentStep && (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-black shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{step.step}</h4>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: 'auto' }}
                    className="h-px flex-1 bg-slate-100 mx-4"
                  />
                  <Zap className="w-3 h-3 text-indigo-300" />
                </div>
                <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto leading-relaxed border border-slate-100/50">
                  {step.content}
                </pre>
              </div>
            </motion.div>
          )
        ))}

        {currentStep >= result.steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`p-8 rounded-[2.5rem] text-center border-4 ${
              result.isAnalytic 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl ${
              result.isAnalytic ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'
            }`}>
              {result.isAnalytic ? <Sparkles className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            <h3 className="text-3xl font-black mb-2">
              {result.isAnalytic ? 'Function is Analytic!' : 'Function is Not Analytic'}
            </h3>
            <p className="text-sm font-medium opacity-70">
              {result.isAnalytic 
                ? 'The Cauchy-Riemann equations hold perfectly across the domain.' 
                : 'The mapping fails to preserve local structure due to CR violations.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepByStepAnimation;
