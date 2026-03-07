import React, { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { create, all } from 'mathjs';
import { motion } from 'motion/react';
import { ArrowRight, Grid3X3 } from 'lucide-react';

const math = create(all);

interface TransformationVisualizerProps {
  functionStr: string;
}

const TransformationVisualizer: React.FC<TransformationVisualizerProps> = ({ functionStr }) => {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Pre-compile the function once when functionStr changes
  const compiledFunction = useMemo(() => {
    try {
      const node = math.parse(functionStr);
      const zSub = math.parse('(x + i * y)');
      const substituted = node.transform((n) => {
        if ((n as any).isSymbolNode && (n as any).name === 'z') return zSub;
        return n;
      });
      return substituted.compile();
    } catch (e) {
      console.error("Compilation error:", e);
      return null;
    }
  }, [functionStr]);

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (isAnimating) {
        const deltaTime = time - lastTime;
        lastTime = time;
        // Adjust speed: 0.2 units per second
        setProgress((p) => {
          const next = p >= 1 ? 0 : p + (deltaTime / 5000);
          setRevision(r => r + 1);
          return next;
        });
      } else {
        lastTime = time;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAnimating]);

  // Pre-calculate the grid points once when compiledFunction changes
  const gridPoints = useMemo(() => {
    if (!compiledFunction) return null;
    
    const size = 15;
    const range = 2;
    const x = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    const y = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    
    const startPoints: { x: number, y: number }[][] = [];
    const endPoints: { x: number, y: number }[][] = [];

    for (let i = 0; i < size; i++) {
      startPoints[i] = [];
      endPoints[i] = [];
      for (let j = 0; j < size; j++) {
        const xVal = x[j];
        const yVal = y[i];
        const scope = { x: xVal, y: yVal, i: math.complex(0, 1) };
        
        startPoints[i][j] = { x: xVal, y: yVal };
        
        try {
          const val = compiledFunction.evaluate(scope);
          endPoints[i][j] = {
            x: val.re ?? val,
            y: val.im ?? 0
          };
        } catch (e) {
          endPoints[i][j] = { x: xVal, y: yVal };
        }
      }
    }
    
    return { startPoints, endPoints, size };
  }, [compiledFunction]);

  const generateTraces = (t: number) => {
    if (!gridPoints) return [];
    
    const { startPoints, endPoints, size } = gridPoints;
    const traces: any[] = [];

    // Horizontal lines
    for (let i = 0; i < size; i++) {
      const lineX: number[] = [];
      const lineY: number[] = [];
      for (let j = 0; j < size; j++) {
        const start = startPoints[i][j];
        const end = endPoints[i][j];
        lineX.push((1 - t) * start.x + t * end.x);
        lineY.push((1 - t) * start.y + t * end.y);
      }
      traces.push({
        x: lineX, y: lineY,
        type: 'scatter', mode: 'lines',
        line: { color: 'rgba(79, 70, 229, 0.4)', width: 1 },
        showlegend: false, hoverinfo: 'none'
      });
    }

    // Vertical lines
    for (let j = 0; j < size; j++) {
      const lineX: number[] = [];
      const lineY: number[] = [];
      for (let i = 0; i < size; i++) {
        const start = startPoints[i][j];
        const end = endPoints[i][j];
        lineX.push((1 - t) * start.x + t * end.x);
        lineY.push((1 - t) * start.y + t * end.y);
      }
      traces.push({
        x: lineX, y: lineY,
        type: 'scatter', mode: 'lines',
        line: { color: 'rgba(16, 185, 129, 0.4)', width: 1 },
        showlegend: false, hoverinfo: 'none'
      });
    }
    return traces;
  };

  const zPlaneData = useMemo(() => generateTraces(0), [gridPoints]);
  const wPlaneData = useMemo(() => generateTraces(1), [gridPoints]);
  const animatedData = useMemo(() => generateTraces(progress), [gridPoints, progress]);

  const commonLayout = useMemo(() => ({
    autosize: true, margin: { l: 20, r: 20, b: 20, t: 20 },
    xaxis: { range: [-3, 3], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
    yaxis: { range: [-3, 3], gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0', fixedrange: true },
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
  }), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Z-Plane */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <Grid3X3 className="w-3 h-3" /> Z-Plane (Original)
          </div>
          <Plot
            data={zPlaneData}
            layout={commonLayout}
            config={{ displayModeBar: false, responsive: true }}
            className="w-full h-[250px]"
          />
        </div>

        {/* Animation */}
        <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>
          <motion.div 
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-4"
          >
            <ArrowRight className="w-12 h-12" />
          </motion.div>
          <h3 className="text-xl font-black mb-2">Mapping Animation</h3>
          <p className="text-indigo-100 text-xs text-center mb-6 opacity-80">Visualizing the transformation of the complex plane</p>
          
          <div className="w-full bg-indigo-500/30 h-1.5 rounded-full overflow-hidden mb-4">
            <motion.div 
              className="h-full bg-white"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0 }}
            />
          </div>

          <button 
            onClick={() => setIsAnimating(!isAnimating)}
            className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-colors"
          >
            {isAnimating ? 'Pause' : 'Resume'}
          </button>
        </div>

        {/* W-Plane */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <Grid3X3 className="w-3 h-3" /> W-Plane (Transformed)
          </div>
          <Plot
            data={wPlaneData}
            layout={commonLayout}
            config={{ displayModeBar: false, responsive: true }}
            className="w-full h-[250px]"
          />
        </div>
      </div>

      {/* Large Animated View */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Dynamic Transition View</h3>
        <Plot
          data={animatedData}
          layout={{
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, range: [-4, 4] },
            yaxis: { ...commonLayout.yaxis, range: [-4, 4] },
          }}
          revision={revision}
          config={{ displayModeBar: false, responsive: true }}
          className="w-full h-[500px]"
        />
      </div>
    </div>
  );
};

export default TransformationVisualizer;
