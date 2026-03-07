import { create, all } from 'mathjs';

const math = create(all);

export interface StepResult {
  step: string;
  content: string;
  isSuccess?: boolean;
}

export interface AnalyticityResult {
  isAnalytic: boolean;
  u: string;
  v: string;
  ux: string;
  uy: string;
  vx: string;
  vy: string;
  steps: StepResult[];
  error?: string;
}

/**
 * Analyzes a complex function f(z) for analyticity.
 * @param functionStr The function string (e.g., "z^2", "exp(z)")
 */
export function analyzeAnalyticity(functionStr: string): AnalyticityResult {
  try {
    // 1. Parse the function
    const node = math.parse(functionStr);
    
    // 2. Substitute z = x + i*y
    // We use a complex number representation for i
    const zSub = math.parse('(x + i * y)');
    
    // Replace 'z' with '(x + i*y)'
    const substituted = node.transform((node) => {
      if ((node as any).isSymbolNode && (node as any).name === 'z') {
        return zSub;
      }
      return node;
    });

    // 3. Extract Real and Imaginary parts
    const simplifiedF = math.simplify(substituted);
    const uNode = math.simplify(`re(${simplifiedF.toString()})`);
    const vNode = math.simplify(`im(${simplifiedF.toString()})`);
    
    const uStr = uNode.toString();
    const vStr = vNode.toString();

    // 4. Compute Partial Derivatives of the FULL complex function
    // Instead of differentiating re(f) and im(f), we differentiate f(x+iy)
    // and then extract the real and imaginary parts of the DERIVATIVE.
    const df_dx = math.derivative(substituted, 'x');
    const df_dy = math.derivative(substituted, 'y');

    const uxNode = math.simplify(`re(${df_dx.toString()})`);
    const vxNode = math.simplify(`im(${df_dx.toString()})`);
    const uyNode = math.simplify(`re(${df_dy.toString()})`);
    const vyNode = math.simplify(`im(${df_dy.toString()})`);

    const uxStr = uxNode.toString();
    const vxStr = vxNode.toString();
    const uyStr = uyNode.toString();
    const vyStr = vyNode.toString();

    // 5. Check Cauchy-Riemann Equations
    const cr1_diff = math.simplify(`${uxStr} - (${vyStr})`);
    const cr2_sum = math.simplify(`${uyStr} + (${vxStr})`);
    
    // Symbolic check
    let isAnalytic = cr1_diff.toString() === '0' && cr2_sum.toString() === '0';

    // Numerical verification (Double-check)
    const testPoints = [
      { x: 0.5, y: 0.5 },
      { x: -1.2, y: 0.8 },
      { x: 2.3, y: -1.5 },
      { x: 0.1, y: -0.2 },
      { x: -0.7, y: 0.3 }
    ];
    
    const uxCompiled = uxNode.compile();
    const vxCompiled = vxNode.compile();
    const uyCompiled = uyNode.compile();
    const vyCompiled = vyNode.compile();

    const epsilon = 1e-7;
    let allPointsPass = true;
    let evaluatedCount = 0;

    for (const p of testPoints) {
      const scope = { ...p, i: math.complex(0, 1) };
      try {
        const uxVal = uxCompiled.evaluate(scope);
        const vxVal = vxCompiled.evaluate(scope);
        const uyVal = uyCompiled.evaluate(scope);
        const vyVal = vyCompiled.evaluate(scope);

        const uxR = typeof uxVal === 'number' ? uxVal : (uxVal.re ?? 0);
        const vxR = typeof vxVal === 'number' ? vxVal : (vxVal.re ?? 0);
        const uyR = typeof uyVal === 'number' ? uyVal : (uyVal.re ?? 0);
        const vyR = typeof vyVal === 'number' ? vyVal : (vyVal.re ?? 0);

        const d1 = Math.abs(uxR - vyR);
        const d2 = Math.abs(uyR + vxR);

        if (d1 > epsilon || d2 > epsilon) {
          allPointsPass = false;
          break;
        }
        evaluatedCount++;
      } catch (e) {
        continue;
      }
    }
    
    if (evaluatedCount > 0) {
      isAnalytic = allPointsPass;
    }

    // 6. Build Steps
    const steps: StepResult[] = [
      {
        step: "Step 1: Substitute z = x + iy",
        content: `f(x, y) = ${simplifiedF.toString()}`
      },
      {
        step: "Step 2: Split into Real (u) and Imaginary (v) parts",
        content: `u(x, y) = ${uStr}\nv(x, y) = ${vStr}`
      },
      {
        step: "Step 3: Compute Partial Derivatives",
        content: `∂u/∂x = ${uxStr}\n∂u/∂y = ${uyStr}\n∂v/∂x = ${vxStr}\n∂v/∂y = ${vyStr}`
      },
      {
        step: "Step 4: Verify Cauchy-Riemann Equations",
        content: `∂u/∂x = ∂v/∂y? ${isAnalytic ? 'Yes' : 'No'} (${uxStr} = ${vyStr})\n∂u/∂y = -∂v/∂x? ${isAnalytic ? 'Yes' : 'No'} (${uyStr} = -${vxStr})`
      }
    ];

    return {
      isAnalytic,
      u: uStr,
      v: vStr,
      ux: uxStr,
      uy: uyStr,
      vx: vxStr,
      vy: vyStr,
      steps
    };
  } catch (err: any) {
    return {
      isAnalytic: false,
      u: '', v: '', ux: '', uy: '', vx: '', vy: '',
      steps: [],
      error: err.message || "Failed to analyze function."
    };
  }
}

export function evaluateFunction(expr: string, x: number, y: number): number {
  try {
    return math.evaluate(expr, { x, y, i: math.complex(0, 1) });
  } catch {
    return 0;
  }
}
