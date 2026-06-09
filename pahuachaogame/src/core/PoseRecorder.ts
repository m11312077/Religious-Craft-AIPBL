import type { NormalizedLandmark } from '../constants/poses';

export interface RecordedFrame {
  timestamp: number;
  score: number;
  landmarks: NormalizedLandmark[];
  poseName?: string;
}

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export class PoseRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private frames: RecordedFrame[] = [];
  private startTime = 0;
  private isRecording = false;

  startRecording(canvas: HTMLCanvasElement) {
    this.recordedChunks = [];
    this.frames = [];
    this.startTime = performance.now();
    this.isRecording = true;

    try {
      // 30 fps
      const stream = canvas.captureStream(30);
      
      // Use webm format
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // collect 100ms chunks
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e);
    }
  }

  recordFrame(score: number, landmarks: NormalizedLandmark[], poseName?: string) {
    if (!this.isRecording) return;
    
    // Deep copy landmarks to prevent modification
    const landmarksCopy = landmarks.map(lm => ({...lm}));
    
    this.frames.push({
      timestamp: performance.now() - this.startTime,
      score,
      landmarks: landmarksCopy,
      poseName
    });
  }

  stopRecording(): Promise<{ videoBlob: Blob, frames: RecordedFrame[] }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.isRecording = false;

      this.mediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve({
          videoBlob,
          frames: this.frames
        });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        resolve({
          videoBlob: new Blob(this.recordedChunks, { type: 'video/webm' }),
          frames: this.frames
        });
      }
    });
  }

  /**
   * 找出得分最高和最低的時間區間（預設 5 秒）
   * 算法：滑動視窗計算平均分
   */
  findBestAndWorstSegments(frames: RecordedFrame[], segmentDurationMs = 5000): { best: TimeRange, worst: TimeRange } {
    if (frames.length === 0) {
      return {
        best: { startTime: 0, endTime: segmentDurationMs },
        worst: { startTime: 0, endTime: segmentDurationMs }
      };
    }

    const totalDuration = frames[frames.length - 1].timestamp;
    if (totalDuration <= segmentDurationMs) {
      return {
        best: { startTime: 0, endTime: totalDuration / 1000 },
        worst: { startTime: 0, endTime: totalDuration / 1000 }
      };
    }

    let maxScore = -1;
    let minScore = Infinity;
    let bestStart = 0;
    let worstStart = 0;

    // 滑動視窗
    for (let i = 0; i < frames.length; i++) {
      const startFrame = frames[i];
      let windowSum = 0;
      let windowCount = 0;
      
      // 計算從這個 frame 開始的 segmentDurationMs 內的平均分
      for (let j = i; j < frames.length; j++) {
        if (frames[j].timestamp - startFrame.timestamp <= segmentDurationMs) {
          windowSum += frames[j].score;
          windowCount++;
        } else {
          break;
        }
      }

      if (windowCount > 0) {
        const avgScore = windowSum / windowCount;
        if (avgScore > maxScore) {
          maxScore = avgScore;
          bestStart = startFrame.timestamp;
        }
        if (avgScore < minScore) {
          minScore = avgScore;
          worstStart = startFrame.timestamp;
        }
      }
    }

    return {
      best: { startTime: Math.max(0, bestStart / 1000), endTime: (bestStart + segmentDurationMs) / 1000 },
      worst: { startTime: Math.max(0, worstStart / 1000), endTime: (worstStart + segmentDurationMs) / 1000 }
    };
  }
}
