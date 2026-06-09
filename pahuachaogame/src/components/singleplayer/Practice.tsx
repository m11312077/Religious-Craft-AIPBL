import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { PoseDetector } from '../../core/PoseDetector';
import { evaluatePose, generateMockTargetLandmarks } from '../../core/PoseEvaluator';
import { PoseRecorder } from '../../core/PoseRecorder';
import { ALL_SEQUENCES, type NormalizedLandmark, type PoseDefinition } from '../../constants/poses';
import demoVideo1_1 from '../../assets/1-1.mov';
import demoVideo1_2 from '../../assets/1-2.mov';
import demoVideo1_3 from '../../assets/demo1.mp4';

export interface PracticeResult {
  score: number;
  passed: boolean;
  failedConditions: string[];
  snapshotLandmarks: NormalizedLandmark[] | null;
  failedPose: PoseDefinition | null;
  videoBlob?: Blob;
}

interface Props {
  levelId: number;
  onFinish: (result: PracticeResult) => void;
  onBack: () => void;
}

export default function Practice({ levelId, onFinish, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);

  const [phase, setPhase] = useState<'LEARNING' | 'CONTINUOUS'>('LEARNING');
  const [poseIndex, setPoseIndex] = useState(0); // 記錄目前進行到 sequence 中的哪一個動作
  const [score, setScore] = useState(0); // 氣勢值 0-100
  const [combo, setCombo] = useState(0);
  const [holdFrames, setHoldFrames] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState('準備開始...');

  // 根據 levelId 選擇對應示範影片
  const demoVideoMap: Record<number, string> = {
    0: demoVideo1_1,
    1: demoVideo1_2,
    2: demoVideo1_3,
  };
  const demoVideo = demoVideoMap[levelId] ?? demoVideo1_3;

  // 目前的目標連續動作
  const targetSequence = ALL_SEQUENCES[levelId];
  const targetPose = targetSequence?.poses[poseIndex];

  const PASS_THRESHOLD = 60;
  const REQUIRED_HOLD_FRAMES = 10;

  useEffect(() => {
    // 啟動相機與追蹤
    const initDetector = async () => {
      detectorRef.current = new PoseDetector({
        numPoses: 1,
        onResults: (results) => {
          if (results.poses.length > 0) {
            handlePoseDetect(results.poses[0].landmarks);
            drawSkeletons(results.poses[0].landmarks);
          }
        }
      });

      await detectorRef.current.initialize();
      if (videoRef.current) {
        detectorRef.current.start(videoRef.current);
      }
    };

    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
    };
  }, []);

  // 使用 ref 儲存 mutable 遊戲狀態，避免 MediaPipe callback 裡讀到 stale state
  const phaseRef = useRef<'LEARNING'|'CONTINUOUS'>('LEARNING');
  const poseIndexRef = useRef(0);
  const holdFramesRef = useRef(0);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(15);
  const lastFailedConditionsRef = useRef<string[]>([]);
  const lastLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  
  const recorderRef = useRef<PoseRecorder>(new PoseRecorder());
  
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // 連續模式倒數計時
  useEffect(() => {
    let timer: number;
    if (phase === 'CONTINUOUS') {
      timeLeftRef.current = 15;
      
      if (canvasRef.current) {
        recorderRef.current.startRecording(canvasRef.current);
      }
      
      timer = window.setInterval(() => {
        timeLeftRef.current -= 1;
        const currentT = timeLeftRef.current;
        setTimeLeft(currentT);

        // 每秒扣 5 點氣勢
        let currentScore = scoreRef.current;
        currentScore = Math.max(0, currentScore - 5);
        scoreRef.current = currentScore;
        setScore(currentScore);

        if (currentT <= 0) {
          clearInterval(timer);
          
          const finalScore = scoreRef.current;
          const currentSeq = ALL_SEQUENCES[levelId];
          
          recorderRef.current.stopRecording().then(({ videoBlob }) => {
            onFinishRef.current({ 
              score: finalScore || 0,
              passed: finalScore >= PASS_THRESHOLD,
              failedConditions: finalScore < PASS_THRESHOLD ? lastFailedConditionsRef.current : [],
              snapshotLandmarks: finalScore < PASS_THRESHOLD ? lastLandmarksRef.current : null,
              failedPose: finalScore < PASS_THRESHOLD && currentSeq ? currentSeq.poses[poseIndexRef.current] : null,
              videoBlob
            });
          }).catch(err => {
            console.error('Failed to stop recording:', err);
            onFinishRef.current({ 
              score: finalScore || 0,
              passed: finalScore >= PASS_THRESHOLD,
              failedConditions: finalScore < PASS_THRESHOLD ? lastFailedConditionsRef.current : [],
              snapshotLandmarks: finalScore < PASS_THRESHOLD ? lastLandmarksRef.current : null,
              failedPose: finalScore < PASS_THRESHOLD && currentSeq ? currentSeq.poses[poseIndexRef.current] : null
            });
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, levelId]);

  const handlePoseDetect = useCallback((landmarks: NormalizedLandmark[]) => {
    const currentSeq = ALL_SEQUENCES[levelId];
    if (!currentSeq) return;
    
    const currentPose = currentSeq.poses[poseIndexRef.current];
    const evalResult = evaluatePose(landmarks, currentPose);
    
    // 如果在連續模式，記錄這幀
    if (phaseRef.current === 'CONTINUOUS') {
      recorderRef.current.recordFrame(evalResult.score, landmarks, currentPose.name);
    }

    const isMatched = evalResult.score > 80;

    if (isMatched) {
      setFeedback('好！保持住！');
      holdFramesRef.current += 1;
      setHoldFrames(holdFramesRef.current);
    } else {
      setFeedback(evalResult.failedConditions[0] || '姿勢不對喔');
      holdFramesRef.current = 0;
      setHoldFrames(0);
      lastFailedConditionsRef.current = evalResult.failedConditions;
      lastLandmarksRef.current = landmarks;
    }

    const currentPhase = phaseRef.current;

    // 狀態機處理
    if (currentPhase === 'LEARNING') {
      if (holdFramesRef.current > REQUIRED_HOLD_FRAMES) {
        holdFramesRef.current = 0;
        setHoldFrames(0);
        
        // 進入下一個動作
        const nextIndex = poseIndexRef.current + 1;
        if (nextIndex < currentSeq.poses.length) {
          poseIndexRef.current = nextIndex;
          setPoseIndex(nextIndex);
          setFeedback(`很好！換下一個動作：${currentSeq.poses[nextIndex].name}`);
        } else {
          // 學習完畢，進入連續模式
          poseIndexRef.current = 0;
          setPoseIndex(0);
          phaseRef.current = 'CONTINUOUS';
          scoreRef.current = 50;
          setPhase('CONTINUOUS');
          setScore(50);
          setFeedback('完美！現在進入連續模式，跟著節奏連擊！');
        }
      }
    } else if (currentPhase === 'CONTINUOUS') {
      // 連續模式下，只需短暫判定即可進入下一個動作（模擬節奏感）
      if (holdFramesRef.current > 3) {
        holdFramesRef.current = 0;
        setHoldFrames(0);
        
        const newScore = Math.min(100, scoreRef.current + 10);
        scoreRef.current = newScore;
        
        const nextIndex = (poseIndexRef.current + 1) % currentSeq.poses.length;
        poseIndexRef.current = nextIndex;
        
        setCombo(c => c + 1);
        setScore(newScore);
        setPoseIndex(nextIndex);
      }
    }
  }, [levelId]);

  const drawSkeletons = (userLandmarks: NormalizedLandmark[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (videoRef.current) {
      // 繪製鏡像翻轉的視訊畫面到 Canvas，這樣錄影才能錄到人和背景
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const connections = [
      [11, 12], // 肩膀
      [11, 13], [13, 15], // 左臂
      [12, 14], [14, 16], // 右臂
      [11, 23], [12, 24], [23, 24], // 身體軀幹
      [23, 25], [25, 27], // 左腿
      [24, 26], [26, 28]  // 右腿
    ];

    const currentSeq = ALL_SEQUENCES[levelId];
    if (currentSeq) {
      const currentPose = currentSeq.poses[poseIndexRef.current];
      const targetLandmarks = generateMockTargetLandmarks(userLandmarks, currentPose.name);
      
      // 畫虛線目標骨架
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.setLineDash([10, 10]);
      connections.forEach(([i, j]) => {
        const lm1 = targetLandmarks[i];
        const lm2 = targetLandmarks[j];
        if (lm1 && lm2) {
          ctx.beginPath();
          ctx.moveTo((1 - lm1.x) * canvas.width, lm1.y * canvas.height);
          ctx.lineTo((1 - lm2.x) * canvas.width, lm2.y * canvas.height);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    }

    // 畫使用者骨架
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'white';
    connections.forEach(([i, j]) => {
      const lm1 = userLandmarks[i];
      const lm2 = userLandmarks[j];
      if (lm1 && lm2 && (lm1.visibility ?? 1) > 0.5 && (lm2.visibility ?? 1) > 0.5) {
        ctx.beginPath();
        // 轉換座標（因為影片有 scaleX(-1) 翻轉，所以 X 座標要鏡像）
        ctx.moveTo((1 - lm1.x) * canvas.width, lm1.y * canvas.height);
        ctx.lineTo((1 - lm2.x) * canvas.width, lm2.y * canvas.height);
        ctx.stroke();
      }
    });

    // 畫關節點
    ctx.fillStyle = '#DAA520'; // gold
    userLandmarks.forEach((lm, index) => {
      if ([11,12,13,14,15,16,23,24,25,26,27,28].includes(index) && (lm.visibility ?? 1) > 0.5) {
        ctx.beginPath();
        ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  return (
    <div className="w-full h-full bg-black relative flex flex-col">
      {/* 頂部 UI */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto p-3 bg-black/50 backdrop-blur rounded-full text-white hover:bg-[var(--color-culture-red)] transition-colors">
          <ChevronLeft />
        </button>

        {phase === 'CONTINUOUS' && (
          <div className="flex flex-col items-end">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">
              {timeLeft}
            </div>
            <div className="text-[var(--color-culture-gold)] font-bold text-xl mt-2 drop-shadow-md">
              COMBO {combo}
            </div>
          </div>
        )}
      </div>

      {/* 影像區塊 */}
      <div className="flex-1 relative overflow-hidden">
        <video 
          ref={videoRef} 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-0" 
          style={{ transform: 'scaleX(-1)' }}
          muted 
          playsInline 
        />
        <canvas 
          ref={canvasRef} 
          width={1280} 
          height={720} 
          className="absolute inset-0 w-full h-full object-cover z-10" 
        />

        {/* 右上角示範影片：根據 levelId 自動切換 */}
        <video
          key={demoVideo}
          src={demoVideo}
          className="absolute top-4 right-4 w-48 rounded-xl border-2 border-[var(--color-culture-gold)] z-30 shadow-lg"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      {/* 底部 UI */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--color-dark-surface)] to-transparent pt-20 pb-8 px-6 z-20">
        
        {/* 氣勢值進度條 */}
        {phase === 'CONTINUOUS' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm font-bold text-white mb-2 drop-shadow-md">
              <span>氣勢值</span>
              <span className={score >= PASS_THRESHOLD ? 'text-[var(--color-culture-gold)]' : 'text-[var(--color-culture-red)]'}>
                {score}%
              </span>
            </div>
            <div className="h-4 bg-gray-900/80 rounded-full border border-white/20 overflow-hidden backdrop-blur">
              <div 
                className={`h-full transition-all duration-300 ${score >= PASS_THRESHOLD ? 'bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-300' : 'bg-gradient-to-r from-[var(--color-culture-red)] to-red-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}

        {/* 提示訊息 */}
        <div className="bg-black/60 backdrop-blur-md border border-[var(--color-culture-gold)]/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(218,165,32,0.1)]">
          <h3 className="text-[var(--color-culture-gold)] text-sm font-bold tracking-widest mb-2">
            {phase === 'CONTINUOUS' ? '連續律動模式' : `定點學習 (${poseIndex + 1}/${targetSequence?.poses.length})`}
          </h3>
          <p className="text-white text-2xl font-bold">{feedback}</p>
          <p className="text-gray-400 text-sm mt-2">目標動作：{targetPose?.name}</p>
          
          {phase !== 'CONTINUOUS' && (
            <div className="mt-4 w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-ghost-cyan)] transition-all"
                style={{ width: `${Math.min(100, (holdFrames / REQUIRED_HOLD_FRAMES) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}