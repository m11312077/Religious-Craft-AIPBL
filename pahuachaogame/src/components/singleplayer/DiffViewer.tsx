import { useEffect, useRef } from 'react';
import type { NormalizedLandmark, PoseDefinition } from '../../constants/poses';
import { generateMockTargetLandmarks } from '../../core/PoseEvaluator';

interface Props {
  userLandmarks: NormalizedLandmark[] | null;
  targetPose: PoseDefinition;
  failedConditions: string[];
}

export default function DiffViewer({ userLandmarks, targetPose, failedConditions }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !userLandmarks) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawSkeleton = (landmarks: NormalizedLandmark[], color: string, isDashed: boolean, offsetX: number) => {
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
      ];

      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      if (isDashed) {
        ctx.setLineDash([10, 10]);
      } else {
        ctx.setLineDash([]);
      }

      connections.forEach(([i, j]) => {
        const lm1 = landmarks[i];
        const lm2 = landmarks[j];
        if (lm1 && lm2) {
          ctx.beginPath();
          // offsetX is used to shift the skeleton to the left or right side of the canvas
          ctx.moveTo((1 - lm1.x) * (canvas.width / 2) + offsetX, lm1.y * canvas.height);
          ctx.lineTo((1 - lm2.x) * (canvas.width / 2) + offsetX, lm2.y * canvas.height);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    };

    // Draw user pose on the left (offsetX = 0)
    drawSkeleton(userLandmarks, 'white', false, 0);

    const mockTargetLandmarks = generateMockTargetLandmarks(userLandmarks, targetPose.name || '');
    
    // Draw target pose on the right (offsetX = canvas.width / 2)
    drawSkeleton(mockTargetLandmarks, '#00ffff', true, canvas.width / 2);

    // Highlight failed joints on the user's skeleton (simplification: just draw red circles if there are errors)
    if (failedConditions.length > 0) {
      ctx.fillStyle = '#B22222';
      // Highlight left and right wrist as an example
      [15, 16].forEach(idx => {
        const lm = userLandmarks[idx];
        if(lm) {
           ctx.beginPath();
           ctx.arc((1 - lm.x) * (canvas.width / 2), lm.y * canvas.height, 10, 0, 2 * Math.PI);
           ctx.fill();
        }
      });
    }

  }, [userLandmarks, targetPose, failedConditions]);

  return (
    <div className="w-full bg-black/50 rounded-xl overflow-hidden border border-white/10 p-4">
      <div className="flex justify-between text-sm font-bold text-gray-400 mb-2 px-8">
        <span>你的動作</span>
        <span className="text-[var(--color-ghost-cyan)]">目標姿勢</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400} 
        className="w-full h-auto bg-gray-900 rounded-lg"
      />
      {failedConditions.length > 0 && (
        <div className="mt-4 p-4 bg-[var(--color-culture-red)]/20 border border-[var(--color-culture-red)]/50 rounded-lg text-white">
          <ul className="list-disc list-inside space-y-1">
            {failedConditions.map((cond, i) => (
              <li key={i}>{cond}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
