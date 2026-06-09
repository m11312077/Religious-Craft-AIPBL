import { useMemo, useState, useRef } from 'react';
import type { PlayerData } from '../../constants/players';
import { ALL_POSES } from '../../constants/poses';
import { computeJointAngles, compareAngles } from '../../core/PoseEvaluator';
import { PoseRecorder } from '../../core/PoseRecorder';
import { Trophy, Activity, AlertCircle, ArrowRight, Video, Download, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Props {
  mode: 'single' | 'multi'; 
  song?: string; 
  difficulty?: string; 
  gameMode?: 'versus' | 'coop';
  multiReport?: any; 
  p1?: PlayerData; 
  p2?: PlayerData;
  onRestart: () => void; 
  onBack: () => void;
}

export default function Summary({ p1, p2, gameMode, multiReport, onBack }: Props) {
  
  // 計算紅點功能 A：AI 角度比對分析
  const aiAnalysis = useMemo(() => {
    if (!multiReport?.recordingData?.frames) return null;
    
    const frames = multiReport.recordingData.frames as any[];
    // 找出得分最低且有特定動作目標的幀
    let worstFrame = null;
    let minScore = Infinity;
    
    for (const frame of frames) {
      if (frame.poseName && frame.score < minScore) {
        minScore = frame.score;
        worstFrame = frame;
      }
    }

    if (!worstFrame) return null;

    const targetPose = ALL_POSES.find(p => p.name === worstFrame.poseName);
    if (!targetPose || !targetPose.targetAngles) return null;

    const actualAngles = computeJointAngles(worstFrame.landmarks);
    const comparisons = compareAngles(actualAngles, targetPose.targetAngles);

    // 過濾出偏差大於 15 度的問題關節
    const issues = comparisons.filter(c => c.diff > 15);

    return {
      poseName: targetPose.name,
      issues
    };
  }, [multiReport]);

  // FFmpeg 相關狀態 (紅點功能 B)
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const generateHighlight = async () => {
    if (!multiReport?.recordingData) return;
    
    setIsProcessing(true);
    setProgressMsg('啟動 AI 剪輯引擎 (FFmpeg.wasm)...');
    
    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        await ffmpeg.load();
      }

      // 找出最差的 5 秒區段
      const recorder = new PoseRecorder();
      const { worst } = recorder.findBestAndWorstSegments(multiReport.recordingData.frames);
      
      setProgressMsg(`處理影片段落 (${worst.startTime}s - ${worst.endTime}s)...`);
      
      // 寫入檔案
      const videoBlob = multiReport.recordingData.videoBlob;
      await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));

      // 執行剪輯，並加上 "AI 分析" 浮水印
      // 使用 libx264 進行轉碼以確保能使用 filter
      // 注意：client side 轉碼較慢，為示範 MVP 僅剪 5 秒
      const duration = (worst.endTime - worst.startTime).toFixed(2);
      
      setProgressMsg('AI 算圖中，請稍候...');
      await ffmpeg.exec([
        '-ss', worst.startTime.toString(),
        '-i', 'input.webm',
        '-t', duration,
        '-c:v', 'libx264', // 使用相容性更好的 libx264
        '-preset', 'ultrafast', // 加速轉碼
        '-b:v', '1M',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
      setHighlightUrl(url);
      
    } catch (e) {
      console.error(e);
      setProgressMsg('剪輯失敗');
    } finally {
      if (progressMsg !== '剪輯失敗') {
        setIsProcessing(false);
      }
    }
  };

  const handleShare = async () => {
    if (!highlightUrl) return;
    try {
      // 嘗試抓取影片 Blob
      const response = await fetch(highlightUrl);
      const blob = await response.blob();
      const file = new File([blob], 'AI_Highlight.mp4', { type: 'video/mp4' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '我的打花草 AI 抓漏短影音',
          text: '快來看看我被 AI 抓到的漏網鏡頭！',
          files: [file]
        });
      } else {
        alert('您的裝置或瀏覽器不支援直接分享檔案，請先點擊下載再手動分享至 IG/FB！');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const p1Score = multiReport?.p1Score || 0;
  const p2Score = multiReport?.p2Score || 0;
  const combo = multiReport?.combo || 0;
  
  let winnerText = '平手';
  if (gameMode === 'versus') {
    if (p1Score > p2Score) winnerText = `${p1?.name} 獲勝！`;
    else if (p2Score > p1Score) winnerText = `${p2?.name} 獲勝！`;
  }

  return (
    <div className="w-full h-full flex flex-col items-center bg-gray-900 p-8 overflow-y-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-[var(--color-culture-gold)] drop-shadow-md mb-2">
          演練結算
        </h1>
        <p className="text-xl text-gray-400">雙人陣頭大會串</p>
      </div>

      <div className="flex w-full max-w-5xl gap-8">
        {/* 左側：比分與結果 */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-gray-800 rounded-3xl p-8 border-4 border-gray-700 text-center relative overflow-hidden">
            {gameMode === 'versus' ? (
              <>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
                <h2 className="text-3xl font-bold text-white mb-6 flex justify-center items-center gap-4">
                  <Trophy className="text-yellow-400" size={36} /> {winnerText}
                </h2>
                <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl">
                  <div className="text-left">
                    <div className="text-red-400 font-bold text-lg">{p1?.name}</div>
                    <div className="text-4xl font-black text-white">{p1Score}</div>
                  </div>
                  <div className="text-4xl font-black text-gray-600">VS</div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold text-lg">{p2?.name}</div>
                    <div className="text-4xl font-black text-white">{p2Score}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-white mb-6">
                  {multiReport?.coopHp > 0 ? '合作模式完成！' : '挑戰失敗...'}
                </h2>
                <div className={`text-6xl font-black mb-2 ${multiReport?.coopHp > 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {multiReport?.coopHp}%
                </div>
                <div className="text-gray-400 font-bold">團隊剩餘生命值</div>
              </>
            )}
            
            <div className="mt-6 flex justify-center gap-8 text-gray-300">
              <div className="text-center">
                <div className="text-sm">最高連擊</div>
                <div className="text-2xl font-bold text-yellow-400">{combo} Combo</div>
              </div>
            </div>
          </div>

          <button 
            onClick={onBack}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            回到大廳 <ArrowRight />
          </button>
        </div>

        {/* 右側：紅點功能 A (AI 分析) */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-3xl p-8 border-2 border-red-500/30 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="text-red-400" /> AI 動作深度分析 (P1)
            </h2>
            <p className="text-gray-400 text-sm mb-6">🔴 透過錄影軌跡分析角度落差最大的瞬間</p>

            {aiAnalysis ? (
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">最需改善的舞步：</div>
                  <div className="text-xl font-bold text-white">{aiAnalysis.poseName}</div>
                </div>

                <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-700 overflow-y-auto">
                  <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> 關節角度誤差檢出
                  </h3>
                  {aiAnalysis.issues.length > 0 ? (
                    <div className="space-y-3">
                      {aiAnalysis.issues.map((issue, idx) => (
                        <div key={idx} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                          <span className="font-bold text-white capitalize">{issue.angleName}</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400">標準 {issue.target}°</span>
                            <span className="text-red-400 font-bold">實際 {issue.actual}°</span>
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded">
                              差 {issue.diff}°
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-green-400 font-bold text-center mt-8">
                      太棒了！你的動作角度非常標準！
                    </div>
                  )}
                </div>
                
                <div className="mt-4 p-4 bg-[var(--color-culture-gold)]/10 border border-[var(--color-culture-gold)] rounded-xl">
                  <p className="text-sm text-yellow-100 leading-relaxed mb-4">
                    💡 <strong>AI 導師建議：</strong><br/>
                    這段【{aiAnalysis.poseName}】跳得有點走味，主要問題出在你的關節伸展不夠開。記得打花草時，肢體要放開才會有陣頭的氣勢！
                  </p>
                  
                  {/* 紅點功能 B & C: 自動剪輯與分享 */}
                  {!highlightUrl ? (
                    <button 
                      onClick={generateHighlight}
                      disabled={isProcessing}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <><Loader2 className="animate-spin" /> {progressMsg}</>
                      ) : (
                        <><Video /> 產生 AI 抓漏短影音</>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <video src={highlightUrl} controls className="w-full rounded-lg border-2 border-red-500" autoPlay loop muted />
                      <div className="flex gap-2">
                        <a 
                          href={highlightUrl} 
                          download="AI_Highlight.mp4"
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                          <Download size={20} /> 下載
                        </a>
                        <button 
                          onClick={handleShare}
                          className="flex-1 py-3 bg-[var(--color-culture-gold)] hover:brightness-110 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                          分享至 IG (Reels)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">
                無足夠的分析資料
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
