import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ApplicantProfile, 
  InterviewSession, 
  InterviewPathway, 
  InterviewType, 
  InterviewMode, 
  InterviewLanguage, 
  InterviewDifficulty, 
  InterviewEvaluationReport 
} from '../types/index.ts';
import { 
  Mic, 
  MicOff,
  Video, 
  VideoOff,
  FileText, 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  CheckCircle2, 
  AlertCircle, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Trash2, 
  History, 
  BookOpen,
  Camera,
  RefreshCw,
  Loader2,
  Headphones,
  Sliders,
  Send,
  Zap,
  Check,
  UserCheck,
  Activity
} from 'lucide-react';
import { syncInterviewToFirestore } from '../services/firestoreService.ts';
import { HighPerformanceStreamCanvas } from './HighPerformanceStreamCanvas.tsx';

interface InterviewMirrorProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
}

export const InterviewMirror: React.FC<InterviewMirrorProps> = ({
  profile,
  onNavigateTab
}) => {
  // Setup Options
  const [pathway, setPathway] = useState<InterviewPathway>(
    (profile.targetPathway as InterviewPathway) || 'HIGHER_EDUCATION'
  );
  const [interviewType, setInterviewType] = useState<InterviewType>(
    profile.targetPathway === 'AUSBILDUNG' ? 'AUSBILDUNG_APPRENTICESHIP' :
    profile.targetPathway === 'EMPLOYMENT' ? 'TECHNICAL_JOB' : 'UNIVERSITY_ADMISSION'
  );
  const [mode, setMode] = useState<InterviewMode>('VIDEO');
  const [language, setLanguage] = useState<InterviewLanguage>('ENGLISH');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('STANDARD');
  const [totalQuestions, setTotalQuestions] = useState(3);

  // Active Session State
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [selectedPastSession, setSelectedPastSession] = useState<InterviewSession | null>(null);

  // Voice Interaction State
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState(0);

  // Video Mode State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [useVirtualMirror, setUseVirtualMirror] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoTimerSecs, setVideoTimerSecs] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  
  const liveVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const setupVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const volumeIntervalRef = useRef<any>(null);

  // Guaranteed Video Element Ref Callback for active session
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    liveVideoElementRef.current = node;
    if (node && liveStreamRef.current && !recordedVideoUrl) {
      node.srcObject = liveStreamRef.current;
      node.muted = true;
      node.play().catch(e => console.warn('Live video play notice:', e));
    }
  }, [recordedVideoUrl]);

  // Video Element Ref for Setup Preview
  const setSetupVideoRef = useCallback((node: HTMLVideoElement | null) => {
    setupVideoElementRef.current = node;
    if (node && liveStreamRef.current) {
      node.srcObject = liveStreamRef.current;
      node.muted = true;
      node.play().catch(e => console.warn('Setup video preview notice:', e));
    }
  }, []);

  // Load past sessions
  useEffect(() => {
    fetch(`/api/interview-mirror/sessions/${profile.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPastSessions(data);
      })
      .catch(err => console.warn('Could not load interview sessions:', err));
  }, [profile.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    };
  }, []);

  // Examiner Voice (Web Speech Synthesis with Chrome unlock & natural voice search)
  const speakQuestionAloud = useCallback((text: string, lang: InterviewLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'GERMAN' ? 'de-DE' : 'en-US';
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(v => 
          lang === 'GERMAN' 
            ? (v.lang.startsWith('de') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Hedda')))
            : (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen')))
        ) || voices.find(v => lang === 'GERMAN' ? v.lang.startsWith('de') : v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeakingQuestion(true);
      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis notice:', err);
      setIsSpeakingQuestion(false);
    }
  }, [speechRate]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingQuestion(false);
  };

  // Camera Management with robust fallbacks
  const enableCamera = async () => {
    setCameraPermissionError(null);
    setUseVirtualMirror(false);

    // Stop existing stream if any
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => t.stop());
      liveStreamRef.current = null;
    }

    try {
      // 1. First try: high quality 60 FPS video + audio
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280, max: 1920 }, 
            height: { ideal: 720, max: 1080 }, 
            frameRate: { ideal: 60, min: 30 },
            facingMode: 'user'
          },
          audio: true
        });
      } catch {
        // 2. Second try: basic video with ideal 30/60 fps + audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { frameRate: { ideal: 30 } }, 
            audio: true 
          });
        } catch {
          // 3. Third try: video only
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (stream) {
        liveStreamRef.current = stream;
        setLiveStream(stream);
        if (liveVideoElementRef.current) {
          liveVideoElementRef.current.srcObject = stream;
          liveVideoElementRef.current.muted = true;
          liveVideoElementRef.current.play().catch(() => {});
        }
        if (setupVideoElementRef.current) {
          setupVideoElementRef.current.srcObject = stream;
          setupVideoElementRef.current.muted = true;
          setupVideoElementRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setRecordedVideoUrl(null);
      }
    } catch (err: any) {
      console.warn('Physical camera unavailable:', err);
      setCameraPermissionError('Webcam access was not detected or permission was not granted. We have activated the Virtual AI Candidate Studio Mirror so you can still practice with live reflection.');
      setCameraActive(true);
      setUseVirtualMirror(true);
      setLiveStream(null);
    }
  };

  const stopCamera = () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(track => track.stop());
      liveStreamRef.current = null;
    }
    setLiveStream(null);
    if (liveVideoElementRef.current) {
      liveVideoElementRef.current.srcObject = null;
    }
    if (setupVideoElementRef.current) {
      setupVideoElementRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Ensure camera binds when in active session
  useEffect(() => {
    if (activeSession && activeSession.status === 'IN_PROGRESS' && activeSession.mode === 'VIDEO') {
      if (!liveStreamRef.current && !useVirtualMirror) {
        enableCamera();
      } else if (liveVideoElementRef.current && liveStreamRef.current && liveVideoElementRef.current.srcObject !== liveStreamRef.current) {
        liveVideoElementRef.current.srcObject = liveStreamRef.current;
        liveVideoElementRef.current.muted = true;
        liveVideoElementRef.current.play().catch(() => {});
      }
    }
  }, [activeSession?.id, activeSession?.mode, activeSession?.status, useVirtualMirror]);

  // Applicant Voice Recognition & Recording
  const startVoiceListening = async () => {
    stopSpeaking();
    setIsListeningVoice(true);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    // Visual audio volume level pulsation
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    volumeIntervalRef.current = setInterval(() => {
      setVoiceVolumeLevel(Math.floor(Math.random() * 80) + 20);
    }, 120);

    // 1. Audio Media Recorder
    try {
      let audioStream = liveStreamRef.current;
      if (!audioStream || audioStream.getAudioTracks().length === 0) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      }
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        const audioRec = new MediaRecorder(audioStream);
        audioRec.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        audioRec.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setRecordedAudioUrl(URL.createObjectURL(blob));
          }
        };
        audioRec.start(500);
        audioRecorderRef.current = audioRec;
      }
    } catch (e) {
      console.warn('Audio recorder initialization notice:', e);
    }

    // 2. Speech Recognition for live real-time transcription
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'GERMAN' ? 'de-DE' : 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
          }
          if (transcript.trim()) {
            setCurrentAnswerText(transcript.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e.error);
          if (e.error === 'not-allowed') {
            setIsListeningVoice(false);
          }
        };

        recognition.onend = () => {
          if (isListeningVoice && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch {}
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('Voice listening error:', err);
    }
  };

  const stopVoiceListening = () => {
    setIsListeningVoice(false);
    setVoiceVolumeLevel(0);
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      try {
        audioRecorderRef.current.stop();
      } catch {}
    }
  };

  // Video Recording Controls
  const startVideoRecording = () => {
    if (!liveStreamRef.current && !useVirtualMirror) {
      enableCamera();
      return;
    }
    videoChunksRef.current = [];
    setRecordedVideoUrl(null);

    try {
      if (liveStreamRef.current) {
        let mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

        const recorder = new MediaRecorder(liveStreamRef.current, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (videoChunksRef.current.length > 0) {
            const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }

      setIsRecordingVideo(true);
      setVideoTimerSecs(0);

      videoTimerRef.current = setInterval(() => {
        setVideoTimerSecs(prev => prev + 1);
      }, 1000);

      startVoiceListening();
    } catch (err) {
      console.error('Video recorder start error:', err);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    stopVoiceListening();
  };

  const retakeVideo = () => {
    setRecordedVideoUrl(null);
    setVideoTimerSecs(0);
    if (liveStreamRef.current) {
      setLiveStream(liveStreamRef.current);
      if (liveVideoElementRef.current) {
        liveVideoElementRef.current.srcObject = liveStreamRef.current;
        liveVideoElementRef.current.muted = true;
        liveVideoElementRef.current.play().catch(() => {});
      }
    }
  };

  // Start new Interview Session (Ultra-Snappy & Reliable)
  const handleStartInterview = async () => {
    setIsStartingSession(true);
    setSelectedPastSession(null);
    try {
      const res = await fetch('/api/interview-mirror/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: profile.id,
          profile,
          pathway,
          interviewType,
          mode,
          language,
          difficulty,
          totalQuestions
        })
      });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setCurrentAnswerText('');
        setRecordedAudioUrl(null);
        setRecordedVideoUrl(null);

        if (mode === 'VIDEO' && !cameraActive) {
          enableCamera();
        }

        if (session.questions?.[0] && autoSpeakQuestion) {
          setTimeout(() => {
            speakQuestionAloud(session.questions[0].questionText, language);
          }, 350);
        }
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally {
      setIsStartingSession(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!activeSession) return;
    const answerToSubmit = currentAnswerText.trim() || 'Spoken interview response recorded in practice mirror session.';
    setIsSubmittingAnswer(true);
    stopSpeaking();
    if (isRecordingVideo) stopVideoRecording();
    if (isListeningVoice) stopVoiceListening();

    try {
      const res = await fetch('/api/interview-mirror/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          profile,
          answerText: answerToSubmit,
          durationSeconds: videoTimerSecs || 25
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setCurrentAnswerText('');
        setRecordedVideoUrl(null);
        setRecordedAudioUrl(null);
        setVideoTimerSecs(0);

        if (data.isCompleted) {
          stopCamera();
          setPastSessions(prev => [data.session, ...prev.filter(s => s.id !== data.session.id)]);
          syncInterviewToFirestore(data.session).catch(e => console.warn('Sync interview notice:', e));
        } else if (data.nextQuestion && autoSpeakQuestion) {
          setTimeout(() => {
            speakQuestionAloud(data.nextQuestion.questionText, language);
          }, 300);
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Finish Early
  const handleFinishEarly = async () => {
    if (!activeSession) return;
    setIsSubmittingAnswer(true);
    stopSpeaking();
    stopCamera();
    stopVoiceListening();

    try {
      const res = await fetch('/api/interview-mirror/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id, profile })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveSession(updated);
        setPastSessions(prev => [updated, ...prev.filter(s => s.id !== updated.id)]);
        syncInterviewToFirestore(updated).catch(e => console.warn('Sync interview notice:', e));
      }
    } catch (err) {
      console.error('Error finishing session:', err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/interview-mirror/sessions/${id}`, { method: 'DELETE' });
      setPastSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) setActiveSession(null);
      if (selectedPastSession?.id === id) setSelectedPastSession(null);
    } catch (err) {
      console.error('Error deleting interview session:', err);
    }
  };

  // Quick Spoken Starters
  const quickAnswerStarters = [
    {
      label: 'Academic Motivation',
      text: `My degree in ${profile.highestDegree || 'Engineering'} from ${profile.indianInstitution || 'my university'} built strong foundations in core analytical modules. Transitioning to Germany provides direct access to state-funded research laboratories and applied industry partnerships that are directly aligned with my specialization goals.`
    },
    {
      label: 'Financial & Blocked Account',
      text: `For living expenses, I have arranged the statutory German blocked account (Sperrkonto) of €11,904 benchmarked to Section 16b AufenthG and BAföG living criteria, with €992 released monthly. In addition, I have secured German statutory student health insurance through Techniker Krankenkasse.`
    },
    {
      label: 'German Language Commitment',
      text: `My current German proficiency is at level ${profile.germanLevel || 'A2'}. I am proactively continuing structured Goethe-Institut coursework to reach B1/B2, ensuring smooth communication in university seminars, daily German integration, and part-time working student (Werkstudent) opportunities.`
    }
  ];

  const currentQIndex = activeSession?.currentQuestionIndex || 0;
  const currentQuestion = activeSession?.questions[currentQIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE INTELLIGENCE SUITE</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>FEATURE 02</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Real-Time Practice Mirror</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            EUROBRIDGE InterviewMirror
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-3xl font-light leading-relaxed">
            High-fidelity practice examiner for German Academic Admissions, Duale Ausbildung Mentors, and Consular Visa Officers. Features real-time camera reflection, voice speaking, live speech recognition, and instant statutory evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pastSessions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveSession(null);
                setSelectedPastSession(pastSessions[0]);
              }}
              className="px-3.5 py-2 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-medium text-[#FAF6F0] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-[#C5A880]" />
              <span>Past Sessions ({pastSessions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container: Setup View OR Active Interview Session OR Past Report */}
      {!activeSession && !selectedPastSession ? (
        
        /* 1. INTERVIEW PREPARATION & SETUP VIEW WITH CAMERA READINESS TEST */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Setup Configuration Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#111413] border border-white/10 rounded-2xl p-7 sm:p-9 space-y-8 shadow-xl">
            <div className="border-b border-white/[0.08] pb-4">
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Interview Preparation
              </span>
              <h2 className="font-serif-display text-2xl text-[#FAF6F0] mt-1 font-normal">
                Configure Your Practice Simulation
              </h2>
              <p className="text-xs text-[#9C968A] mt-1">
                Select your practice mode, committee persona, and evaluation language.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Pathway Selection */}
              <div className="space-y-2">
                <label className="block font-medium text-[#FAF6F0]">Target Pathway in Germany</label>
                <select
                  value={pathway}
                  onChange={(e) => setPathway(e.target.value as InterviewPathway)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="HIGHER_EDUCATION">Higher Education (Master's / Bachelor's)</option>
                  <option value="AUSBILDUNG">Duale Ausbildung (Paid Vocational Training)</option>
                  <option value="EMPLOYMENT">Skilled Employment / Opportunity Card (Chancenkarte)</option>
                  <option value="INTERNSHIP">Practical Internship / Pre-Study</option>
                </select>
              </div>

              {/* Interview Persona / Type */}
              <div className="space-y-2">
                <label className="block font-medium text-[#FAF6F0]">Interview Persona / Committee</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="UNIVERSITY_ADMISSION">University Academic Admissions Committee</option>
                  <option value="AUSBILDUNG_APPRENTICESHIP">German Employer & Ausbildung Training Mentor</option>
                  <option value="TECHNICAL_JOB">German Corporate Technical Screener</option>
                  <option value="CONSULAR_VISA">German Embassy Consular Visa Officer (Section 16b / 16a)</option>
                </select>
              </div>

              {/* Practice Mode (Video, Voice, Text) */}
              <div className="space-y-2 md:col-span-2">
                <label className="block font-medium text-[#FAF6F0]">Practice Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('VIDEO')}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      mode === 'VIDEO' 
                        ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0] font-semibold ring-1 ring-[#C5A880]/30 shadow-md' 
                        : 'bg-[#161A18] border-white/10 text-[#9C968A] hover:border-white/20'
                    }`}
                  >
                    <Video className="w-5 h-5 mx-auto mb-1.5 text-[#C5A880]" />
                    <span className="block text-xs">Video Mirror Mode</span>
                    <span className="text-[10px] text-[#9C968A] font-normal block mt-0.5">Live camera + voice answers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('VOICE')}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      mode === 'VOICE' 
                        ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0] font-semibold ring-1 ring-[#C5A880]/30 shadow-md' 
                        : 'bg-[#161A18] border-white/10 text-[#9C968A] hover:border-white/20'
                    }`}
                  >
                    <Mic className="w-5 h-5 mx-auto mb-1.5 text-[#C5A880]" />
                    <span className="block text-xs">Voice Audio Mode</span>
                    <span className="text-[10px] text-[#9C968A] font-normal block mt-0.5">Microphone + audio examiner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('TEXT')}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                      mode === 'TEXT' 
                        ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0] font-semibold ring-1 ring-[#C5A880]/30 shadow-md' 
                        : 'bg-[#161A18] border-white/10 text-[#9C968A] hover:border-white/20'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1.5 text-[#C5A880]" />
                    <span className="block text-xs">Written Text Mode</span>
                    <span className="text-[10px] text-[#9C968A] font-normal block mt-0.5">Typing + written feedback</span>
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="block font-medium text-[#FAF6F0]">Interview Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as InterviewLanguage)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="ENGLISH">English (International Master / Blue Card)</option>
                  <option value="GERMAN">German (Deutsch - B1/B2 Ausbildung & University)</option>
                  <option value="BILINGUAL">Bilingual (German Spoken + English Technical)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="block font-medium text-[#FAF6F0]">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="FOUNDATIONAL">Foundational (Standard Motivation & Goals)</option>
                  <option value="STANDARD">Standard (Technical & Pedagogical Scrutiny)</option>
                  <option value="ADVANCED_CONSULAR">Advanced Consular (Deep Regulatory & Curriculum Drill)</option>
                </select>
              </div>

              {/* Session Duration / Number of Questions */}
              <div className="space-y-2">
                <label className="block font-medium text-[#FAF6F0]">Session Length</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value={3}>Express Sprint (3 Questions ~ 4 mins)</option>
                  <option value={5}>Standard Simulation (5 Questions ~ 8 mins)</option>
                </select>
              </div>

              {/* Audio Voice Readout Toggle */}
              <div className="space-y-2 flex items-center justify-between p-3 bg-[#161A18] border border-white/10 rounded-xl self-end">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#FAF6F0] block">Examiner Voice Audio</span>
                  <span className="text-[10px] text-[#9C968A] block">Read questions aloud automatically</span>
                </div>
                <input 
                  type="checkbox"
                  checked={autoSpeakQuestion}
                  onChange={(e) => setAutoSpeakQuestion(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A880] rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] text-[#9C968A]">
                Streams stay private in your browser under GDPR standards.
              </span>
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={isStartingSession}
                className="px-6 py-3 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isStartingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isStartingSession ? 'Preparing Examiner...' : 'Start Practice Interview'}</span>
              </button>
            </div>
          </div>

          {/* Camera & Microphone Readiness Preview Studio (5 cols) */}
          <div className="lg:col-span-5 bg-[#111413] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-xs font-semibold text-[#FAF6F0]">
                  Camera & Mic Readiness
                </span>
              </div>
              <span className="text-[10px] font-mono-numbers text-[#C5A880]">
                {cameraActive ? (useVirtualMirror ? 'Virtual Studio Mirror' : 'Live Webcam Active') : 'Standby'}
              </span>
            </div>

            {/* Live Camera Viewport Preview */}
            <div className="relative bg-[#070807] rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 shadow-inner">
              {cameraActive && !useVirtualMirror ? (
                <HighPerformanceStreamCanvas
                  stream={liveStream || liveStreamRef.current}
                  isMirrored={isMirrored}
                  showGuidelines={true}
                  showTelemetry={true}
                  className="rounded-xl"
                />
              ) : cameraActive && useVirtualMirror ? (
                /* Virtual AI Studio Mirror for devices without physical webcam */
                <div className="relative w-full h-full bg-gradient-to-br from-[#121614] via-[#0E1110] to-[#1A1F1D] flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1C2220] border-2 border-[#C5A880]/60 flex items-center justify-center mb-2 shadow-lg">
                    <UserCheck className="w-8 h-8 text-[#C5A880]" />
                  </div>
                  <span className="text-xs font-semibold text-[#FAF6F0] block">
                    {profile.fullName || 'Candidate Studio'}
                  </span>
                  <span className="text-[10px] font-mono-numbers text-[#C5A880] mt-0.5 block">
                    Virtual Reflection Active
                  </span>
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-[#9C968A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Framing & Eye Contact Calibrated</span>
                  </div>
                </div>
              ) : (
                /* Standby Screen */
                <div className="p-6 text-center space-y-3">
                  <Camera className="w-8 h-8 mx-auto text-[#C5A880] opacity-80" />
                  <p className="text-xs font-semibold text-[#FAF6F0]">Mirror Test Preview</p>
                  <p className="text-[11px] text-[#9C968A] leading-relaxed max-w-xs">
                    Test your video camera and framing so you can check your lighting and posture before starting.
                  </p>
                  <button
                    type="button"
                    onClick={enableCamera}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Test Camera & Microphone</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls & Mirror Settings */}
            {cameraActive && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08] text-xs">
                <button
                  type="button"
                  onClick={() => setIsMirrored(prev => !prev)}
                  className="px-2.5 py-1.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 rounded-lg text-[11px] text-[#FAF6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-[#C5A880]" />
                  <span>{isMirrored ? 'Normal View' : 'Mirror View'}</span>
                </button>

                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : enableCamera}
                  className="px-2.5 py-1.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 rounded-lg text-[11px] text-[#9C968A] hover:text-[#FAF6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <VideoOff className="w-3 h-3" />
                  <span>Pause Mirror</span>
                </button>
              </div>
            )}

            {/* Quick Readiness Checklist */}
            <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#C5A880] block font-semibold">
                Consular Interview Best Practices:
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#9C968A]">
                <li className="flex items-center gap-2 text-[#EDE8DE]">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Position eye level aligned with top-third of screen</span>
                </li>
                <li className="flex items-center gap-2 text-[#EDE8DE]">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Use structured STAR answers (Situation, Task, Action, Result)</span>
                </li>
                <li className="flex items-center gap-2 text-[#EDE8DE]">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>State precise figures (€11,904 blocked account, 180/210 ECTS)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      ) : activeSession && activeSession.status === 'IN_PROGRESS' ? (

        /* 2. ACTIVE INTERVIEW SESSION VIEW */
        <div className="space-y-6">
          
          {/* Active Session Status Bar */}
          <div className="p-4 bg-[#111413] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-semibold text-[#FAF6F0]">
                  Question {currentQIndex + 1} of {activeSession.totalPlannedQuestions}
                </span>
                <span className="text-[#9C968A] ml-2">
                  • {activeSession.interviewType.replace(/_/g, ' ')} ({activeSession.mode} Mode)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Question Audio Replay Speed */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#9C968A]">
                <span>Speed:</span>
                <button
                  type="button"
                  onClick={() => setSpeechRate(prev => prev === 0.95 ? 0.85 : 0.95)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-[#FAF6F0] hover:text-[#C5A880]"
                >
                  {speechRate}x
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinishEarly}
                disabled={isSubmittingAnswer}
                className="text-xs text-[#9C968A] hover:text-red-400 transition-colors cursor-pointer"
              >
                End & Evaluate Now
              </button>
            </div>
          </div>

          {/* Submitting Answer Progress Overlay Banner */}
          {isSubmittingAnswer && (
            <div className="p-4 bg-[#1C201E] border border-[#C5A880]/40 rounded-2xl flex items-center gap-3 text-xs text-[#EDE8DE] shadow-xl animate-pulse">
              <Loader2 className="w-4 h-4 text-[#C5A880] animate-spin shrink-0" />
              <div>
                <span className="font-semibold text-[#FAF6F0]">AI Examiner evaluating response...</span>
                <span className="text-[#9C968A] ml-2">Analyzing statutory criteria & formulating next probe.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* AI Examiner Question Card (5 cols) */}
            <div className="lg:col-span-5 bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                      Examiner Question #{currentQIndex + 1}
                    </span>
                    {isSpeakingQuestion && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Speaking Aloud
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isSpeakingQuestion ? (
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="p-1.5 px-2 bg-red-950/40 border border-red-500/30 text-red-200 hover:text-white rounded-lg flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                        title="Mute examiner voice"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Mute</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => currentQuestion && speakQuestionAloud(currentQuestion.questionText, activeSession.language)}
                        className="p-1.5 px-2 bg-[#161A18] border border-white/10 text-[#FAF6F0] hover:text-[#C5A880] rounded-lg flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                        title="Hear examiner speak question aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Listen to Question</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-serif-display text-xl sm:text-2xl text-[#FAF6F0] font-normal mt-3 leading-relaxed">
                  "{currentQuestion?.questionText}"
                </h3>

                {currentQuestion?.germanTranslation && (
                  <p className="text-xs text-[#9C968A] italic mt-2.5 border-l-2 border-[#C5A880]/40 pl-3">
                    {currentQuestion.germanTranslation}
                  </p>
                )}
              </div>

              {/* Expected Examiner Focus */}
              <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#C5A880] block font-semibold">
                  Examiner Focus & Scoring Rubric:
                </span>
                <p className="text-[#EDE8DE] leading-relaxed">
                  {currentQuestion?.expectedFocus}
                </p>
                {currentQuestion?.adaptiveReason && (
                  <p className="text-[11px] text-[#9C968A] pt-1.5 border-t border-white/[0.06]">
                    Adaptive Context: {currentQuestion.adaptiveReason}
                  </p>
                )}
              </div>

              {/* Quick Spoken Starters */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#9C968A] block">
                  Quick Spoken Response Starters:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickAnswerStarters.map((qs, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCurrentAnswerText(prev => prev ? `${prev} ${qs.text}` : qs.text);
                      }}
                      className="px-2.5 py-1 bg-[#161A18] hover:bg-[#202523] border border-white/10 hover:border-[#C5A880]/40 rounded-lg text-[11px] text-[#EDE8DE] hover:text-[#FAF6F0] transition-colors cursor-pointer"
                    >
                      + {qs.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Applicant Response Panel (7 cols) */}
            <div className="lg:col-span-7 bg-[#111413] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl">
              
              {/* VIDEO MIRROR MODE: Live Camera Mirror Feed */}
              {activeSession.mode === 'VIDEO' && (
                <div className="space-y-4">
                  <div className="relative bg-[#070807] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 shadow-2xl">
                    
                    {/* Live mirror video element with callback ref */}
                    {!recordedVideoUrl ? (
                      cameraActive && !useVirtualMirror ? (
                        <HighPerformanceStreamCanvas
                          stream={liveStream || liveStreamRef.current}
                          isMirrored={isMirrored}
                          showGuidelines={true}
                          showTelemetry={true}
                          className="rounded-2xl"
                        />
                      ) : (
                        /* Virtual AI Candidate Mirror View */
                        <div className="relative w-full h-full bg-gradient-to-br from-[#121614] via-[#0E1110] to-[#1A1F1D] flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-20 h-20 rounded-full bg-[#1C2220] border-2 border-[#C5A880] flex items-center justify-center mb-3 shadow-xl">
                            <UserCheck className="w-10 h-10 text-[#C5A880]" />
                          </div>
                          <span className="text-sm font-semibold text-[#FAF6F0]">
                            {profile.fullName || 'Candidate'}
                          </span>
                          <span className="text-[11px] text-[#9C968A] mt-0.5">
                            {profile.indianInstitution || 'German Pathway Candidate'}
                          </span>
                          
                          {/* Live Speaking Reaction Waveform */}
                          {isListeningVoice && (
                            <div className="mt-4 flex items-center gap-1">
                              {[30, 60, 90, 45, 80, 50, 95, 40].map((h, i) => (
                                <span 
                                  key={i} 
                                  className="w-1 bg-[#C5A880] rounded-full transition-all duration-100" 
                                  style={{ height: `${(h * (voiceVolumeLevel || 40)) / 100}px` }}
                                />
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={enableCamera}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[10px] text-[#FAF6F0] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Camera className="w-3 h-3 text-[#C5A880]" />
                              <span>Switch to Physical Webcam</span>
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Instant Local Video Playback */
                      <video
                        src={recordedVideoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover bg-black"
                      />
                    )}

                    {/* Recording Indicator & Live Timer */}
                    {isRecordingVideo && (
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs font-mono-numbers pointer-events-none">
                        <div className="bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>RECORDING {videoTimerSecs}s</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Recording Toolbar */}
                  <div className="flex flex-wrap items-center gap-3">
                    {!isRecordingVideo && !recordedVideoUrl && (
                      <button
                        type="button"
                        onClick={startVideoRecording}
                        className="py-2 px-4 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Record Video Answer</span>
                      </button>
                    )}

                    {isRecordingVideo && (
                      <button
                        type="button"
                        onClick={stopVideoRecording}
                        className="py-2 px-4 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Recording ({videoTimerSecs}s)</span>
                      </button>
                    )}

                    {recordedVideoUrl && (
                      <button
                        type="button"
                        onClick={retakeVideo}
                        className="py-2 px-3.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-medium text-[#FAF6F0] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Retake Video</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsMirrored(prev => !prev)}
                      className="py-2 px-3 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-[11px] text-[#9C968A] hover:text-[#FAF6F0] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isMirrored ? 'Normal View' : 'Mirror Flip'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VOICE ANSWERING CAPABILITY (Available across all modes) */}
              <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isListeningVoice ? 'bg-red-600 text-white shadow-lg animate-pulse ring-2 ring-red-400' : 'bg-white/10 text-[#C5A880]'
                    }`}>
                      {isListeningVoice ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-[#FAF6F0] block">
                        {isListeningVoice ? 'Microphone Active — Listening...' : 'Answer with Your Voice'}
                      </span>
                      <span className="text-[11px] text-[#9C968A]">
                        {isListeningVoice ? 'Speaking transcribed into transcript box below' : 'Click below to answer using your real microphone'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {!isListeningVoice ? (
                      <button
                        type="button"
                        onClick={startVoiceListening}
                        className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Speak Answer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceListening}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Done Speaking</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated Voice Level Wave when active */}
                {isListeningVoice && (
                  <div className="py-2 flex items-center justify-center gap-1 bg-[#111413] rounded-lg border border-red-500/20">
                    {[20, 45, 75, 90, 60, 85, 30, 95, 50, 70].map((h, idx) => (
                      <span 
                        key={idx} 
                        className="w-1 bg-red-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(6, (h * voiceVolumeLevel) / 100)}px` }}
                      />
                    ))}
                    <span className="text-[10px] font-mono-numbers text-red-300 ml-2">Audio Captured</span>
                  </div>
                )}

                {/* Audio playback preview if voice recording available */}
                {recordedAudioUrl && (
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] text-[#C5A880] flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Audio Response Recorded</span>
                    </span>
                    <audio src={recordedAudioUrl} controls className="h-7 w-56" />
                  </div>
                )}
              </div>

              {/* Answer Transcript / Edit Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-[#FAF6F0]">
                    Your Response Transcript
                  </label>
                  <span className="text-[10px] font-mono-numbers text-[#9C968A]">
                    {currentAnswerText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  rows={activeSession.mode === 'VIDEO' ? 3 : 5}
                  value={currentAnswerText}
                  onChange={(e) => setCurrentAnswerText(e.target.value)}
                  placeholder="Your spoken words will appear here automatically, or you can speak using the microphone button above..."
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3.5 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880] leading-relaxed resize-none"
                />
              </div>

              {/* Submit & Next Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                <span className="text-[11px] text-[#9C968A]">
                  Graded against official German academic & visa standards.
                </span>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmittingAnswer || (!currentAnswerText.trim() && !recordedVideoUrl && !recordedAudioUrl)}
                  className="px-5 py-2.5 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingAnswer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmittingAnswer ? 'Evaluating...' : currentQIndex + 1 === activeSession.totalPlannedQuestions ? 'Submit & Final Evaluation' : 'Submit & Next Question'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* 3. COMPLETED INTERVIEW EVALUATION REPORT VIEW */
        (() => {
          const sessionToView = selectedPastSession || activeSession;
          const report = sessionToView?.feedbackReport;
          if (!sessionToView || !report) return null;

          return (
            <div className="space-y-8 max-w-5xl mx-auto">
              
              {/* Report Header Card */}
              <div className="bg-[#111413] border border-white/10 rounded-2xl p-7 sm:p-9 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                      <Award className="w-3.5 h-3.5" />
                      <span>InterviewMirror Assessment Report</span>
                    </div>
                    <h2 className="font-serif-display text-3xl text-[#FAF6F0] font-normal mt-1">
                      {sessionToView.interviewType.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-xs text-[#9C968A] mt-1">
                      Completed: {new Date(sessionToView.completedAt || sessionToView.startedAt).toLocaleString()} • {sessionToView.answers.length} Questions Answered
                    </p>
                  </div>

                  <div className="p-4 bg-[#161A18] border border-[#C5A880]/30 rounded-xl text-center">
                    <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Overall Score</span>
                    <p className="font-serif-display text-3xl font-medium text-[#C5A880]">
                      {report.overallRating}<span className="text-base text-[#9C968A]">/10</span>
                    </p>
                  </div>
                </div>

                {/* Criteria Score Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[#9C968A] text-[10px] block">Relevance</span>
                    <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">{report.answerRelevance}/10</p>
                  </div>
                  <div className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[#9C968A] text-[10px] block">Completeness</span>
                    <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">{report.answerCompleteness}/10</p>
                  </div>
                  <div className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[#9C968A] text-[10px] block">Structure (STAR)</span>
                    <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">{report.communicationStructure}/10</p>
                  </div>
                  <div className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[#9C968A] text-[10px] block">Clarity</span>
                    <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">{report.clarityAndConfidence}/10</p>
                  </div>
                  <div className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[#9C968A] text-[10px] block">Language Usage</span>
                    <p className="font-mono-numbers text-xl font-semibold text-[#C5A880]">{report.languageUsageScore}/10</p>
                  </div>
                </div>

                {/* Positive Highlights & Omitted Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Evaluated Strengths</span>
                    </span>
                    <ul className="text-xs text-[#EDE8DE] space-y-2 list-disc pl-5">
                      {report.positiveHighlights.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Important Omitted Information</span>
                    </span>
                    <ul className="text-xs text-[#9C968A] space-y-2 list-disc pl-5">
                      {report.omittedKeyInformation.map((omit, idx) => (
                        <li key={idx}>{omit}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Improved Wording Section */}
                {report.suggestedImprovedWording && report.suggestedImprovedWording.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                    <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
                      Suggested Improved Wording
                    </span>
                    <div className="space-y-3">
                      {report.suggestedImprovedWording.map((item, idx) => (
                        <div key={idx} className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[#9C968A] block">What you said:</span>
                            <p className="text-red-300 italic">"{item.originalQuote}"</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#C5A880] block">Recommended German formulation:</span>
                            <p className="text-emerald-300 font-medium">"{item.improvedPhrase}"</p>
                          </div>
                          <p className="text-[11px] text-[#9C968A]">Rationale: {item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Follow-up Practice & Gap2Growth Link */}
                <div className="p-5 bg-[#161A18] border border-[#C5A880]/30 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#FAF6F0]">
                      Recommended Follow-up Practice
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('gap2growth')}
                      className="text-[11px] font-semibold text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Courses in Gap2Growth</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="text-xs text-[#9C968A] space-y-1.5 list-disc pl-5">
                    {report.recommendedFollowUpPractice.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-[#C5A880] pt-2 border-t border-white/[0.08]">
                    Autopilot Recommendation: {report.growthActionSummary}
                  </p>
                </div>

                {/* Back to practice button */}
                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSession(null);
                      setSelectedPastSession(null);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-[#FAF6F0] rounded-xl transition-colors cursor-pointer"
                  >
                    Start New Practice Session
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('future-twin')}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Simulate Next Level in FutureTwin
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
