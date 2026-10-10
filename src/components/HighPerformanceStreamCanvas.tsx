import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, Eye, Zap, Sun, ShieldCheck } from 'lucide-react';

interface HighPerformanceStreamCanvasProps {
  stream: MediaStream | null;
  isMirrored?: boolean;
  showGuidelines?: boolean;
  showTelemetry?: boolean;
  className?: string;
  onMetricsUpdate?: (metrics: { fps: number; latencyMs: number; exposureScore: number }) => void;
}

export const HighPerformanceStreamCanvas: React.FC<HighPerformanceStreamCanvasProps> = ({
  stream,
  isMirrored = true,
  showGuidelines = true,
  showTelemetry = true,
  className = '',
  onMetricsUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Performance telemetry state
  const [fps, setFps] = useState<number>(60);
  const [latencyMs, setLatencyMs] = useState<number>(0.8);
  const [exposureScore, setExposureScore] = useState<number>(85); // 0 - 100
  const [exposureText, setExposureText] = useState<'Optimal' | 'Low Light' | 'High Glare'>('Optimal');
  const [hudVisible, setHudVisible] = useState<boolean>(showTelemetry);
  const [guidelinesVisible, setGuidelinesVisible] = useState<boolean>(showGuidelines);

  // Metrics calculation refs to prevent unneeded re-renders
  const frameTimesRef = useRef<number[]>([]);
  const lastMetricsUpdateRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Setup hidden video element stream binding
  useEffect(() => {
    const video = hiddenVideoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.play().catch(err => {
        console.warn('Video stream auto-play notice:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Main high-performance requestAnimationFrame render loop
  const startRenderPipeline = useCallback(() => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    if (!canvas || !video) return;

    // Use desynchronized canvas context to bypass browser compositor lag
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    if (!ctx) return;

    // Enable high quality bilinear/bicubic filtering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let isRunning = true;

    const renderLoop = (timestamp: DOMHighResTimeStamp) => {
      if (!isRunning) return;

      const tStart = performance.now();

      // Check if video has fresh ready frames
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        // Sync canvas internal resolution with native video stream resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

        const width = canvas.width;
        const height = canvas.height;

        ctx.save();

        // Hardware-accelerated mirroring via 2D matrix transformation
        if (isMirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        // Direct draw from video buffer to canvas
        ctx.drawImage(video, 0, 0, width, height);

        ctx.restore();

        // Optional Native Consular Alignment Guides rendered crisply at canvas resolution
        if (guidelinesVisible) {
          ctx.save();
          
          // 1. Eye-level alignment guideline (top 35% of frame)
          const eyeLevelY = height * 0.35;
          ctx.strokeStyle = 'rgba(197, 168, 128, 0.4)';
          ctx.lineWidth = Math.max(1, Math.round(width / 640));
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(width * 0.15, eyeLevelY);
          ctx.lineTo(width * 0.85, eyeLevelY);
          ctx.stroke();

          // 2. Head & Shoulder Consular Oval target
          const centerX = width / 2;
          const centerY = height * 0.45;
          const radiusX = width * 0.22;
          const radiusY = height * 0.30;

          ctx.strokeStyle = 'rgba(197, 168, 128, 0.28)';
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();

          // 3. Center alignment tick mark
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(197, 168, 128, 0.6)';
          ctx.beginPath();
          ctx.moveTo(centerX - 10, eyeLevelY);
          ctx.lineTo(centerX + 10, eyeLevelY);
          ctx.moveTo(centerX, eyeLevelY - 10);
          ctx.lineTo(centerX, eyeLevelY + 10);
          ctx.stroke();

          ctx.restore();
        }

        // Lightweight Exposure / Lighting Analysis (every 45 frames to eliminate bus stall)
        frameCountRef.current += 1;
        if (frameCountRef.current % 45 === 0) {
          try {
            // Sample a tiny 16x16 center patch
            const sampleSize = 16;
            const sx = Math.floor(width / 2 - sampleSize / 2);
            const sy = Math.floor(height / 2 - sampleSize / 2);
            const imgData = ctx.getImageData(sx, sy, sampleSize, sampleSize);
            const data = imgData.data;
            let totalLuma = 0;
            const count = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
            }
            const avgLuma = totalLuma / count;
            const score = Math.round(Math.min(100, Math.max(0, (avgLuma / 255) * 100)));
            setExposureScore(score);
            if (score < 35) setExposureText('Low Light');
            else if (score > 88) setExposureText('High Glare');
            else setExposureText('Optimal');
          } catch {
            // Ignore cross-origin context readback if any
          }
        }
      }

      // Compute RAF latency & Frame Rate
      const tEnd = performance.now();
      const frameDelta = tEnd - tStart;

      // Track frame intervals for rolling average FPS
      const now = timestamp || performance.now();
      const times = frameTimesRef.current;
      times.push(now);
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }

      // Update state telemetry throttled once every 250ms to prevent React re-render thrashing
      if (now - lastMetricsUpdateRef.current >= 250) {
        lastMetricsUpdateRef.current = now;
        const currentFps = times.length > 0 ? times.length : 60;
        setFps(currentFps);
        setLatencyMs(parseFloat(frameDelta.toFixed(1)));

        if (onMetricsUpdate) {
          onMetricsUpdate({
            fps: currentFps,
            latencyMs: parseFloat(frameDelta.toFixed(1)),
            exposureScore
          });
        }
      }

      // Continue requestAnimationFrame loop
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isMirrored, guidelinesVisible, exposureScore, onMetricsUpdate]);

  // Launch and restart render pipeline when dependencies change
  useEffect(() => {
    const cleanup = startRenderPipeline();
    return () => {
      if (cleanup) cleanup();
    };
  }, [startRenderPipeline]);

  // Handle visibility change (pause RAF when tab is hidden, resume when tab is active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } else {
        startRenderPipeline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startRenderPipeline]);

  return (
    <div className={`relative w-full h-full bg-[#070807] overflow-hidden flex items-center justify-center select-none ${className}`}>
      {/* Hidden low-latency source video element */}
      <video
        ref={hiddenVideoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Hardware-accelerated desynchronized direct canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
      />

      {/* Real-time Video Processing Telemetry HUD */}
      {hudVisible && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 text-[10px] font-mono-numbers">
          {/* FPS & Pipeline Latency Badge */}
          <div className="flex items-center gap-2 bg-[#0B0D0C]/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg text-[#EDE8DE]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-emerald-400">{fps} FPS</span>
            <span className="text-[#9C968A]">•</span>
            <span className="text-[#C5A880] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#C5A880]" />
              {latencyMs}ms render
            </span>
            <span className="hidden sm:inline text-[9px] text-[#9C968A] uppercase tracking-wider">
              (Direct RAF Pipeline)
            </span>
          </div>

          {/* Lighting & Exposure Meter */}
          <div className="flex items-center gap-1.5 bg-[#0B0D0C]/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg text-[#EDE8DE]">
            <Sun className={`w-3 h-3 ${exposureText === 'Optimal' ? 'text-amber-400' : exposureText === 'Low Light' ? 'text-blue-400' : 'text-red-400'}`} />
            <span className="text-[#9C968A]">Light:</span>
            <span className={`font-semibold ${exposureText === 'Optimal' ? 'text-emerald-400' : exposureText === 'Low Light' ? 'text-amber-300' : 'text-rose-400'}`}>
              {exposureText} ({exposureScore}%)
            </span>
          </div>
        </div>
      )}

      {/* Bottom Floating Canvas Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
        {/* Toggle Guidelines */}
        <button
          type="button"
          onClick={() => setGuidelinesVisible(prev => !prev)}
          className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
            guidelinesVisible 
              ? 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/40 shadow-xs' 
              : 'bg-[#0B0D0C]/70 text-[#9C968A] border-white/10 hover:text-[#FAF6F0]'
          }`}
          title="Toggle Consular Eye-Level & Posture Alignment Guide"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Guides</span>
        </button>

        {/* Toggle Telemetry HUD */}
        <button
          type="button"
          onClick={() => setHudVisible(prev => !prev)}
          className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
            hudVisible 
              ? 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/40 shadow-xs' 
              : 'bg-[#0B0D0C]/70 text-[#9C968A] border-white/10 hover:text-[#FAF6F0]'
          }`}
          title="Toggle High-Performance RAF Stream Telemetry"
        >
          <Activity className="w-3 h-3" />
          <span className="hidden sm:inline">FPS/HUD</span>
        </button>
      </div>
    </div>
  );
};
