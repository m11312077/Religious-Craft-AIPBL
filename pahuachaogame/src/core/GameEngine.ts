import { ALL_POSES } from '../constants/poses';

export interface Note {
  id: string;
  player: 1 | 2;
  poseName: string;
  y: number; // 0 to 100 (percentage from top)
  hasHit: boolean;
  spawnTime: number;
}

export interface GameEngineConfig {
  difficulty: string; // 'Easy' | 'Normal' | 'Hard'
  onNoteSpawn?: (note: Note) => void;
  onNoteMiss?: (note: Note) => void;
  onTick: (notes: Note[]) => void;
}

export class GameEngine {
  private config: GameEngineConfig;
  private isRunning = false;
  private isPaused = false;
  private notes: Note[] = [];
  private lastSpawnTime = 0;
  private animationFrameId = 0;
  private lastTickTime = 0;

  // Difficulty settings
  private spawnIntervalMs: number;
  private speedPixelsPerMs: number;

  constructor(config: GameEngineConfig) {
    this.config = config;
    
    // 設定不同難度的參數
    switch (config.difficulty) {
      case 'Hard':
        this.spawnIntervalMs = 800;
        this.speedPixelsPerMs = 100 / 2000; // 跑完 100% 需 2 秒
        break;
      case 'Normal':
        this.spawnIntervalMs = 1400;
        this.speedPixelsPerMs = 100 / 3000; // 跑完 100% 需 3 秒
        break;
      case 'Easy':
      default:
        this.spawnIntervalMs = 2000;
        this.speedPixelsPerMs = 100 / 4000; // 跑完 100% 需 4 秒
        break;
    }
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.notes = [];
    this.lastSpawnTime = performance.now();
    this.lastTickTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTickTime = performance.now();
  }

  private loop = () => {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      const now = performance.now();
      const dt = now - this.lastTickTime;
      this.lastTickTime = now;

      // 1. 生成音符
      if (now - this.lastSpawnTime > this.spawnIntervalMs) {
        this.spawnNote(now);
        this.lastSpawnTime = now;
      }

      // 2. 更新音符位置
      for (let i = this.notes.length - 1; i >= 0; i--) {
        const note = this.notes[i];
        if (!note.hasHit) {
          note.y += this.speedPixelsPerMs * dt;
          
          // 如果音符超出畫面底部（110%），視為 Miss 並移除
          if (note.y > 110) {
            this.config.onNoteMiss?.(note);
            this.notes.splice(i, 1);
          }
        } else {
          // 如果已擊中，移除音符
          this.notes.splice(i, 1);
        }
      }

      // 3. 通知 UI 更新
      this.config.onTick([...this.notes]);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private spawnNote(now: number) {
    // 隨機選擇 P1 或 P2 的音符，然後隨機選擇該玩家的一個舞步
    const player = Math.random() > 0.5 ? 1 : 2;
    const playerPoses = ALL_POSES.filter(p => p.player === player);
    const pose = playerPoses[Math.floor(Math.random() * playerPoses.length)];

    const note: Note = {
      id: Math.random().toString(36).substring(2, 9),
      player,
      poseName: pose.name,
      y: -10, // 從畫面上方外部開始
      hasHit: false,
      spawnTime: now
    };

    this.notes.push(note);
    this.config.onNoteSpawn?.(note);
  }

  // 外部呼叫以標記音符被擊中
  hitNote(noteId: string) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.hasHit = true;
    }
  }
}
