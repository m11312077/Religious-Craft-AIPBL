import { ChevronLeft, Camera, Activity, Info } from 'lucide-react';

interface Props {
  levelName: string;
  levelDesc: string;
  onStartPractice: () => void;
  onBack: () => void;
}

export default function Tutorial({ levelName, levelDesc, onStartPractice, onBack }: Props) {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-dark-surface)] text-white relative">
      {/* 頂部導覽 */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-black/50 backdrop-blur hover:bg-[var(--color-culture-red)] transition-colors"
        >
          <ChevronLeft />
        </button>
      </div>

      {/* 英雄區塊（佔上半部） */}
      <div className="relative h-2/5 min-h-[300px] w-full bg-gray-800 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-dark-surface)] z-10"></div>
        {/* 這裡未來可以放示範影片或圖片 */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <img 
            src="https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1280&auto=format&fit=crop" 
            alt="打花草示範" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        {/* 標題與獎勵 */}
        <div className="absolute bottom-6 left-8 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-culture-gold)]/20 text-[var(--color-culture-gold)] rounded-full text-sm font-bold mb-3 border border-[var(--color-culture-gold)]/30">
            <span>通關獎勵</span>
            <span>+150 點</span>
          </div>
          <h1 className="text-4xl font-black">{levelName}</h1>
        </div>
      </div>

      {/* 內容區塊（佔下半部，可滾動） */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-[var(--color-culture-gold)]">
              <Info size={20} />
              動作要領
            </h2>
            <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl">
              {levelDesc}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-culture-gold)]">
              <Activity size={20} />
              AI 評分機制
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <h3 className="font-bold mb-2 text-white">1. 動態殘影校正</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  畫面上會出現<span className="text-[var(--color-ghost-cyan)] font-bold">青色虛線的殘影</span>作為標準示範。請讓你的身體（白色實線）盡可能與殘影重疊。
                </p>
              </div>
              <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                <h3 className="font-bold mb-2 text-white">2. 連擊與氣勢衰退</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  在「連續模式」中，只要動作吻合就會增加 Combo 數並提升氣勢值。如果<span className="text-red-400">停滯過久，氣勢值會快速衰退</span>。
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[var(--color-dark-surface)] via-[var(--color-dark-surface)] to-transparent z-20">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button 
            onClick={onStartPractice}
            className="flex-1 bg-gradient-to-r from-[var(--color-culture-red)] to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(178,34,34,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            <Camera />
            開啟相機，開始挑戰
          </button>
        </div>
      </div>
    </div>
  );
}
