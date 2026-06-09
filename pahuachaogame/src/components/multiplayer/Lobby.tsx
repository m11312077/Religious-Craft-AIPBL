import type { PlayerData } from '../../constants/players';
import RadarChart from '../common/RadarChart';
import { ArrowRight, Swords, Users, Music, Trophy, ChevronLeft } from 'lucide-react';

interface Props {
  p1: PlayerData;
  p2: PlayerData;
  onNext: () => void;
  selectedSong: string;
  setSelectedSong: (s: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  gameMode: string;
  setGameMode: (m: 'versus' | 'coop') => void;
  onBackToModeSelect: () => void;
}

const SONGS = [
  { id: 'song1', name: '打花草：花婆逗趣步', desc: '花婆與媒婆的經典律動' },
  { id: 'song2', name: '打花草：鄭元和落難身段', desc: '考驗節奏與肢體協調的打七響' },
  { id: 'song3', name: '金門迎城隍：傳統三步推', desc: '經典陣頭步伐體驗' },
];

export default function Lobby({
  p1, p2, onNext,
  selectedSong, setSelectedSong,
  difficulty, setDifficulty,
  gameMode, setGameMode,
  onBackToModeSelect
}: Props) {
  if (!p1 || !p2) return null;

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-dark-surface)] overflow-y-auto">
      {/* 標題區 */}
      <div className="w-full p-8 bg-gray-900 border-b border-gray-800 flex items-center relative">
        <button 
          onClick={onBackToModeSelect}
          className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white flex items-center gap-2 font-bold"
        >
          <ChevronLeft /> 回首頁
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-black text-white mb-2">陣頭大廳</h1>
          <p className="text-gray-400">雙方傳承者已就位，請進行對戰設定</p>
        </div>
      </div>

      <div className="flex-1 flex flex-row p-8 gap-8 max-w-6xl mx-auto w-full">
        {/* 左側：玩家狀態 */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-red-500/30 flex flex-col items-center">
            <div className="text-red-400 font-bold mb-2">P1 {p1.name}</div>
            <RadarChart stats={p1.stats} color="#EF4444" />
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">LV {p1.level}</span>
              <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">節奏達人</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-blue-500/30 flex flex-col items-center">
            <div className="text-blue-400 font-bold mb-2">P2 {p2.name}</div>
            <RadarChart stats={p2.stats} color="#3B82F6" />
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">LV {p2.level}</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">身段優美</span>
            </div>
          </div>
        </div>

        {/* 右側：設定區 */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* 模式選擇 */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-[var(--color-culture-gold)]" /> 演練模式
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setGameMode('versus')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'versus' ? 'border-[var(--color-culture-gold)] bg-[var(--color-culture-gold)]/10 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                <Swords size={32} />
                <span className="font-bold">陣頭競賽 (Versus)</span>
                <span className="text-xs opacity-70">各自計分，一較高下</span>
              </button>
              <button
                onClick={() => setGameMode('coop')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'coop' ? 'border-green-500 bg-green-500/10 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                <Users size={32} />
                <span className="font-bold">雙人合作 (Co-op)</span>
                <span className="text-xs opacity-70">共享生命條，默契考驗</span>
              </button>
            </div>
          </div>

          {/* 曲目與難度 */}
          <div className="bg-gray-800 rounded-2xl p-6 flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="text-[var(--color-ghost-cyan)]" /> 挑戰曲目
            </h2>
            <div className="space-y-3 flex-1">
              {SONGS.map(song => (
                <div 
                  key={song.id}
                  onClick={() => setSelectedSong(song.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedSong === song.id ? 'border-[var(--color-ghost-cyan)] bg-[var(--color-ghost-cyan)]/10' : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                >
                  <div className="font-bold text-white">{song.name}</div>
                  <div className="text-sm text-gray-400">{song.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center bg-gray-900 p-4 rounded-xl">
              <span className="text-gray-400 font-bold">難度選擇</span>
              <div className="flex bg-gray-800 rounded-lg p-1">
                {['Easy', 'Normal', 'Hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-2 rounded-md font-bold transition-all ${difficulty === d ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onNext}
            className="w-full py-4 bg-gradient-to-r from-[var(--color-culture-gold)] to-yellow-600 text-gray-900 font-black text-xl rounded-2xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            前進準備室 <ArrowRight />
          </button>

        </div>
      </div>
    </div>
  );
}
