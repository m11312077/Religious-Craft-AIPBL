import { useState } from 'react';
import { PLAYERS_DB } from '../../constants/players';
import { UserPlus, QrCode, Play, ChevronLeft } from 'lucide-react';

interface Props {
  onLogin: (p1Key: string, p2Key: string) => void;
  onBackToModeSelect: () => void;
}

export default function Login({ onLogin, onBackToModeSelect }: Props) {
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);

  const handleStart = () => {
    if (p1 && p2) onLogin(p1, p2);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-8 space-y-8 relative">
      <button 
        onClick={onBackToModeSelect}
        className="absolute top-8 left-8 p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-white flex items-center justify-center"
        title="回到模式選擇"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">雙人連線模式</h1>
        <p className="text-gray-400">請兩位傳承者就位，準備開始打花草陣頭演練</p>
      </div>

      <div className="flex gap-8 w-full max-w-4xl">
        {/* Player 1 Panel */}
        <div className={`flex-1 rounded-2xl border-2 p-8 flex flex-col items-center justify-center transition-all ${p1 ? 'border-red-500 bg-red-500/10' : 'border-gray-700 bg-gray-800'}`}>
          <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 flex items-center justify-center text-4xl">
            {p1 ? PLAYERS_DB[p1].avatar : <UserPlus className="text-gray-400" size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {p1 ? PLAYERS_DB[p1].name : '玩家一 (P1)'}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {p1 ? `LV. ${PLAYERS_DB[p1].level} 傳承者` : '請選擇角色登入'}
          </p>
          {!p1 && (
            <div className="flex gap-2">
              <button onClick={() => setP1('player1')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors">
                選擇阿金
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 flex items-center gap-2 cursor-not-allowed">
                <QrCode size={16} /> 掃碼
              </button>
            </div>
          )}
        </div>

        {/* Player 2 Panel */}
        <div className={`flex-1 rounded-2xl border-2 p-8 flex flex-col items-center justify-center transition-all ${p2 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800'}`}>
          <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 flex items-center justify-center text-4xl">
            {p2 ? PLAYERS_DB[p2].avatar : <UserPlus className="text-gray-400" size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {p2 ? PLAYERS_DB[p2].name : '玩家二 (P2)'}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {p2 ? `LV. ${PLAYERS_DB[p2].level} 傳承者` : '請選擇角色登入'}
          </p>
          {!p2 && (
            <div className="flex gap-2">
              <button onClick={() => setP2('player2')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors">
                選擇小門
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 flex items-center gap-2 cursor-not-allowed">
                <QrCode size={16} /> 掃碼
              </button>
            </div>
          )}
        </div>
      </div>

      {p1 && p2 && (
        <button 
          onClick={handleStart}
          className="animate-fade-in flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xl rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Play fill="currentColor" /> 確認雙方登入，進入大廳
        </button>
      )}
    </div>
  );
}
