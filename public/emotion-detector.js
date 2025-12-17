/**
 * Emotion Detection using face-api.js
 * Detects emotion from webcam and provides personalized greetings
 */

class EmotionDetector {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.modelsLoaded = false;
    this.detectionInterval = null;
    this.currentEmotion = null;
    this.emotionHistory = [];
    this.emotionUpdateCallback = null;
  }

  /**
   * Load face-api.js models
   */
  async loadModels() {
    try {
      // Load models from CDN
      const MODEL_URL =
        "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/models/";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      this.modelsLoaded = true;
      console.log("✅ Emotion detection models loaded");
    } catch (error) {
      console.error("❌ Failed to load emotion models:", error);
      throw error;
    }
  }

  /**
   * Initialize webcam and start emotion detection
   */
  async initialize(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;

    try {
      // Load models if not already loaded
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });

      this.video.srcObject = stream;
      this.video.onloadedmetadata = () => {
        this.video.play();
        this.startDetection();
      };

      console.log("✅ Camera initialized");
    } catch (error) {
      console.error("❌ Camera access denied:", error);
      throw error;
    }
  }

  /**
   * Start continuous emotion detection
   */
  startDetection() {
    this.detectionInterval = setInterval(async () => {
      if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
        await this.detectEmotion();
      }
    }, 1000); // Detect every second
  }

  /**
   * Detect emotion from current video frame
   */
  async detectEmotion() {
    try {
      const detections = await faceapi
        .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.expressions) {
        // Get dominant emotion (highest confidence)
        const emotions = detections.expressions;
        const dominantEmotion = Object.entries(emotions).reduce(
          (prev, current) => (prev[1] > current[1] ? prev : current)
        );

        this.currentEmotion = dominantEmotion[0];
        this.emotionHistory.push({
          emotion: this.currentEmotion,
          confidence: dominantEmotion[1],
          timestamp: Date.now(),
        });

        // Keep last 30 detections
        if (this.emotionHistory.length > 30) {
          this.emotionHistory.shift();
        }

        // Call update callback if provided
        if (this.emotionUpdateCallback) {
          this.emotionUpdateCallback(this.currentEmotion, dominantEmotion[1]);
        }

        // Draw on canvas
        this.drawDetection(detections);
      }
    } catch (error) {
      console.error("Emotion detection error:", error);
    }
  }

  /**
   * Draw detection box and emotions on canvas
   */
  drawDetection(detections) {
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    const ctx = this.canvas.getContext("2d");

    // Draw video frame
    ctx.drawImage(this.video, 0, 0);

    // Draw face detection box
    if (detections.detection) {
      const box = detections.detection.box;
      ctx.strokeStyle = "#FF0084";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    // Draw emotions
    if (detections.expressions) {
      const topEmotions = Object.entries(detections.expressions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      ctx.fillStyle = "#00FF00";
      ctx.font = "12px Arial";
      ctx.fillText(
        `Emotion: ${topEmotions[0][0]} (${(topEmotions[0][1] * 100).toFixed(
          0
        )}%)`,
        10,
        20
      );

      topEmotions.forEach((emotion, i) => {
        ctx.fillText(
          `${emotion[0]}: ${(emotion[1] * 100).toFixed(0)}%`,
          10,
          35 + i * 15
        );
      });
    }
  }

  /**
   * Get current emotion
   */
  getEmotion() {
    return this.currentEmotion;
  }

  /**
   * Get average emotion from last N seconds
   */
  getAverageEmotion(seconds = 5) {
    const now = Date.now();
    const recentDetections = this.emotionHistory.filter(
      (d) => now - d.timestamp < seconds * 1000
    );

    if (recentDetections.length === 0) return null;

    const emotionCounts = {};
    recentDetections.forEach(({ emotion }) => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    return Object.entries(emotionCounts).reduce((prev, current) =>
      prev[1] > current[1] ? prev : current
    )[0];
  }

  /**
   * Get personalized greeting based on emotion
   */
  getPersonalizedGreeting(emotion = null) {
    const detectedEmotion = emotion || this.currentEmotion;

    const greetings = {
      happy:
        "Du siest glücklich aus! Schön, dass es dir gut geht! Wie kann ich dir heute helfen?",
      sad: "Du wirkst nachdenklich... Möchtest du mir etwas erzählen? Ich bin ganz Ohr!",
      angry:
        "Du siehst ernst aus. Vielleicht kann ich dir helfen, etwas zu verbessern?",
      fearful: "Du wirkst angespannt. Keine Sorge, ich bin hier um zu helfen!",
      disgusted:
        "Etwas gefällt dir nicht? Lass mich wissen, wie ich helfen kann!",
      surprised: "Überraschung! Wie geht es dir?",
      neutral: "Hallo! Schön, dich zu sehen. Wie kann ich dir heute helfen?",
      default: "Hallo! Schön, dich zu sehen. Wie kann ich dir heute helfen?",
    };

    return greetings[detectedEmotion] || greetings.default;
  }

  /**
   * Stop emotion detection and release camera
   */
  stop() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach((track) => track.stop());
    }
  }

  /**
   * Set callback for emotion updates
   */
  onEmotionUpdate(callback) {
    this.emotionUpdateCallback = callback;
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = EmotionDetector;
}
