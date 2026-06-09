import { Award, Lock, CheckCircle, ChevronRight, Play, ChevronLeft } from 'lucide-react';

interface Props {
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onBackToModeSelect: () => void;
}

export default function SingleHome({ completedLevels, onSelectLevel, onBackToModeSelect }: Props) {
  // 模擬進度資料
  const chapters = [
    {
      title: '章節 1：鄭元和（基礎打七響篇）',
      levels: [
        { id: 0, title: '1-1 雙手合拍與拍腿', desc: '學習最基礎的節拍，手眼協調', req: [] },
        { id: 1, title: '1-2 交錯拍肩', desc: '學習肢體交錯與律動', req: [0] },
        { id: 2, title: '1-3 完整「打七響」', desc: '挑戰將陣頭經典動作串聯', req: [1] },
      ]
    },
    {
      title: '章節 2：花婆與角色律動（逗趣動態篇）',
      levels: [
        { id: 3, title: '2-1 招財點痣（動態）', desc: '花婆標誌性的面部與手部特寫', req: [2] },
        { id: 4, title: '2-2 甩帕與扭臀結合', desc: '花婆的經典動態，訓練上半身延展', req: [3] },
        { id: 5, title: '2-3 花婆動態連擊', desc: '將點痣與甩帕扭臀連續組合', req: [4] },
      ]
    }
  ];

  const totalTasks = 6;
  const completedTasks = completedLevels.length;
  const progressPercent = (completedTasks / totalTasks) * 100;

  return (
    <div className="w-full h-full p-8 flex flex-col bg-gradient-to-br from-[var(--color-dark-surface)] to-gray-900 overflow-y-auto">
      {/* 頭部資訊區 */}
      <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md animate-fade-in">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToModeSelect}
            className="p-2 mr-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
            title="回到模式選擇"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-culture-red)] to-red-400 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(178,34,34,0.5)]">
            🌸
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">阿金 (個人練習)</h1>
            <p className="text-gray-400 text-sm">陣頭學徒</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-sm mb-1">累積傳承點數</div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-200 flex items-center gap-2 justify-end">
            <Award className="text-[var(--color-culture-gold)]" />
            {completedTasks * 100 + 50}
          </div>
        </div>
      </div>

      {/* 每日任務進度 */}
      <div className="mb-10 px-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300 font-medium">陣頭傳承進度</span>
          <span className="text-[var(--color-culture-gold)]">{completedTasks} / {totalTasks}</span>
        </div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-400 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 關卡列表區 */}
      <div className="flex-1 px-2 pb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {chapters.map((chapter, cIdx) => (
          <div key={cIdx} className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-[var(--color-culture-red)] pl-3">
              {chapter.title}
            </h2>
            <div className="grid gap-4 max-w-3xl">
              {chapter.levels.map((level) => {
                const isUnlocked = level.req.every(reqId => completedLevels.includes(reqId));
                const isCompleted = completedLevels.includes(level.id);
                
                return (
                  <button
                    key={level.id}
                    onClick={() => isUnlocked && onSelectLevel(level.id)}
                    disabled={!isUnlocked}
                    className={`w-full group relative overflow-hidden p-6 rounded-2xl border flex items-center transition-all duration-300
                      ${isUnlocked 
                        ? 'bg-gray-800/50 hover:bg-gray-700/50 border-white/10 hover:border-[var(--color-culture-gold)]/50 cursor-pointer' 
                        : 'bg-gray-900/50 border-transparent opacity-60 cursor-not-allowed'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-6 ${
                      isCompleted 
                        ? 'bg-green-500/20 text-green-400' 
                        : isUnlocked
                          ? 'bg-[var(--color-culture-red)]/20 text-[var(--color-culture-red)] group-hover:bg-[var(--color-culture-red)] group-hover:text-white transition-colors'
                          : 'bg-gray-800 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle /> : isUnlocked ? <Play className="ml-1" /> : <Lock />}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-white mb-1">{level.title}</h3>
                      <p className="text-gray-400 text-sm">{level.desc}</p>
                    </div>
                    
                    {!isUnlocked && (
                      <div className="text-xs px-3 py-1 bg-gray-800 rounded-full text-gray-400">
                        需先完成上一關
                      </div>
                    )}
                    {isUnlocked && (
                      <div className="text-gray-500 group-hover:text-white transition-colors">
                        <ChevronRight />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
