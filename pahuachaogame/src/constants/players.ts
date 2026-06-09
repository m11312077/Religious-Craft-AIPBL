/**
 * 玩家資料庫模擬
 */

export interface PlayerHistory {
  id: number;
  song: string;
  score: number;
  syncRate: number;
  date: string;
}

export interface PlayerStats {
  rhythm: number;
  flexibility: number;
  strength: number;
  coordination: number;
  humor: number;
}

export interface PlayerData {
  name: string;
  level: number;
  avatar: string;
  history: PlayerHistory[];
  stats: PlayerStats;
}

export const PLAYERS_DB: Record<string, PlayerData> = {
  player1: {
    name: '阿金 (金門少年)',
    level: 12,
    avatar: '🤵',
    history: [
      { id: 1, song: '打花草：花婆逗趣步', score: 8900, syncRate: 85, date: '2026-05-30' },
      { id: 2, song: '打花草：鄭元和落難身段', score: 9200, syncRate: 91, date: '2026-05-28' },
      { id: 3, song: '金門迎城隍：傳統三步推', score: 7850, syncRate: 74, date: '2026-05-20' },
    ],
    stats: {
      rhythm: 92,
      flexibility: 85,
      strength: 78,
      coordination: 88,
      humor: 95,
    },
  },
  player2: {
    name: '小門 (藝陣傳人)',
    level: 15,
    avatar: '👵',
    history: [
      { id: 1, song: '打花草：花婆逗趣步', score: 9650, syncRate: 94, date: '2026-05-31' },
      { id: 2, song: '打花草：鄭元和落難身段', score: 8800, syncRate: 82, date: '2026-05-27' },
      { id: 3, song: '廟會歡樂鑼鼓', score: 9400, syncRate: 90, date: '2026-05-22' },
    ],
    stats: {
      rhythm: 88,
      flexibility: 95,
      strength: 72,
      coordination: 91,
      humor: 98,
    },
  },
};

export const PRAISE_LINES = [
  '水啦！這步跳得有夠美！',
  '太完美了，真有打花草的靈魂！',
  '好身段！節奏跟姿態抓得真準！',
  '妙極妙極，花婆都被你逗樂了！',
  '讚啦！力道跟身段都是一等一！',
];

export function getStars(score: number): number {
  if (score >= 12000) return 5;
  if (score >= 8000) return 4;
  if (score >= 5000) return 3;
  if (score >= 2000) return 2;
  return 1;
}
