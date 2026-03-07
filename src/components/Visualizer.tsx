import React, { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { create, all } from 'mathjs';

const math = create(all);

interface VisualizerProps {
  uExpr: string;
  vExpr: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ uExpr, vExpr }) => {
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    setAnimProgress(0);
    const interval = setInterval(() => {
      setAnimProgress(p => {
        if (p >= 1) {
          clearInterval(interval);
          return 1;
        }
        return p + 0.05;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [uExpr, vExpr]);

  const data = useMemo(() => {
    const size = 25; // Slightly smaller for better performance
    const range = 2;
    const x = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    const y = Array.from({ length: size }, (_, i) => -range + (i * (range * 2)) / (size - 1));
    
    const zU: number[][] = [];
    const zV: number[][] = [];

    try {
      const uNode = math.parse(uExpr);
      const vNode = math.parse(vExpr);
      const uCode = uNode.compile();
      const vCode = vNode.compile();

      for (let i = 0; i < size; i++) {
        zU[i] = [];
        zV[i] = [];
        for (let j = 0; j < size; j++) {
          const scope = { x: x[j], y: y[i], i: math.complex(0, 1) };
          try {
            const uVal = uCode.evaluate(scope);
            const vVal = vCode.evaluate(scope);
            
            // Animate the surface forming by scaling Z values
            zU[i][j] = (typeof uVal === 'number' ? uVal : (uVal.re ?? 0)) * animProgress;
            zV[i][j] = (typeof vVal === 'number' ? vVal : (vVal.re ?? 0)) * animProgress;
            
            if (!isFinite(zU[i][j])) zU[i][j] = 0;
            if (!isFinite(zV[i][j])) zV[i][j] = 0;
          } catch {
            zU[i][j] = 0;
            zV[i][j] = 0;
          }
        }
      }
    } catch (e) {
      console.error("Plotting evaluation error", e);
    }

    return { x, y, zU, zV };
  }, [uExpr, vExpr, animProgress]);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-slate-50 p-2 rounded-2xl border border-black/5 flex-1 min-h-[300px]">
        <Plot
          data={[
            {
              z: data.zU,
              x: data.x,
              y: data.y,
              type: 'surface',
              colorscale: 'Viridis',
              showscale: false,
              name: 'u(x,y)'
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
              xaxis: { title: 'x', gridcolor: '#e2e8f0' },
              yaxis: { title: 'y', gridcolor: '#e2e8f0' },
              zaxis: { title: 'u', gridcolor: '#e2e8f0' },
              camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
              }
            },
          }}
          config={{ displayModeBar: false }}
          useResizeHandler={true}
          className="w-full h-full"
        />
      </div>
      <div className="bg-slate-50 p-2 rounded-2xl border border-black/5 flex-1 min-h-[300px]">
        <Plot
          data={[
            {
              z: data.zV,
              x: data.x,
              y: data.y,
              type: 'surface',
              colorscale: 'Electric',
              showscale: false,
              name: 'v(x,y)'
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
              xaxis: { title: 'x', gridcolor: '#e2e8f0' },
              yaxis: { title: 'y', gridcolor: '#e2e8f0' },
              zaxis: { title: 'v', gridcolor: '#e2e8f0' },
              camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
              }
            },
          }}
          config={{ displayModeBar: false }}
          useResizeHandler={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default Visualizer;
