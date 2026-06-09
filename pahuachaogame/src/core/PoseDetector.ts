import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface DetectedPose {
  landmarks: NormalizedLandmark[];
  playerId: 1 | 2 | null;
}

export interface PoseDetectorConfig {
  numPoses: 1 | 2;
  onResults: (results: { poses: DetectedPose[] }) => void;
}

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isRunning = false;
  private videoElement: HTMLVideoElement | null = null;
  private config: PoseDetectorConfig;
  private lastVideoTime = -1;

  constructor(config: PoseDetectorConfig) {
    this.config = config;
  }

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: this.config.numPoses,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  async setNumPoses(num: 1 | 2) {
    this.config.numPoses = num;
    if (this.poseLandmarker) {
      await this.poseLandmarker.setOptions({ numPoses: num });
    }
  }

  async start(video: HTMLVideoElement) {
    this.videoElement = video;
    this.isRunning = true;
    
    // Request camera access if not already active
    if (!video.srcObject) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 }
        });
        video.srcObject = stream;
        video.play();
      } catch (err) {
        console.error('Camera permission denied or unavailable:', err);
        return;
      }
    }

    const detectLoop = () => {
      if (!this.isRunning || !this.videoElement || !this.poseLandmarker) return;

      const startTimeMs = performance.now();
      if (this.videoElement.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.videoElement.currentTime;
        
        const results = this.poseLandmarker.detectForVideo(this.videoElement, startTimeMs);
        
        if (results.landmarks) {
          const poses: DetectedPose[] = this.processResults(results.landmarks);
          this.config.onResults({ poses });
        }
      }

      requestAnimationFrame(detectLoop);
    };

    video.addEventListener('loadeddata', detectLoop);
    if (video.readyState >= 2) {
      detectLoop();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.videoElement?.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    this.videoElement = null;
  }

  private processResults(landmarksArray: NormalizedLandmark[][]): DetectedPose[] {
    // MediaPipe returns landmarks with same shape as our NormalizedLandmark interface
    const rawPoses = landmarksArray.map(lms => ({
      landmarks: lms,
      midX: (lms[11].x + lms[12].x) / 2 // Shoulder midpoint X
    }));

    if (this.config.numPoses === 1) {
      return rawPoses.map(p => ({
        landmarks: p.landmarks,
        playerId: 1 // In single player, always P1
      }));
    }

    if (this.config.numPoses === 2) {
      if (rawPoses.length === 1) {
        // Only one detected, maybe P1 or P2 depending on position, but let's default to P1 for now or based on X
        return [{
          landmarks: rawPoses[0].landmarks,
          playerId: rawPoses[0].midX < 0.5 ? 1 : 2
        }];
      } else if (rawPoses.length >= 2) {
        // Sort by X to determine left/right. Smaller X is left (P1)
        rawPoses.sort((a, b) => a.midX - b.midX);
        return [
          { landmarks: rawPoses[0].landmarks, playerId: 1 },
          { landmarks: rawPoses[1].landmarks, playerId: 2 }
        ];
      }
    }

    return [];
  }
}
