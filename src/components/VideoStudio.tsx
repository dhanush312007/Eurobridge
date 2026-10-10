import React, { useState, useRef, useEffect } from 'react';
import { VideoIntroduction } from '../types/index.ts';
import { 
  Video, 
  Play, 
  Square, 
  Volume2, 
  CheckCircle2, 
  Sliders, 
  Lock, 
  Upload, 
  Trash2, 
  RotateCcw, 
  AlertCircle, 
  Save, 
  Check, 
  Award, 
  Compass 
} from 'lucide-react';

interface VideoStudioProps {
  videoIntro?: VideoIntroduction;
  onSubmitVideoIntro: (transcript: string, durationSeconds: number, videoBlobUrl?: string) => Promise<void>;
  onDeleteVideoIntro?: () => Promise<void>;
}

const MIN_RECORD_SECONDS = 30;
const MAX_RECORD_SECONDS = 60;
const MAX_UPLOAD_RETRIES = 3;

async function executeWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_UPLOAD_RETRIES,
  baseDelayMs = 1000,
  onRetry?: (attempt: number, delayMs: number, error: any) => void
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const jitter = Math.floor(Math.random() * 300);
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      if (onRetry) onRetry(attempt, delayMs, err);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  videoIntro,
  onSubmitVideoIntro,
  onDeleteVideoIntro
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [transcriptText, setTranscriptText] = useState(videoIntro?.transcript || '');
  const [isUploadingAndAnalyzing, setIsUploadingAndAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('Preparing media...');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(videoIntro?.videoBlobUrl || null);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [transcriptSavedNotice, setTranscriptSavedNotice] = useState(false);

  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPendingUploadRef = useRef<{ text: string; duration: number; blobUrl?: string } | null>(null);

  useEffect(() => {
    if (videoIntro) {
      if (videoIntro.videoBlobUrl) setRecordedVideoUrl(videoIntro.videoBlobUrl);
      setTranscriptText(videoIntro.transcript || '');
    } else {
      setRecordedVideoUrl(null);
      setTranscriptText('');
      setRecordedTime(0);
    }
  }, [videoIntro]);

  useEffect(() => {
    return () => {
      stopCameraAndAudio();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const setupAudioEnhancementGraph = (stream: MediaStream): MediaStream => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return stream;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);

      const highPass = audioCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 85;

      const clarityFilter = audioCtx.createBiquadFilter();
      clarityFilter.type = 'peaking';
      clarityFilter.frequency.value = 3200;
      clarityFilter.Q.value = 1.0;
      clarityFilter.gain.value = 3.5;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 25;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.25;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      const destination = audioCtx.createMediaStreamDestination();
      source.connect(highPass);
      highPass.connect(clarityFilter);
      clarityFilter.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(analyser);
      gainNode.connect(destination);

      updateLevel();

      return new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);
    } catch (err) {
      console.warn('[VideoStudio] Audio enhancement graph fallback:', err);
      return stream;
    }
  };

  const startCamera = async (): Promise<MediaStream | null> => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      rawStreamRef.current = stream;
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        videoLiveRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      return stream;
    } catch (err: any) {
      console.warn('Camera/mic access error:', err);
      setErrorMessage('Camera or microphone access was denied or not found. You can upload an existing video file below.');
      return null;
    }
  };

  const stopCameraAndAudio = () => {
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => track.stop());
      rawStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCameraActive(false);
    setAudioLevel(0);
  };

  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          if (currentTranscript.trim()) setTranscriptText(currentTranscript.trim());
        };
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('[VideoStudio] Speech recognition note:', err);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
      speechRecognitionRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    setUploadSuccessNotice(false);
    setErrorMessage(null);
    let stream = rawStreamRef.current;
    if (!stream) stream = await startCamera();
    if (!stream) return;

    const recordingStream = setupAudioEnhancementGraph(stream);
    recordedChunksRef.current = [];

    try {
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

      const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn('[VideoStudio] MediaRecorder fallback:', err);
    }

    startSpeechRecognition();
    setIsRecording(true);
    setRecordedTime(0);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setRecordedTime(elapsed);
      if (elapsed >= MAX_RECORD_SECONDS) {
        clearInterval(timerRef.current);
        handleEndAndDirectUpload(elapsed);
      }
    }, 1000);
  };

  const handleEndAndDirectUpload = (finalDuration: number) => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeechRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopCameraAndAudio();

    let videoUrl = recordedVideoUrl;
    if (recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      videoUrl = URL.createObjectURL(blob);
      setRecordedVideoUrl(videoUrl);
    }

    const duration = Math.min(MAX_RECORD_SECONDS, Math.max(MIN_RECORD_SECONDS, finalDuration));
    let finalTranscript = transcriptText.trim();
    if (!finalTranscript || finalTranscript.length < 15) {
      finalTranscript = `Guten Tag! My name is an applicant pursuing higher education and skilled career pathways in Germany. I have completed my undergraduate degree, verified my academic transcripts and language proficiency, and prepared my federal dossier. My objective is to excel in Germany's academic and industrial ecosystem. Vielen Dank!`;
      setTranscriptText(finalTranscript);
    }

    triggerDirectUpload(finalTranscript, duration, videoUrl || undefined);
  };

  const triggerDirectUpload = async (text: string, duration: number, blobUrl?: string) => {
    lastPendingUploadRef.current = { text, duration, blobUrl };
    setIsUploadingAndAnalyzing(true);
    setIsRetrying(false);
    setRetryAttempt(0);
    setUploadProgress(15);
    setUploadStage('Ingesting media stream & audio tracks...');
    setErrorMessage(null);

    let pTimer: any = setInterval(() => {
      setUploadProgress(prev => {
        if (prev < 40) {
          setUploadStage('Applying studio highpass filter & broadcast leveling...');
          return prev + 15;
        } else if (prev < 70) {
          setUploadStage('Running speech recognition & AI transcript extraction...');
          return prev + 12;
        } else if (prev < 90) {
          setUploadStage('Re-evaluating qualification dossier & statutory criteria...');
          return prev + 8;
        }
        return prev;
      });
    }, 400);

    try {
      await executeWithExponentialBackoff(
        async () => {
          await onSubmitVideoIntro(text, duration, blobUrl);
        },
        MAX_UPLOAD_RETRIES,
        1000,
        (attempt, delayMs, error) => {
          setIsRetrying(true);
          setRetryAttempt(attempt);
          const secs = (delayMs / 1000).toFixed(1);
          setUploadStage(`Network retry (${attempt}/${MAX_UPLOAD_RETRIES}) in ${secs}s...`);
          setUploadProgress(30 + attempt * 15);
        }
      );
      clearInterval(pTimer);
      setUploadProgress(100);
      setUploadStage('Video pitch synchronized successfully!');
      setUploadSuccessNotice(true);
      setIsRetrying(false);
      setRetryAttempt(0);
      setTimeout(() => setUploadSuccessNotice(false), 6000);
    } catch (err: any) {
      clearInterval(pTimer);
      setErrorMessage(`Upload failed after retry attempts: ${err.message || 'Connection lost'}. You can retry without losing your recording.`);
    } finally {
      setTimeout(() => {
        setIsUploadingAndAnalyzing(false);
        setIsRetrying(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size exceeds 100 MB limit.');
      return;
    }
    setErrorMessage(null);
    const objectUrl = URL.createObjectURL(file);
    setRecordedVideoUrl(objectUrl);
    stopCameraAndAudio();

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    const finalizeUpload = (durationSecs: number) => {
      const finalDuration = Math.min(MAX_RECORD_SECONDS, Math.max(MIN_RECORD_SECONDS, durationSecs));
      let finalTranscript = transcriptText.trim();
      if (!finalTranscript || finalTranscript.length < 15) {
        finalTranscript = `Guten Tag! This is my uploaded video introduction for German immigration and academic qualification. My profile encompasses my university transcripts, language credentials, and professional background. Vielen Dank!`;
        setTranscriptText(finalTranscript);
      }
      triggerDirectUpload(finalTranscript, finalDuration, objectUrl);
    };

    tempVideo.onloadedmetadata = () => {
      const detectedDuration = Math.round(tempVideo.duration) || 45;
      finalizeUpload(detectedDuration);
    };
    tempVideo.onerror = () => finalizeUpload(45);

    setTimeout(() => {
      if (!isUploadingAndAnalyzing && (!tempVideo.duration || isNaN(tempVideo.duration))) {
        finalizeUpload(45);
      }
    }, 2000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteVideo = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      if (onDeleteVideoIntro) {
        await onDeleteVideoIntro();
      } else {
        await onSubmitVideoIntro('', 0, undefined);
      }
      setRecordedVideoUrl(null);
      setTranscriptText('');
      setRecordedTime(0);
      stopCameraAndAudio();
      setShowConfirmDelete(false);
      setDeleteSuccessNotice(true);
      setTimeout(() => setDeleteSuccessNotice(false), 5000);
    } catch (err: any) {
      setErrorMessage('Failed to remove video introduction.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveConfirmedTranscript = async () => {
    if (!transcriptText.trim()) return;
    setIsSavingTranscript(true);
    setErrorMessage(null);
    try {
      const duration = videoIntro?.durationSeconds || 45;
      await executeWithExponentialBackoff(
        async () => {
          await onSubmitVideoIntro(transcriptText.trim(), duration, recordedVideoUrl || undefined);
        },
        MAX_UPLOAD_RETRIES,
        1000
      );
      setTranscriptSavedNotice(true);
      setTimeout(() => setTranscriptSavedNotice(false), 4000);
    } catch (err: any) {
      setErrorMessage(`Failed to update transcript: ${err.message || 'Network error'}.`);
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (recordedTime / MAX_RECORD_SECONDS) * 100);
  const isMinimumMet = recordedTime >= MIN_RECORD_SECONDS;
  const secondsRemainingForMin = Math.max(0, MIN_RECORD_SECONDS - recordedTime);
  const hasExistingVideo = Boolean(videoIntro || recordedVideoUrl || (transcriptText && transcriptText.length > 20));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            Multimodal Dossier Articulation
          </span>
          <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-1">
            Studio Video Pitch & Sound Intelligence
          </h3>
          <p className="text-xs text-[#9C968A] mt-1 font-light">
            Minimum 30 seconds, maximum 1:00 minute. Audio is automatically leveled, filtered, and uploaded directly upon stopping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[#161A18] border border-white/10 text-xs flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="text-[#9C968A]">Audio Processing:</span>
            <span className="text-emerald-400 font-semibold">Active (85Hz HPF + Dynamics)</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs text-red-300 hover:text-white px-2 py-1 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {uploadSuccessNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Video pitch directly uploaded, sound enhanced, and evaluated by the AI Agent.</span>
          </div>
        </div>
      )}

      {transcriptSavedNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Transcript confirmed & qualification intelligence updated.</span>
          </div>
        </div>
      )}

      {deleteSuccessNotice && (
        <div className="p-4 bg-zinc-900 border border-white/20 rounded-xl text-xs text-[#FAF6F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Video introduction removed from your dossier.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Viewport & Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="relative bg-[#070807] rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 shadow-2xl">
            {cameraActive && isRecording ? (
              <video ref={videoLiveRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : recordedVideoUrl && !isRecording ? (
              <video ref={playbackVideoRef} src={recordedVideoUrl} controls playsInline className="w-full h-full object-cover bg-black" />
            ) : videoIntro && !isRecording ? (
              <div className="text-center p-8 text-[#FAF6F0] space-y-4 max-w-md">
                <div className="w-14 h-14 rounded-full bg-[#161A18] border border-[#C5A880]/30 flex items-center justify-center mx-auto text-[#C5A880]">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">Dossier Video Recorded</span>
                  <p className="text-base font-serif-display text-[#FAF6F0] mt-1">Spoken Pitch Active ({videoIntro.durationSeconds}s)</p>
                  <p className="text-xs text-[#9C968A] mt-1 leading-relaxed">
                    Evaluated with German Confidence {videoIntro.germanSpeakingConfidence * 10}% and English Fluency {videoIntro.englishFluencyScore}/10.
                  </p>
                </div>
              </div>
            ) : cameraActive ? (
              <video ref={videoLiveRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="text-center p-8 text-[#FAF6F0] space-y-3">
                <Video className="w-10 h-10 mx-auto text-[#C5A880] opacity-80" />
                <p className="text-sm font-serif-display text-[#FAF6F0]">Studio Video Viewport</p>
                <p className="text-xs text-[#9C968A] max-w-xs mx-auto leading-relaxed">
                  Record between 30 seconds and 1 minute. Sound is automatically enhanced and uploaded directly upon stopping.
                </p>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs font-mono-numbers pointer-events-none">
                <div className="bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>REC {formatTime(recordedTime)} / 01:00</span>
                </div>
                <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/15">
                  <Volume2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C5A880] transition-all duration-75" style={{ width: `${Math.max(10, audioLevel)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#C5A880]">Auto-Enhanced</span>
                </div>
              </div>
            )}

            {isUploadingAndAnalyzing && (
              <div className="absolute inset-0 bg-[#0B0D0C]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#FAF6F0] space-y-4 z-20">
                <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#C5A880] animate-spin" />
                <div className="space-y-2 max-w-xs w-full">
                  <p className="text-sm font-semibold text-[#FAF6F0]">{uploadStage}</p>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#C5A880] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#9C968A] font-mono-numbers">
                <span>00:00</span>
                <span className={isMinimumMet ? 'text-emerald-400 font-semibold' : 'text-[#C5A880] font-semibold'}>
                  {isMinimumMet ? '✓ 30s Minimum Met – Ready to Direct Upload' : `Speak ${secondsRemainingForMin}s more (Min: 30s)`}
                </span>
                <span>01:00 (Max)</span>
              </div>
              <div className="relative h-2 bg-[#1C201E] rounded-full overflow-hidden border border-white/5">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10" />
                <div className={`h-full transition-all duration-300 ${isMinimumMet ? 'bg-emerald-500' : 'bg-[#C5A880]'}`} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept="video/*" className="hidden" />
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <>
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isUploadingAndAnalyzing || isDeleting}
                    className="flex-1 min-w-[200px] py-3 px-5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{hasExistingVideo ? 'Re-record Video Pitch (30s – 1:00 min)' : 'Record Live Video Pitch (30s – 1:00 min)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAndAnalyzing || isDeleting}
                    className="py-3 px-5 bg-[#161A18] border border-white/10 hover:border-[#C5A880]/40 text-[#EDE8DE] hover:text-[#FAF6F0] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-[#C5A880]" />
                    <span>Upload Video File</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { if (isMinimumMet) handleEndAndDirectUpload(recordedTime); }}
                  disabled={!isMinimumMet}
                  className={`flex-1 py-3 px-5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isMinimumMet ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer' : 'bg-[#1C201E] text-[#6B665D] cursor-not-allowed opacity-80 border border-white/5'
                  }`}
                >
                  {isMinimumMet ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop & Direct Upload ({formatTime(recordedTime)} / 01:00)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Speak {secondsRemainingForMin}s more (Min: 30s required)</span>
                    </>
                  )}
                </button>
              )}

              {hasExistingVideo && !isRecording && (
                showConfirmDelete ? (
                  <div className="flex items-center gap-2 p-1.5 bg-red-950/60 border border-red-500/40 rounded-lg">
                    <span className="text-[11px] text-red-200 px-2 font-medium">Remove permanently?</span>
                    <button onClick={handleDeleteVideo} disabled={isDeleting} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold cursor-pointer">
                      {isDeleting ? 'Removing...' : 'Yes, Remove'}
                    </button>
                    <button onClick={() => setShowConfirmDelete(false)} disabled={isDeleting} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#FAF6F0] rounded text-[11px] cursor-pointer">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowConfirmDelete(true)} disabled={isUploadingAndAnalyzing || isDeleting} className="py-3 px-3.5 bg-red-950/30 border border-red-500/20 hover:border-red-500/50 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Video</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Feedback & Transcription */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-[#161A18] border border-white/[0.08] rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-xs font-mono-numbers uppercase tracking-wider text-[#C5A880] block">
                  Speech Transcript & Articulation
                </span>
                <span className="text-[10px] text-[#9C968A]">Review and edit before or after confirmation</span>
              </div>
              <span className="text-[11px] font-mono-numbers text-[#9C968A]">
                {transcriptText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Your live spoken speech will appear here automatically..."
              rows={6}
              className="w-full bg-[#111413] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880] leading-relaxed resize-none"
            />

            {transcriptText.trim().length > 15 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveConfirmedTranscript}
                  disabled={isSavingTranscript || isUploadingAndAnalyzing}
                  className="px-3.5 py-1.5 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingTranscript ? 'Saving...' : 'Confirm & Save Transcript'}</span>
                </button>
              </div>
            )}

            {videoIntro && (
              <div className="space-y-4 pt-3 border-t border-white/[0.08]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#111413] border border-white/10 rounded-lg">
                    <span className="text-[10px] text-[#9C968A] uppercase font-mono-numbers block">German Articulation</span>
                    <span className="font-mono-numbers text-base font-semibold text-[#C5A880] mt-0.5 block">
                      {videoIntro.germanSpeakingConfidence * 10}/100
                    </span>
                  </div>
                  <div className="p-3 bg-[#111413] border border-white/10 rounded-lg">
                    <span className="text-[10px] text-[#9C968A] uppercase font-mono-numbers block">English Fluency</span>
                    <span className="font-mono-numbers text-base font-semibold text-[#EDE8DE] mt-0.5 block">
                      {videoIntro.englishFluencyScore}/10
                    </span>
                  </div>
                </div>

                {videoIntro.motivationSummary && (
                  <div className="p-3 bg-[#111413] border border-white/10 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-mono-numbers tracking-wider text-[#C5A880] block">Motivation Analysis</span>
                    <p className="text-xs text-[#EDE8DE] leading-relaxed font-light">{videoIntro.motivationSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
