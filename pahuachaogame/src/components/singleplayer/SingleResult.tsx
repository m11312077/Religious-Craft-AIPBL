import { useEffect } from 'react';
import { Trophy, RefreshCw, ChevronLeft, Share2, Download } from 'lucide-react';
import DiffViewer from './DiffViewer';
import type { PracticeResult } from './Practice';

interface Props {
  result: PracticeResult;
  onRetry: () => void;
  onHome: () => void;
  onShare: () => void;
}

export default function SingleResult({ result, onRetry, onHome, onShare }: Props) {
  const { score, passed, failedConditions, snapshotLandmarks, failedPose } = result;

  useEffect(() => {
    // 語音播報分析結果
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // 停止先前的播報
      let text = passed 
        ? '完美！動作標準，氣勢十足！' 
        : '差一點！多練習幾次，你一定能掌握訣竅。';
      
      if (!passed && failedConditions.length > 0) {
        text += ' 系統建議：' + failedConditions.join('。');
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.1; // 稍微快一點點
      window.speechSynthesis.speak(utterance);
    }
  }, [passed, failedConditions]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-dark-surface)] overflow-y-auto">
      {/* 頂部導覽 */}
      <div className="w-full p-4 flex justify-between items-center z-20">
        <button 
          onClick={onHome}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
        >
          <ChevronLeft />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-8 pb-32">
        
        {/* 標題與星級 */}
        <div className="text-center mb-8 animate-fade-in">
          {passed ? (
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-[var(--color-culture-gold)] to-yellow-200 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(218,165,32,0.5)]">
              <Trophy size={48} className="text-gray-900" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-gray-700 to-gray-600 rounded-full flex items-center justify-center mb-4 border-4 border-gray-500">
              <RefreshCw size={40} className="text-gray-300" />
            </div>
          )}
          
          <h1 className="text-5xl font-black text-white mb-2">
            {passed ? '完美！🎉' : '差一點！💪'}
          </h1>
          <p className="text-xl text-gray-400">
            {passed ? '動作標準，氣勢十足！' : '再多練習幾次，你一定能掌握訣竅。'}
          </p>
        </div>

        {/* 分數卡片 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md text-center mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-gray-400 mb-2 font-bold tracking-widest">最終氣勢值</div>
          <div className={`text-6xl font-black mb-4 ${passed ? 'text-[var(--color-culture-gold)]' : 'text-white'}`}>
            {score}%
          </div>
          {passed && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full font-bold border border-green-500/30">
              <span>獲得傳承點數</span>
              <span>+150</span>
            </div>
          )}
        </div>

        {/* AI 差異分析 (只有失敗或分數不高時顯示) */}
        {!passed && failedPose && snapshotLandmarks && (
          <div className="w-full max-w-3xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-white mb-4 pl-4 border-l-4 border-[var(--color-culture-red)]">
              AI 動作分析：{failedPose.name}
            </h2>
            <DiffViewer 
              userLandmarks={snapshotLandmarks} 
              targetPose={failedPose} 
              failedConditions={failedConditions}
            />
          </div>
        )}

      </div>

      {/* 底部按鈕 */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[var(--color-dark-surface)] via-[var(--color-dark-surface)] to-transparent z-20">
        <div className="max-w-md mx-auto flex gap-2">
          <button 
            onClick={onRetry}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-2 rounded-xl transition-colors flex flex-col items-center justify-center gap-1 text-sm"
          >
            <RefreshCw size={20} />
            再試一次
          </button>
          
          {passed ? (
            <>
              {result.videoBlob && (
                <button 
                  onClick={() => {
                    const url = URL.createObjectURL(result.videoBlob!);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'AIPBL_Challenge.webm';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-2 rounded-xl shadow-lg transition-colors flex flex-col items-center justify-center gap-1 text-sm"
                >
                  <Download size={20} />
                  下載影片
                </button>
              )}
              <button 
                onClick={onShare}
                className="flex-1 bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-bold py-4 px-2 rounded-xl shadow-[0_0_15px_rgba(218,165,32,0.4)] transition-colors flex flex-col items-center justify-center gap-1 text-sm"
              >
                <Share2 size={20} />
                分享成就
              </button>
            </>
          ) : (
            <button 
              onClick={onHome}
              className="flex-1 bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-gray-900 font-bold py-4 px-2 rounded-xl shadow-[0_0_15px_rgba(218,165,32,0.4)] transition-colors flex flex-col items-center justify-center gap-1 text-sm"
            >
              回首頁
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
