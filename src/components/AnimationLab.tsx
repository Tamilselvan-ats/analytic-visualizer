import React, { useState, useMemo, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { create, all } from 'mathjs';
import { Play, Pause, RotateCcw, Box, Layers } from 'lucide-react';
import { motion } from 'motion/react';

const math = create(all);

interface AnimationLabProps {
  functionStr: string;
}

const AnimationLab: React.FC<AnimationLabProps> = ({ functionStr }) => {
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'mapping' | 'surface'>('mapping');

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setT((prev) => {
          if (prev >= 1) return 0;
          return prev + 0.01;
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const mappingData = useMemo(() => {
    const size = 15;
    const range = 2;
    const x = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    const y = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    
    const lines: any[] = [];

    try {
      const node = math.parse(functionStr);
      const zSub = math.parse('(x + i * y)');
      const substituted = node.transform((n) => {
        if ((n as any).isSymbolNode && (n as any).name === 'z') return zSub;
        return n;
      });
      const code = substituted.compile();

      // Horizontal lines
      for (let i = 0; i < size; i++) {
        const lineX: number[] = [];
        const lineY: number[] = [];
        const lineZ: number[] = [];
        for (let j = 0; j < size; j++) {
          const scope = { x: x[j], y: y[i], i: math.complex(0, 1) };
          const val = code.evaluate(scope);
          const re = val.re ?? val;
          const im = val.im ?? 0;
          
          // Interpolate between z and f(z)
          const curX = (1 - t) * x[j] + t * re;
          const curY = (1 - t) * y[i] + t * im;
          const curZ = t * Math.sqrt(re*re + im*im); // Add some height based on magnitude

          lineX.push(curX);
          lineY.push(curY);
          lineZ.push(curZ);
        }
        lines.push({
          x: lineX, y: lineY, z: lineZ,
          type: 'scatter3d', mode: 'lines',
          line: { color: `rgba(79, 70, 229, ${0.3 + t * 0.7})`, width: 2 },
          showlegend: false
        });
      }

      // Vertical lines
      for (let j = 0; j < size; j++) {
        const lineX: number[] = [];
        const lineY: number[] = [];
        const lineZ: number[] = [];
        for (let i = 0; i < size; i++) {
          const scope = { x: x[j], y: y[i], i: math.complex(0, 1) };
          const val = code.evaluate(scope);
          const re = val.re ?? val;
          const im = val.im ?? 0;
          
          const curX = (1 - t) * x[j] + t * re;
          const curY = (1 - t) * y[i] + t * im;
          const curZ = t * Math.sqrt(re*re + im*im);

          lineX.push(curX);
          lineY.push(curY);
          lineZ.push(curZ);
        }
        lines.push({
          x: lineX, y: lineY, z: lineZ,
          type: 'scatter3d', mode: 'lines',
          line: { color: `rgba(16, 185, 129, ${0.3 + t * 0.7})`, width: 2 },
          showlegend: false
        });
      }
    } catch (e) {
      console.error("Animation error", e);
    }

    return lines;
  }, [functionStr, t]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button 
            onClick={() => setT(0)}
            className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('mapping')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'mapping' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Box className="w-3.5 h-3.5" /> Mapping
            </button>
            <button 
              onClick={() => setViewMode('surface')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'surface' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Magnitude
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transformation Progress</span>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500"
              animate={{ width: `${t * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden relative min-h-[600px]">
        <div className="absolute top-6 left-8 z-10">
          <h3 className="text-lg font-black text-slate-800">Dynamic Complex Mapping</h3>
          <p className="text-xs text-slate-400 font-medium">Visualizing z → (1-t)z + t f(z)</p>
        </div>
        
        <Plot
          data={mappingData}
          layout={{
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
              xaxis: { title: 'Re', gridcolor: '#f1f5f9', range: [-4, 4] },
              yaxis: { title: 'Im', gridcolor: '#f1f5f9', range: [-4, 4] },
              zaxis: { title: '|f(z)|', gridcolor: '#f1f5f9', range: [0, 5] },
              camera: {
                eye: { x: 1.8, y: 1.8, z: 1.2 }
              }
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default AnimationLab;
