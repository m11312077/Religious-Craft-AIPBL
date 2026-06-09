import type { NormalizedLandmark, PoseDefinition } from '../constants/poses';

export interface EvaluationResult {
  score: number; // 0 to 100
  failedConditions: string[];
}

export interface AngleComparison {
  angleName: string;
  actual: number;
  target: number;
  diff: number;
}

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

/**
 * 評估玩家骨架是否符合目標舞步
 */
export function evaluatePose(landmarks: NormalizedLandmark[], poseDef: PoseDefinition): EvaluationResult {
  if (!landmarks || landmarks.length === 0) {
    return { score: 0, failedConditions: ['No landmarks detected'] };
  }

  let totalScore = 0;
  const failedConditions: string[] = [];

  for (const cond of poseDef.conditions) {
    const conditionScore = cond.evaluate(landmarks);
    totalScore += conditionScore;
    
    // 如果單項得分低於 0.6，視為未通過該條件
    if (conditionScore < 0.6) {
      failedConditions.push(cond.errorMessage);
    }
  }

  const averageScore = totalScore / poseDef.conditions.length;
  return {
    score: Math.round(averageScore * 100),
    failedConditions
  };
}

/**
 * 計算全身主要關節的角度（用於紅點 A 分析）
 */
export function computeJointAngles(lm: NormalizedLandmark[]): Record<string, number> {
  return {
    leftElbow: angle3(lm[11], lm[13], lm[15]),
    rightElbow: angle3(lm[12], lm[14], lm[16]),
    leftKnee: angle3(lm[23], lm[25], lm[27]),
    rightKnee: angle3(lm[24], lm[26], lm[28]),
    leftShoulder: angle3(lm[23], lm[11], lm[13]),
    rightShoulder: angle3(lm[24], lm[12], lm[14]),
    leftHip: angle3(lm[11], lm[23], lm[25]),
    rightHip: angle3(lm[12], lm[24], lm[26]),
  };
}

/**
 * 比對實際角度與舞步的標準角度
 */
export function compareAngles(actualAngles: Record<string, number>, targetAngles: Record<string, number>): AngleComparison[] {
  const comparisons: AngleComparison[] = [];
  
  for (const [joint, targetVal] of Object.entries(targetAngles)) {
    const actualVal = actualAngles[joint];
    if (actualVal !== undefined) {
      comparisons.push({
        angleName: joint,
        actual: Math.round(actualVal),
        target: targetVal,
        diff: Math.abs(Math.round(actualVal) - targetVal)
      });
    }
  }
  
  return comparisons;
}

/**
 * 根據失敗條件產生語音回饋文字
 */
export function generateFeedbackText(failedConditions: string[]): string {
  if (failedConditions.length === 0) {
    return '做得很好！姿勢很標準！';
  }
  // 取第一個失敗的條件作為主要回饋
  return failedConditions[0];
}

/**
 * 根據動作名稱與使用者的骨架，產生相對應的目標骨架（供 UI 顯示使用）
 */
export function generateMockTargetLandmarks(userLandmarks: NormalizedLandmark[], poseName: string): NormalizedLandmark[] {
  const mockTargetLandmarks = userLandmarks.map(lm => ({...lm}));
  
  if (poseName.includes('拍腿')) {
    mockTargetLandmarks[15].y = 0.8; // 大腿高度
    mockTargetLandmarks[16].y = 0.8; 
    if (poseName.includes('左手')) mockTargetLandmarks[16].y = 0.5; // 右手休息
    if (poseName.includes('右手')) mockTargetLandmarks[15].y = 0.5; // 左手休息
  } else if (poseName.includes('拍肩')) {
    mockTargetLandmarks[15].y = 0.3; // 肩膀高度
    mockTargetLandmarks[16].y = 0.3;
    // 雙手交叉
    mockTargetLandmarks[15].x = mockTargetLandmarks[12] ? mockTargetLandmarks[12].x : 0.6;
    mockTargetLandmarks[16].x = mockTargetLandmarks[11] ? mockTargetLandmarks[11].x : 0.4;
  } else if (poseName.includes('拍胸')) {
    mockTargetLandmarks[15].y = 0.4; // 胸部高度
    mockTargetLandmarks[16].y = 0.4;
  } else if (poseName.includes('合拍')) {
    mockTargetLandmarks[15].y = 0.4;
    mockTargetLandmarks[16].y = 0.4;
    const midX = mockTargetLandmarks[11] && mockTargetLandmarks[12] 
      ? (mockTargetLandmarks[11].x + mockTargetLandmarks[12].x) / 2 
      : 0.5;
    mockTargetLandmarks[15].x = midX;
    mockTargetLandmarks[16].x = midX;
  }

  return mockTargetLandmarks;
}
