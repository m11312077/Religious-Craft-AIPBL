/**
 * 打花草舞步定義 — 關節目標與角度閾值
 *
 * MediaPipe Pose Landmarks 索引：
 *   0=鼻, 11=左肩, 12=右肩, 13=左肘, 14=右肘,
 *   15=左腕, 16=右腕, 23=左臀, 24=右臀,
 *   25=左膝, 26=右膝, 27=左踝, 28=右踝
 */

export interface PoseCondition {
  /** 條件描述（給開發者看） */
  description: string;
  /** 未通過時的播報文字 */
  errorMessage: string;
  /**
   * 判定函數，傳入 landmarks 後回傳 0~1 的匹配程度
   * 1 = 完全符合，0 = 完全不符合
   */
  evaluate: (lm: NormalizedLandmark[]) => number;
}

export interface PoseDefinition {
  name: string;
  player: 1 | 2;
  description: string;
  /** 每個子條件 */
  conditions: PoseCondition[];
  /** 標準關節角度（度），供紅點 A 角度比對用 */
  targetAngles: Record<string, number>;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// ── 工具函數 ──

/** 計算三點夾角（度） A-B-C，B 是關節點 */
function angle3(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2);
  if (magBA === 0 || magBC === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/** 兩點距離 */
function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** 肩寬（用於做比例參考） */
function shoulderWidth(lm: NormalizedLandmark[]): number {
  return dist(lm[11], lm[12]);
}

/** 將值映射到 0~1 範圍（越小越好） */
function closeness(actual: number, target: number, tolerance: number): number {
  const diff = Math.abs(actual - target);
  return Math.max(0, 1 - diff / tolerance);
}

// ── 舞步定義 ──

// === 個人練習：展臂揮動（高/低） ===
export const SOLO_POSES: PoseDefinition[] = [
  {
    name: '展臂低位',
    player: 1,
    description: '雙手下垂展開，手腕低於臀部',
    targetAngles: { leftElbow: 160, rightElbow: 160 },
    conditions: [
      {
        description: '左腕低於左臀',
        errorMessage: '左手還不夠低，試著將手腕放到臀部以下',
        evaluate: (lm) => lm[15].y > lm[23].y ? 1 : closeness(lm[15].y, lm[23].y + 0.05, 0.15),
      },
      {
        description: '右腕低於右臀',
        errorMessage: '右手還不夠低，試著將手腕放到臀部以下',
        evaluate: (lm) => lm[16].y > lm[24].y ? 1 : closeness(lm[16].y, lm[24].y + 0.05, 0.15),
      },
      {
        description: '手肘伸直',
        errorMessage: '手肘彎太多了，把手臂伸直',
        evaluate: (lm) => {
          const leftAngle = angle3(lm[11], lm[13], lm[15]);
          const rightAngle = angle3(lm[12], lm[14], lm[16]);
          return (closeness(leftAngle, 160, 40) + closeness(rightAngle, 160, 40)) / 2;
        },
      },
    ],
  },
  {
    name: '展臂高位',
    player: 1,
    description: '雙手高舉過頭，手腕高於肩膀',
    targetAngles: { leftElbow: 160, rightElbow: 160 },
    conditions: [
      {
        description: '左腕高於左肩',
        errorMessage: '左手舉得不夠高，試著超過肩膀',
        evaluate: (lm) => lm[15].y < lm[11].y ? 1 : closeness(lm[15].y, lm[11].y - 0.05, 0.15),
      },
      {
        description: '右腕高於右肩',
        errorMessage: '右手舉得不夠高，試著超過肩膀',
        evaluate: (lm) => lm[16].y < lm[12].y ? 1 : closeness(lm[16].y, lm[12].y - 0.05, 0.15),
      },
      {
        description: '手肘伸直',
        errorMessage: '手肘彎太多了，把手臂伸直',
        evaluate: (lm) => {
          const leftAngle = angle3(lm[11], lm[13], lm[15]);
          const rightAngle = angle3(lm[12], lm[14], lm[16]);
          return (closeness(leftAngle, 160, 40) + closeness(rightAngle, 160, 40)) / 2;
        },
      },
    ],
  },
];

// === 新增動作：打七響元素 ===
const CLAP: PoseDefinition = {
    name: '雙手拍胸',
    player: 1,
    description: '雙手合拍胸前',
    targetAngles: { leftElbow: 70, rightElbow: 70 },
    conditions: [
    {
      description: '雙手在胸前靠攏',
      errorMessage: '雙手沒有拍在一起',
      evaluate: (lm) => {
        const d = dist(lm[15], lm[16]);
        const sw = shoulderWidth(lm);
        // 放寬手腕的距離限制（考量手掌寬度與手指長度）
        const isClose = d < sw * 0.6 ? 1 : closeness(d, sw * 0.5, sw * 1.0);
        
        // 確保手是在胸前的高度
        const midY = (lm[15].y + lm[16].y) / 2;
        const shoulderY = (lm[11].y + lm[12].y) / 2;
        const hipY = (lm[23].y + lm[24].y) / 2;
        const isAtChest = midY > shoulderY - 0.2 && midY < hipY ? 1 : 0.2;
        
        return (isClose + isAtChest) / 2;
      }
    }
  ]
};

const PAT_THIGH_R: PoseDefinition = {
    name: '右手拍腿',
    player: 1,
    description: '右手拍打大腿',
    targetAngles: { rightElbow: 160, rightShoulder: 20 },
    conditions: [
    {
      description: '右手腕高度在大腿位置',
      errorMessage: '右手試著拍打大腿',
      evaluate: (lm) => {
        const hipY = lm[24].y;
        const kneeY = lm[26].y;
        return lm[16].y > hipY && lm[16].y < kneeY + 0.1 ? 1 : closeness(lm[16].y, (hipY+kneeY)/2, 0.2);
      }
    }
  ]
};

const PAT_THIGH_L: PoseDefinition = {
    name: '左手拍腿',
    player: 1,
    description: '左手拍打左大腿',
    targetAngles: { leftElbow: 160, leftShoulder: 20 },
    conditions: [
    {
      description: '左手腕高度在大腿位置',
      errorMessage: '左手試著拍打大腿',
      evaluate: (lm) => {
        const hipY = lm[23].y;
        const kneeY = lm[25].y;
        return lm[15].y > hipY && lm[15].y < kneeY + 0.1 ? 1 : closeness(lm[15].y, (hipY+kneeY)/2, 0.2);
      }
    }
  ]
};

const CROSS_SHOULDER_R: PoseDefinition = {
    name: '右手拍左肩',
    player: 1,
    description: '右手交錯拍打左肩',
    targetAngles: { rightElbow: 60, rightShoulder: 120 },
    conditions: [
    {
      description: '右手腕靠近左肩',
      errorMessage: '右手交叉拍向左肩',
      evaluate: (lm) => {
        const d = dist(lm[16], lm[11]);
        const sw = shoulderWidth(lm);
        const distanceScore = d < sw * 0.6 ? 1 : closeness(d, sw * 0.4, sw * 1.0);
        return lm[16].y < lm[24].y - 0.2 ? distanceScore : 0.2; // 確保有抬手
      }
    }
  ]
};

const CROSS_SHOULDER_L: PoseDefinition = {
    name: '左手拍右肩',
    player: 1,
    description: '左手交錯拍打右肩',
    targetAngles: { leftElbow: 60, leftShoulder: 120 },
    conditions: [
    {
      description: '左手腕靠近右肩',
      errorMessage: '左手交叉拍向右肩',
      evaluate: (lm) => {
        const d = dist(lm[15], lm[12]);
        const sw = shoulderWidth(lm);
        const distanceScore = d < sw * 0.6 ? 1 : closeness(d, sw * 0.4, sw * 1.0);
        return lm[15].y < lm[23].y - 0.2 ? distanceScore : 0.2;
      }
    }
  ]
};

const PAT_CHEST_R: PoseDefinition = {
    name: '右手拍胸',
    player: 1,
    description: '右手拍打左側胸口',
    targetAngles: { rightElbow: 70 },
    conditions: [
    {
      description: '右手腕位於胸口位置',
      errorMessage: '右手要拍在胸前',
      evaluate: (lm) => {
        const targetY = (lm[11].y + lm[12].y) / 2 + 0.15;
        const yScore = closeness(lm[16].y, targetY, 0.3);
        const xOk = lm[16].x > Math.min(lm[11].x, lm[12].x) - 0.1 ? 1 : 0.5;
        return Math.min(1, yScore * xOk);
      }
    }
  ]
};

const PAT_CHEST_L: PoseDefinition = {
    name: '左手拍胸',
    player: 1,
    description: '左手拍打右側胸口',
    targetAngles: { leftElbow: 70 },
    conditions: [
    {
      description: '左手腕位於胸口位置',
      errorMessage: '左手要拍在胸前',
      evaluate: (lm) => {
        const targetY = (lm[11].y + lm[12].y) / 2 + 0.15;
        const yScore = closeness(lm[15].y, targetY, 0.3);
        const xOk = lm[15].x < Math.max(lm[11].x, lm[12].x) + 0.1 ? 1 : 0.5;
        return Math.min(1, yScore * xOk);
      }
    }
  ]
};

// === 花婆新增元素 ===
const POINT_MOLE_RIGHT: PoseDefinition = {
    name: '婆姐點痣(右)',
    player: 2,
    description: '向左移並用右手點痣',
    targetAngles: { rightElbow: 150, rightShoulder: 90 },
    conditions: [
    {
      description: '右手腕靠近右臉頰，重心左移',
      errorMessage: '右手指向右臉頰',
      evaluate: (lm) => {
        const d = dist(lm[16], lm[0]);
        const sw = shoulderWidth(lm);
        return d < sw * 0.4 ? 1 : closeness(d, sw * 0.2, sw * 0.5);
      }
    }
  ]
};

const POINT_MOLE_LEFT: PoseDefinition = {
    name: '婆姐點痣(左)',
    player: 2,
    description: '向右移並用左手點痣',
    targetAngles: { leftElbow: 150, leftShoulder: 90 },
    conditions: [
    {
      description: '左手腕靠近左臉頰',
      errorMessage: '左手指向左臉頰',
      evaluate: (lm) => {
        const d = dist(lm[15], lm[0]);
        const sw = shoulderWidth(lm);
        return d < sw * 0.4 ? 1 : closeness(d, sw * 0.2, sw * 0.5);
      }
    }
  ]
};

const TWIST_HIP_LEFT: PoseDefinition = {
  name: '媒婆扭臀',
  player: 2,
  description: '雙膝微彎，臀部向左側頂出，充滿喜感',
  targetAngles: { leftKnee: 140, rightKnee: 140 },
  conditions: [
    {
      description: '膝蓋微彎',
      errorMessage: '膝蓋再彎一點點',
      evaluate: (lm) => {
        const leftKnee = angle3(lm[23], lm[25], lm[27]);
        const rightKnee = angle3(lm[24], lm[26], lm[28]);
        const avg = (leftKnee + rightKnee) / 2;
        return avg < 160 ? 1 : closeness(avg, 140, 40);
      },
    },
    {
      description: '臀部 X 偏離肩膀中點（扭臀）',
      errorMessage: '臀部再扭過去一點，展現喜感！',
      evaluate: (lm) => {
        const shoulderMidX = (lm[11].x + lm[12].x) / 2;
        const hipMidX = (lm[23].x + lm[24].x) / 2;
        const offset = Math.abs(hipMidX - shoulderMidX);
        return offset > 0.04 ? Math.min(1, offset / 0.1) : closeness(offset, 0.07, 0.1);
      },
    },
  ],
};

const FLING_HANKY_RIGHT: PoseDefinition = {
  name: '花婆甩帕',
  player: 2,
  description: '右手高舉作甩手帕狀，左手叉腰',
  targetAngles: { rightElbow: 150, leftElbow: 80 },
  conditions: [
    {
      description: '右腕高舉過頭（高於鼻子）',
      errorMessage: '右手再舉高一點，想像在甩手帕',
      evaluate: (lm) => lm[16].y < lm[0].y ? 1 : closeness(lm[16].y, lm[0].y - 0.05, 0.15),
    },
    {
      description: '左腕貼近左臀（叉腰）',
      errorMessage: '左手放到腰上，做出叉腰的動作',
      evaluate: (lm) => {
        const d = dist(lm[15], lm[23]);
        const sw = shoulderWidth(lm);
        return d < sw * 0.4 ? 1 : closeness(d, sw * 0.2, sw * 0.5);
      },
    },
  ],
};

// ── 連續動作序列定義 ──
export interface PoseSequence {
  id: number;
  name: string;
  description: string;
  player: 1 | 2;
  poses: PoseDefinition[];
}

export const ALL_SEQUENCES: PoseSequence[] = [
  // 章節 1：鄭元和（基礎打七響篇）
  {
    id: 0,
    name: '雙手合拍與拍腿',
    description: '學習最基礎的節拍：雙手胸前合擊，接著右手拍右腿、左手拍左腿。',
    player: 1,
    poses: [CLAP, PAT_THIGH_R, PAT_THIGH_L]
  },
  {
    id: 1,
    name: '交錯拍肩',
    description: '學習肢體交錯：右手拍左肩、左手拍右肩。',
    player: 1,
    poses: [CROSS_SHOULDER_R, CROSS_SHOULDER_L]
  },
  {
    id: 2,
    name: '完整「打七響」',
    description: '經典七響串聯：合拍 → 右胸 → 左胸 → 右肩 → 左肩 → 右腿 → 左腿。',
    player: 1,
    poses: [
      CLAP, 
      PAT_CHEST_R, PAT_CHEST_L, 
      CROSS_SHOULDER_R, CROSS_SHOULDER_L, 
      PAT_THIGH_R, PAT_THIGH_L
    ]
  },
  
  // 章節 2：花婆與角色律動（逗趣動態篇）
  {
    id: 3,
    name: '招財點痣（動態）',
    description: '花婆標誌性的面部與手部特寫，左移並用右手點痣，接著換邊。',
    player: 2,
    poses: [POINT_MOLE_RIGHT, POINT_MOLE_LEFT]
  },
  {
    id: 4,
    name: '甩帕與扭臀結合',
    description: '花婆的經典動態，右手高舉甩帕並加上扭臀。',
    player: 2,
    poses: [FLING_HANKY_RIGHT, TWIST_HIP_LEFT]
  },
  {
    id: 5,
    name: '花婆動態連擊',
    description: '將點痣與甩帕扭臀連續組合。',
    player: 2,
    poses: [POINT_MOLE_RIGHT, FLING_HANKY_RIGHT, TWIST_HIP_LEFT]
  }
];

/** 所有獨立舞步合集（供 Multiplayer GameEngine 隨機生成音符使用） */
export const ALL_POSES = [
  CLAP, 
  PAT_THIGH_R, PAT_THIGH_L, 
  CROSS_SHOULDER_R, CROSS_SHOULDER_L, 
  PAT_CHEST_R, PAT_CHEST_L,
  POINT_MOLE_RIGHT, POINT_MOLE_LEFT, TWIST_HIP_LEFT, FLING_HANKY_RIGHT,
  ...SOLO_POSES
];
