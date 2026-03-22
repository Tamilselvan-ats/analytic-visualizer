import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calculator, ChevronRight, Info, AlertCircle, CheckCircle2, X, Sparkles, Target, Activity } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import * as math from 'mathjs';
import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';

// Helper to render math safely
const MathText: React.FC<{ tex: string; block?: boolean }> = ({ tex, block }) => {
  return block ? <BlockMath math={tex} /> : <InlineMath math={tex} />;
};

type TheoryTab = 'conformal-mapping' | 'cr-equations' | 'milne-thomson';

export const ConformalMappingTheory: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700">
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          What is a Conformal Mapping?
        </h3>
        <p className="mb-4 leading-relaxed">
          A mapping <MathText tex="w = f(z)" /> is called <strong>conformal</strong> at a point <MathText tex="z_0" /> if it preserves the angle between any two curves passing through <MathText tex="z_0" /> in both magnitude and sense.
        </p>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
          <p className="text-sm font-semibold text-indigo-900 mb-2">The Condition for Conformality:</p>
          <p className="text-sm text-indigo-800">
            A function <MathText tex="f(z)" /> is conformal at all points where it is <strong>analytic</strong> and its derivative is <strong>non-zero</strong>:
          </p>
          <MathText block tex="f'(z) \neq 0" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
            <Target className="w-4 h-4 text-rose-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">Angle Preservation</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            If two curves intersect at an angle <MathText tex="\alpha" /> in the Z-plane, their images will also intersect at <MathText tex="\alpha" /> in the W-plane.
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">Local Scaling</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            While shapes are distorted globally, infinitesimal shapes (like small circles) remain similar to their original form.
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">Analyticity</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Conformality is a geometric manifestation of complex differentiability (holomorphicity).
          </p>
        </div>
      </div>

      <section className="bg-slate-900 p-6 rounded-2xl text-white">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          Step-by-Step Verification
        </h4>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
            <p className="text-sm text-slate-300">Check if the function is analytic using Cauchy-Riemann equations.</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</div>
            <p className="text-sm text-slate-300">Find the derivative <MathText tex="f'(z)" />.</p>
          </div>
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</div>
            <p className="text-sm text-slate-300">Identify <strong>Critical Points</strong> where <MathText tex="f'(z) = 0" />. At these points, the mapping is NOT conformal.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const CREquations: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700">
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          The Cauchy-Riemann Equations
        </h3>
        <p className="mb-4 leading-relaxed">
          For a function <MathText tex="f(z) = u(x, y) + i v(x, y)" /> to be differentiable at a point, 
          its partial derivatives must satisfy the Cauchy-Riemann equations:
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <MathText block tex="\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \quad \text{and} \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}" />
        </div>
        <p className="text-sm text-slate-500 italic">
          These equations provide a necessary condition for a complex function to be analytic.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
          <h4 className="font-semibold text-indigo-900 mb-2">Step 1: Decomposition</h4>
          <p className="text-sm text-indigo-800">
            Express the complex function in terms of its real part <MathText tex="u(x, y)" /> and imaginary part <MathText tex="v(x, y)" />.
          </p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
          <h4 className="font-semibold text-emerald-900 mb-2">Step 2: Partial Derivatives</h4>
          <p className="text-sm text-emerald-800">
            Calculate the four partial derivatives: <MathText tex="u_x, u_y, v_x, v_y" />.
          </p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
          <h4 className="font-semibold text-amber-900 mb-2">Step 3: Verification</h4>
          <p className="text-sm text-amber-800">
            Check if <MathText tex="u_x = v_y" /> and <MathText tex="u_y = -v_x" />.
          </p>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
          <h4 className="font-semibold text-rose-900 mb-2">Step 4: Continuity</h4>
          <p className="text-sm text-rose-800">
            Ensure the partial derivatives are continuous in the neighborhood of the point.
          </p>
        </div>
      </div>
    </div>
  );
};

