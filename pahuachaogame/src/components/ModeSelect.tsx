import { User, Users } from 'lucide-react';
import cuteImg from '../assets/cute.png';

interface Props {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
}

export default function ModeSelect({ onSelectSingle, onSelectMulti }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
      {/* 背景圖片 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={cuteImg}
          alt="背景"
          className="w-full h-full object-cover opacity-20"
        />
        {/* 背景遮罩，讓前景內容清晰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
      </div>

      {/* 背景裝飾光暈 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-culture-red)] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-culture-gold)] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      {/* 標題區 */}
      <div className="text-center mb-16 z-10 animate-fade-in">
        <div className="text-6xl mb-4 animate-pulse-glow inline-block rounded-full p-4 bg-white/5">🏮</div>
        <h1 className="text-5xl font-black mb-4 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-200">
          金門打花草
        </h1>
        <p className="text-xl text-gray-400 tracking-widest font-medium">AI 陣頭傳承</p>
      </div>

      {/* 選擇卡片區 */}
      <div className="flex gap-8 max-w-4xl w-full z-10">
        {/* 單人練習 */}
        <button
          onClick={onSelectSingle}
          className="flex-1 group relative p-1 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-300 hover:scale-105 hover:from-[var(--color-culture-red)] hover:to-red-900 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300"></div>
          <div className="relative h-full bg-[var(--color-dark-surface)]/90 backdrop-blur-sm p-8 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-6">
            <div className="p-6 rounded-full bg-gray-800/50 group-hover:bg-[var(--color-culture-red)]/20 transition-colors">
              <User size={48} className="text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3 text-white">單人練習</h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                跟著 AI 教練學習打花草的基礎與進階舞步
              </p>
            </div>
          </div>
        </button>

        {/* 組隊練習 */}
        <button
          onClick={onSelectMulti}
          className="flex-1 group relative p-1 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-300 hover:scale-105 hover:from-[var(--color-culture-gold)] hover:to-yellow-700 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300"></div>
          <div className="relative h-full bg-[var(--color-dark-surface)]/90 backdrop-blur-sm p-8 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-6">
            <div className="p-6 rounded-full bg-gray-800/50 group-hover:bg-[var(--color-culture-gold)]/20 transition-colors">
              <Users size={48} className="text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3 text-white">組隊練習</h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                與夥伴一起挑戰打花草雙人舞步
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}