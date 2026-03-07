import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

const QUESTIONS = [
  { f: "z^2", isAnalytic: true, hint: "Polynomials in z are always analytic." },
  { f: "conj(z)", isAnalytic: false, hint: "The conjugate function fails CR equations everywhere." },
  { f: "exp(z)", isAnalytic: true, hint: "The exponential function is entire (analytic everywhere)." },
  { f: "abs(z)^2", isAnalytic: false, hint: "Only analytic at z=0, not in any open set." },
  { f: "sin(z)", isAnalytic: true, hint: "Trigonometric functions of z are analytic." },
];

const LearningMode: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; show: boolean } | null>(null);

  const handleGuess = (guess: boolean) => {
    const correct = guess === QUESTIONS[currentIdx].isAnalytic;
    setFeedback({ correct, show: true });
  };

  const nextQuestion = () => {
    setFeedback(null);
    setCurrentIdx((prev) => (prev + 1) % QUESTIONS.length);
  };

  return (
    <div className="space-y-8">
      <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6" /> What is Analyticity?
        </h2>
        <div className="prose prose-indigo max-w-none text-indigo-800/80">
          <p>
            A complex function <strong>f(z)</strong> is <strong>analytic</strong> at a point if it is differentiable in some neighborhood of that point.
          </p>
          <p>
            This tool supports standard mathematical notation. You can use:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>z</strong>: The complex variable (automatically treated as x + iy)</li>
            <li><strong>x, y</strong>: Real and imaginary coordinates</li>
            <li><strong>Functions</strong>: exp(), sin(), cos(), log(), sqrt(), etc.</li>
            <li><strong>Operators</strong>: +, -, *, /, ^ (power), conj() (conjugate)</li>
          </ul>
          <p className="mt-4">
            If <strong>f(z) = u(x, y) + i v(x, y)</strong>, then <strong>f</strong> is analytic if and only if the <strong>Cauchy-Riemann equations</strong> are satisfied:
          </p>
          <div className="bg-white/50 p-4 rounded-xl font-mono text-center my-4 border border-indigo-200">
            ∂u/∂x = ∂v/∂y <br />
            ∂u/∂y = -∂v/∂x
          </div>
          <p>
            Geometrically, analytic functions are <strong>conformal maps</strong>—they preserve angles between curves.
          </p>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Practice: Is it Analytic?</h2>
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-3xl font-serif italic bg-slate-50 px-8 py-4 rounded-2xl border border-slate-200">
            f(z) = {QUESTIONS[currentIdx].f}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleGuess(true)}
              disabled={feedback?.show}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Analytic
            </button>
            <button
              onClick={() => handleGuess(false)}
              disabled={feedback?.show}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              Not Analytic
            </button>
          </div>

          {feedback?.show && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full p-4 rounded-xl flex items-center gap-3 ${
                feedback.correct ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
              }`}
            >
              {feedback.correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <div>
                <p className="font-semibold">{feedback.correct ? 'Correct!' : 'Not quite.'}</p>
                <p className="text-sm opacity-90">{QUESTIONS[currentIdx].hint}</p>
              </div>
              <button
                onClick={nextQuestion}
                className="ml-auto text-sm font-bold underline hover:no-underline"
              >
                Next
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LearningMode;
