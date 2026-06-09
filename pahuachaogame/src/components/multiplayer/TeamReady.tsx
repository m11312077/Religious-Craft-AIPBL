import type { PlayerData } from '../../constants/players';
import { Users, UserCheck, Play, ArrowLeft } from 'lucide-react';

interface Props {
  p1: PlayerData; 
  p2: PlayerData; 
  roomCode: string; 
  gameMode: string;
  selectedSong: string; 
  difficulty: string;
  isReadyP1: boolean; 
  setIsReadyP1: (r: boolean) => void;
  isReadyP2: boolean; 
  setIsReadyP2: (r: boolean) => void;
  onBack: () => void; 
  onStart: () => void;
}

export default function TeamReady({
  p1, p2, gameMode, selectedSong, difficulty,
  isReadyP1, setIsReadyP1,
  isReadyP2, setIsReadyP2,
  onBack, onStart
}: Props) {
  if (!p1 || !p2) return null;

  const allReady = isReadyP1 && isReadyP2;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-dark-surface)] p-8">
      
      <button onClick={onBack} className="absolute top-8 left-8 p-4 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors">
        <ArrowLeft />
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-2">準備出陣</h1>
        <p className="text-xl text-gray-400">
          模式：{gameMode === 'versus' ? '陣頭競賽' : '雙人合作'} | 
          難度：{difficulty} | 
          曲目：{selectedSong}
        </p>
      </div>

      <div className="flex gap-16 w-full max-w-4xl mb-12">
        {/* P1 Ready Box */}
        <div className="flex-1 flex flex-col items-center">
          <div className={`w-full aspect-square rounded-3xl border-4 flex flex-col items-center justify-center transition-all ${isReadyP1 ? 'border-red-500 bg-red-500/20' : 'border-gray-700 bg-gray-800'}`}>
            <div className="text-6xl mb-4">{p1.avatar}</div>
            <div className="text-2xl font-bold text-white mb-2">{p1.name}</div>
            {isReadyP1 ? (
              <div className="flex items-center gap-2 text-red-400 font-bold text-xl animate-pulse">
                <UserCheck size={28} /> 已準備
              </div>
            ) : (
              <button 
                onClick={() => setIsReadyP1(true)}
                className="mt-4 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white transition-colors"
              >
                點擊準備
              </button>
            )}
          </div>
        </div>

        {/* P2 Ready Box */}
        <div className="flex-1 flex flex-col items-center">
          <div className={`w-full aspect-square rounded-3xl border-4 flex flex-col items-center justify-center transition-all ${isReadyP2 ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700 bg-gray-800'}`}>
            <div className="text-6xl mb-4">{p2.avatar}</div>
            <div className="text-2xl font-bold text-white mb-2">{p2.name}</div>
            {isReadyP2 ? (
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xl animate-pulse">
                <UserCheck size={28} /> 已準備
              </div>
            ) : (
              <button 
                onClick={() => setIsReadyP2(true)}
                className="mt-4 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white transition-colors"
              >
                點擊準備
              </button>
            )}
          </div>
        </div>
      </div>

      {allReady ? (
        <button 
          onClick={onStart}
          className="animate-fade-in flex items-center gap-2 px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-3xl rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 transition-transform"
        >
          <Play fill="currentColor" size={32} /> 正式開始
        </button>
      ) : (
        <div className="text-gray-500 font-bold text-xl flex items-center gap-2">
          <Users /> 等待雙方傳承者準備...
        </div>
      )}

    </div>
  );
}
