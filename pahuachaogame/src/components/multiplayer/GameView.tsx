import { useEffect, useRef, useState } from 'react';
import type { PlayerData } from '../../constants/players';
import { PoseDetector } from '../../core/PoseDetector';
import { GameEngine, type Note } from '../../core/GameEngine';
import { PoseRecorder } from '../../core/PoseRecorder';
import { evaluatePose } from '../../core/PoseEvaluator';
import { Synthesizer } from '../../core/Synthesizer';
import { ALL_POSES } from '../../constants/poses';

interface Props {
  p1: PlayerData;
  p2: PlayerData;
  song: string;
  difficulty: string;
  gameMode: 'versus' | 'coop';
  onGameOver: (report: any) => void;
  onExit: () => void;
}

export default function GameView({ difficulty, gameMode, onGameOver, onExit }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const synthRef = useRef<Synthesizer | null>(null);
  const recorderRef = useRef<PoseRecorder | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coopHp, setCoopHp] = useState(100);

  // Use refs to access latest state inside loops
  const notesRef = useRef<Note[]>([]);
  const p1ScoreRef = useRef(0);
  const p2ScoreRef = useRef(0);
  const comboRef = useRef(0);
  const coopHpRef = useRef(100);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    // 0. 初始化音效合成器
    const synth = new Synthesizer();
    synth.init();
    synthRef.current = synth;

    // 0.5 初始化錄影器
    const recorder = new PoseRecorder();
    recorderRef.current = recorder;

    // 1. 初始化 GameEngine
    const engine = new GameEngine({
      difficulty,
      onTick: (updatedNotes) => {
        notesRef.current = updatedNotes;
        setNotes(updatedNotes);
      },
      onNoteMiss: () => {
        setCombo(0);
        comboRef.current = 0;
        if (gameMode === 'coop' && !isGameOverRef.current) {
          const newHp = Math.max(0, coopHpRef.current - 10);
          coopHpRef.current = newHp;
          setCoopHp(newHp);
          if (newHp === 0) {
            triggerGameOver();
          }
        }
      }
    });
    engineRef.current = engine;
    engine.start();

    // 2. 初始化 PoseDetector (雙人)
    const detector = new PoseDetector({
      numPoses: 2,
      onResults: (results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !videoRef.current) return;

        // 繪製影像與骨架
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        results.poses.forEach((pose) => {
          // 強制分配: X較小的為P1(畫面左側)，較大為P2(右側)
          // 但由於鏡像，畫面左側實際上是 X 較大的。交由 detector 內部的 playerId 決定
          const color = pose.playerId === 1 ? '#EF4444' : '#3B82F6';
          
          let poseScoreForFrame = 0;
          let evaluatedPoseName: string | undefined;
          
          // 手動繪製骨架與關節
          const connections = [
            [11, 12], // 肩膀
            [11, 13], [13, 15], // 左手
            [12, 14], [14, 16], // 右手
            [11, 23], [12, 24], [23, 24], // 軀幹
            [23, 25], [25, 27], // 左腿
            [24, 26], [26, 28]  // 右腿
          ];

          ctx.lineWidth = 4;
          ctx.strokeStyle = color;
          connections.forEach(([i, j]) => {
            const lm1 = pose.landmarks[i];
            const lm2 = pose.landmarks[j];
            if (lm1 && lm2 && (lm1.visibility ?? 1) > 0.5 && (lm2.visibility ?? 1) > 0.5) {
              ctx.beginPath();
              ctx.moveTo((1 - lm1.x) * canvas.width, lm1.y * canvas.height);
              ctx.lineTo((1 - lm2.x) * canvas.width, lm2.y * canvas.height);
              ctx.stroke();
            }
          });

          ctx.fillStyle = 'white';
          pose.landmarks.forEach((lm, lmIndex) => {
            if ([11,12,13,14,15,16,23,24,25,26,27,28].includes(lmIndex) && (lm.visibility ?? 1) > 0.5) {
              ctx.beginPath();
              ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          });

          // 碰撞判定：檢查該玩家在「判定區(y: 70~100)」的音符
          const currentNotes = notesRef.current.filter(n => n.player === pose.playerId && !n.hasHit && n.y > 70 && n.y < 100);
          
          currentNotes.forEach(note => {
            const poseDef = ALL_POSES.find(p => p.name === note.poseName);
            if (poseDef) {
              const evalResult = evaluatePose(pose.landmarks, poseDef);
              
              if (evalResult.score > poseScoreForFrame) {
                poseScoreForFrame = evalResult.score;
                evaluatedPoseName = poseDef.name;
              }
              if (evalResult.score >= 80) {
                // 擊中！
                engine.hitNote(note.id);
                comboRef.current += 1;
                setCombo(comboRef.current);
                
                // 播放音效
                synthRef.current?.playCombo(comboRef.current);
                
                const addScore = 100 + comboRef.current * 10;
                if (pose.playerId === 1) {
                  p1ScoreRef.current += addScore;
                  setP1Score(p1ScoreRef.current);
                } else {
                  p2ScoreRef.current += addScore;
                  setP2Score(p2ScoreRef.current);
                }
              }
            }
          });

          // 記錄 P1 的骨架與當前得分（作為剪輯的依據）
          if (pose.playerId === 1 && recorderRef.current) {
             recorderRef.current.recordFrame(poseScoreForFrame || p1ScoreRef.current, pose.landmarks, evaluatedPoseName);
          }
        });
      }
    });

    detector.initialize().then(() => {
      if (videoRef.current) {
        detector.start(videoRef.current);
      }
      if (canvasRef.current) {
        recorder.startRecording(canvasRef.current);
      }
    });
    detectorRef.current = detector;

    // TODO: 定時結束遊戲
    const timer = setTimeout(() => {
      triggerGameOver();
    }, 60000); // 60秒一局

    const triggerGameOver = async () => {
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      
      let recordingData = null;
      if (recorderRef.current) {
        try {
          recordingData = await recorderRef.current.stopRecording();
        } catch (e) {
          console.error("Failed to stop recording", e);
        }
      }

      onGameOver({
        p1Score: p1ScoreRef.current,
        p2Score: p2ScoreRef.current,
        combo: comboRef.current,
        coopHp: coopHpRef.current,
        recordingData
      });
    };

    return () => {
      engine.stop();
      if (detectorRef.current) detectorRef.current.stop();
      clearTimeout(timer);
    };
  }, [difficulty, gameMode]);

  // handleGameOver is now internal to useEffect

  return (
    <div className="w-full h-full relative bg-gray-900 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white flex gap-8">
        <div className="bg-red-500/80 px-6 py-3 rounded-2xl border-2 border-red-300">
          <div className="text-sm font-bold text-red-100">P1 分數</div>
          <div className="text-3xl font-black">{p1Score}</div>
        </div>
        {gameMode === 'versus' && (
          <div className="bg-blue-500/80 px-6 py-3 rounded-2xl border-2 border-blue-300">
            <div className="text-sm font-bold text-blue-100">P2 分數</div>
            <div className="text-3xl font-black">{p2Score}</div>
          </div>
        )}
        {gameMode === 'coop' && (
          <div className="bg-green-500/80 px-6 py-3 rounded-2xl border-2 border-green-300">
            <div className="text-sm font-bold text-green-100">團隊生命</div>
            <div className="text-3xl font-black">{coopHp}%</div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 text-white text-right">
        <div className="text-4xl font-black text-yellow-400 italic drop-shadow-lg">{combo} COMBO!</div>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-800 rounded hover:bg-red-600 transition-colors">退出</button>
      </div>

      {/* 攝影機與骨架畫布 */}
      <video ref={videoRef} className="hidden" playsInline />
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        className="w-full h-full object-cover -scale-x-100"
      />

      {/* 音符軌道 (UI Overlay) */}
      <div className="absolute inset-0 pointer-events-none flex">
        {/* P1 軌道 (左半邊) */}
        <div className="flex-1 relative border-r-2 border-dashed border-white/20">
          {notes.filter(n => n.player === 1).map(note => (
            <div 
              key={note.id}
              className="absolute left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-red-400 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-200"
              style={{ top: `${note.y}%` }}
            >
              {note.poseName.split(' ')[0]}
            </div>
          ))}
          {/* P1 判定線 */}
          <div className="absolute bottom-[20%] left-0 w-full h-2 bg-red-500/50 shadow-[0_0_10px_red]"></div>
        </div>

        {/* P2 軌道 (右半邊) */}
        <div className="flex-1 relative">
          {notes.filter(n => n.player === 2).map(note => (
            <div 
              key={note.id}
              className="absolute left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-200"
              style={{ top: `${note.y}%` }}
            >
              {note.poseName.split(' ')[0]}
            </div>
          ))}
          {/* P2 判定線 */}
          <div className="absolute bottom-[20%] left-0 w-full h-2 bg-blue-500/50 shadow-[0_0_10px_blue]"></div>
        </div>
      </div>
    </div>
  );
}