export const MilneThomsonSolver: React.FC = () => {
  const [inputFunc, setInputFunc] = useState('x^2 - y^2');
  const [partType, setPartType] = useState<'u' | 'v'>('u');
  const [steps, setSteps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const solve = () => {
    try {
      setError(null);
      const node = math.parse(inputFunc);
      
      // Step 1: Partial derivatives
      const dx = math.derivative(node, 'x');
      const dy = math.derivative(node, 'y');
      
      // Helper to substitute x -> z, y -> 0
      const substitute = (n: math.MathNode) => {
        return n.transform((node) => {
          if (node.type === 'SymbolNode' && (node as any).name === 'x') {
            return new math.SymbolNode('z');
          }
          if (node.type === 'SymbolNode' && (node as any).name === 'y') {
            return new math.ConstantNode(0);
          }
          return node;
        });
      };

      // Step 2: Substitutions (x -> z, y -> 0)
      const phi1_z0 = math.simplify(substitute(dx));
      const phi2_z0 = math.simplify(substitute(dy));
      
      // Step 3: Construct f'(z)
      const fPrimeTex = partType === 'u'
        ? `${phi1_z0.toTex()} - i(${phi2_z0.toTex()})`
        : `${phi2_z0.toTex()} + i(${phi1_z0.toTex()})`;

      const fPrimeStr = partType === 'u'
        ? `(${phi1_z0.toString()}) - i * (${phi2_z0.toString()})`
        : `(${phi2_z0.toString()}) + i * (${phi1_z0.toString()})`;

      // Step 4: Integrate to find f(z)
      let fzTex = '';
      try {
        // nerdamer uses 'i' for imaginary unit
        const integrated = (nerdamer as any).integrate(fPrimeStr, 'z');
        fzTex = integrated.toTeX();
      } catch (e) {
        console.error('Integration error:', e);
        fzTex = `\\int (${fPrimeTex}) \\, dz`;
      }
      
      const newSteps = [
        {
          title: 'Given Function',
          content: `${partType}(x, y) = ${inputFunc}`,
          tex: `${partType}(x, y) = ${math.parse(inputFunc).toTex()}`
        },
        {
          title: 'Partial Derivatives',
          content: `Calculating partial derivatives with respect to x and y.`,
          tex: partType === 'u' 
            ? `u_x = ${dx.toTex()}, \\quad u_y = ${dy.toTex()}`
            : `v_x = ${dx.toTex()}, \\quad v_y = ${dy.toTex()}`
        },
        {
          title: 'Substitutions',
          content: `Replacing x with z and y with 0.`,
          tex: partType === 'u'
            ? `\\phi_1(z, 0) = ${phi1_z0.toTex()}, \\quad \\phi_2(z, 0) = ${phi2_z0.toTex()}`
            : `\\psi_1(z, 0) = ${phi1_z0.toTex()}, \\quad \\psi_2(z, 0) = ${phi2_z0.toTex()}`
        },
        {
          title: "Construct f'(z)",
          content: `Using the Milne-Thomson formula.`,
          tex: `f'(z) = ${fPrimeTex}`
        },
        {
          title: "Final Integration",
          content: `Integrating f'(z) with respect to z to find f(z).`,
          tex: `f(z) = ${fzTex} + C`
        }
      ];
      
      setSteps(newSteps);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Milne-Thomson Method Solver
        </h3>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-600">Given Part:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPartType('u')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${partType === 'u' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Real Part (u)
              </button>
              <button
                onClick={() => setPartType('v')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${partType === 'v' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Imaginary Part (v)
              </button>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => { setInputFunc('x^2 - y^2'); setPartType('u'); }}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
              >
                Ex 1
              </button>
              <button
                onClick={() => { setInputFunc('2*x*y'); setPartType('v'); }}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
              >
                Ex 2
              </button>
              <button
                onClick={() => { setInputFunc('exp(x)*cos(y)'); setPartType('u'); }}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
              >
                Ex 3
              </button>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={inputFunc}
              onChange={(e) => setInputFunc(e.target.value)}
              placeholder="e.g., x^2 - y^2"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
            />
            <div className="absolute right-2 top-2 bottom-2 flex gap-1">
              <button
                onClick={() => { setSteps([]); setInputFunc(''); setError(null); }}
                className="px-3 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={solve}
                className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                Solve <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {steps.map((step, idx) => (
                <div key={idx} className="relative pl-8 pb-4 border-l-2 border-indigo-100 last:border-0 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <h4 className="font-semibold text-slate-800 mb-1">{step.title}</h4>
                  <p className="text-sm text-slate-500 mb-2">{step.content}</p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
                    <MathText block tex={step.tex} />
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Result: Analytic Function f(z)
                </div>
                <p className="text-sm text-emerald-800 mb-3">
                  The complete analytic function derived from the given {partType === 'u' ? 'real' : 'imaginary'} part:
                </p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <MathText block tex={steps[steps.length - 1].tex} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface TheorySectionProps {
  onClose: () => void;
}

const TheorySection: React.FC<TheorySectionProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TheoryTab>('cr-equations');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Theory & Solvers</h2>
            <p className="text-slate-500 text-sm">Explore complex analysis fundamentals and step-by-step solutions.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-4 flex gap-4 bg-white">
          <button
            onClick={() => setActiveTab('conformal-mapping')}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              activeTab === 'conformal-mapping' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Conformal Mapping
            {activeTab === 'conformal-mapping' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cr-equations')}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              activeTab === 'cr-equations' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            CR Equations
            {activeTab === 'cr-equations' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('milne-thomson')}
            className={`pb-4 px-2 text-sm font-semibold transition-all relative ${
              activeTab === 'milne-thomson' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Milne-Thomson Solver
            {activeTab === 'milne-thomson' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'conformal-mapping' && <ConformalMappingTheory />}
              {activeTab === 'cr-equations' && <CREquations />}
              {activeTab === 'milne-thomson' && <MilneThomsonSolver />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-8 py-4 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3 h-3" />
          <span>Powered by Math.js and KaTeX for symbolic computation and rendering.</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TheorySection;
