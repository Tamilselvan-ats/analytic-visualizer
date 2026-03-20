import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { evaluateFunction } from '../services/mathEngine';

interface Point {
  x: number;
  y: number;
}

interface MappedPoint extends Point {
  u: number;
  v: number;
}

interface Line {
  type: 'h' | 'v' | 'shape';
  points: MappedPoint[];
  color: string;
}

interface Complex2DVisualizerProps {
  uExpr: string;
  vExpr: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  step: number;
  domainShape: 'grid' | 'circle' | 'square' | 'triangle';
  pole?: { x: number, y: number } | null;
}

const Complex2DVisualizer: React.FC<Complex2DVisualizerProps> = ({
  uExpr,
  vExpr,
  minX,
  maxX,
  minY,
  maxY,
  step,
  domainShape,
  pole
}) => {
  const width = 400;
  const height = 400;
  const padding = 40;
  
  const scaleX = (val: number) => (val - minX) / (maxX - minX) * (width - 2 * padding) + padding;
  const scaleY = (val: number) => height - ((val - minY) / (maxY - minY) * (height - 2 * padding) + padding);

  // For W-plane, we might need a different scale if the mapping expands a lot
  // But for now let's use the same range or a fixed range like [-5, 5]
  const wRange = 5;
  const scaleU = (val: number) => (val + wRange) / (2 * wRange) * (width - 2 * padding) + padding;
  const scaleV = (val: number) => height - ((val + wRange) / (2 * wRange) * (height - 2 * padding) + padding);

  const gridLines = useMemo(() => {
    const lines: Line[] = [];
    const safeStep = Math.max(step, 0.1);
    const fineRes = 100; // Match Python script's resolution

    if (domainShape === 'grid') {
      // Vertical lines (x = const)
      for (let x = minX; x <= maxX; x += safeStep) {
        const points: MappedPoint[] = [];
        for (let i = 0; i <= fineRes; i++) {
          const y = minY + (i / fineRes) * (maxY - minY);
          const u = evaluateFunction(uExpr, x, y);
          const v = evaluateFunction(vExpr, x, y);
          points.push({ x, y, u, v });
        }
        lines.push({ type: 'v', points, color: '#ef4444' }); // Red for vertical
      }

      // Horizontal lines (y = const)
      for (let y = minY; y <= maxY; y += safeStep) {
        const points: MappedPoint[] = [];
        for (let i = 0; i <= fineRes; i++) {
          const x = minX + (i / fineRes) * (maxX - minX);
          const u = evaluateFunction(uExpr, x, y);
          const v = evaluateFunction(vExpr, x, y);
          points.push({ x, y, u, v });
        }
        lines.push({ type: 'h', points, color: '#3b82f6' }); // Blue for horizontal
      }
    } else {
      // Handle other shapes
      const shapes: {x: number, y: number}[] = [];
      if (domainShape === 'circle') {
        for (let r = 0.5; r <= 2; r += 0.5) {
          for (let theta = 0; theta <= 2 * Math.PI; theta += 0.1) {
            shapes.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
          }
        }
      }
      // ... existing shape logic could go here, but grid is primary for the request
    }

    return lines;
  }, [uExpr, vExpr, minX, maxX, minY, maxY, step, domainShape]);

  // Try to find the pole for Bilinear transformations
  // w = (az + b) / (cz + d) => pole at z = -d/c
  // This is a bit tricky to extract from the expression string, 
  // but we can pass it as a prop or try to infer it if we know it's bilinear.
  // For now, let's assume we might have a pole prop or just skip for general.

  const renderPlane = (isWPlane: boolean) => {
    const scaleFuncX = isWPlane ? scaleU : scaleX;
    const scaleFuncY = isWPlane ? scaleV : scaleY;
    
    return (
      <div className="relative">
        <svg width={width} height={height} className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-sm">
          {/* Grid Background */}
          <defs>
            <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#smallGrid)" rx="40" />

          {/* Axes */}
          <line 
            x1={0} y1={height/2} x2={width} y2={height/2} 
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" 
          />
          <line 
            x1={width/2} y1={0} x2={width/2} y2={height} 
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" 
          />
          
          {/* Grid Lines */}
          {gridLines.map((line, i) => {
            const pathData = line.points
              .map((p, j) => {
                const px = isWPlane ? p.u : p.x;
                const py = isWPlane ? p.v : p.y;
                
                // Handle infinity/poles
                if (isWPlane && (Math.abs(px) > 50 || Math.abs(py) > 50)) {
                  return '';
                }
                
                const sx = scaleFuncX(px);
                const sy = scaleFuncY(py);
                
                // Skip if out of bounds significantly
                if (sx < -width || sx > 2*width || sy < -height || sy > 2*height) return '';

                return `${j === 0 || line.points[j-1].u === Infinity ? 'M' : 'L'} ${sx} ${sy}`;
              })
              .filter(s => s !== '')
              .join(' ');

            if (!pathData) return null;

            return (
              <motion.path
                key={i}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.01 }}
                d={pathData}
                fill="none"
                stroke={line.color}
                strokeWidth={isWPlane ? "2" : "1.5"}
                strokeOpacity={isWPlane ? "0.8" : "0.4"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Origin Marker */}
          <circle cx={scaleFuncX(0)} cy={scaleFuncY(0)} r="3" fill="#f59e0b" />

          {/* Pole Marker (Z-plane only) */}
          {!isWPlane && pole && (
            <g>
              <circle cx={scaleFuncX(pole.x)} cy={scaleFuncY(pole.y)} r="5" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
              <line x1={scaleFuncX(pole.x)-5} y1={scaleFuncY(pole.y)-5} x2={scaleFuncX(pole.x)+5} y2={scaleFuncY(pole.y)+5} stroke="#ef4444" strokeWidth="2" />
              <line x1={scaleFuncX(pole.x)+5} y1={scaleFuncY(pole.y)-5} x2={scaleFuncX(pole.x)-5} y2={scaleFuncY(pole.y)+5} stroke="#ef4444" strokeWidth="2" />
              <text x={scaleFuncX(pole.x) + 8} y={scaleFuncY(pole.y) - 8} fill="#ef4444" fontSize="10" className="font-bold">Pole</text>
            </g>
          )}

          {/* Labels */}
          <text x={width - 50} y={height/2 + 20} fill="rgba(255,255,255,0.3)" fontSize="10" className="font-mono font-bold uppercase tracking-widest">
            {isWPlane ? 'Re(w)' : 'Re(z)'}
          </text>
          <text x={width/2 + 10} y={padding + 10} fill="rgba(255,255,255,0.3)" fontSize="10" className="font-mono font-bold uppercase tracking-widest">
            {isWPlane ? 'Im(w)' : 'Im(z)'}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Z-Plane (Input)</h3>
        {renderPlane(false)}
      </div>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">W-Plane (Output)</h3>
        {renderPlane(true)}
      </div>
    </div>
  );
};

export default Complex2DVisualizer;
