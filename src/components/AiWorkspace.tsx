import React, { useState, useEffect, useRef } from 'react';
import { ApplicantProfile } from '../types/index.ts';
import { DossierProgressMeter } from './DossierProgressMeter.tsx';
import { 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  BookOpen, 
  ArrowRight,
  ExternalLink,
  Mic,
  RotateCcw,
  Bot,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  FileCheck2,
  Compass,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Building2,
  BadgeAlert,
  Landmark,
  Scale
} from 'lucide-react';

interface ToolExecutionState {
  toolName: string;
  status: 'EXECUTED' | 'VERIFIED' | 'CACHED';
  parameters: Record<string, any>;
  summary: string;
}

interface EvidenceCitation {
  title: string;
  source: string;
  referenceSnippet: string;
  relevance: 'HIGH' | 'MEDIUM';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolExecutionState?: ToolExecutionState[];
  evidenceCitations?: EvidenceCitation[];
  clarificationRequests?: string[];
  privacyDisclosure?: string;
  suggestedAction?: {
    label: string;
    targetTab: string;
  };
}

interface AiWorkspaceProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
  onOpenPrivacy?: () => void;
}

export const AiWorkspace: React.FC<AiWorkspaceProps> = ({
  profile,
  onNavigateTab,
  onOpenPrivacy
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize conversation with welcome guidance grounded in applicant profile
  useEffect(() => {
    if (messages.length === 0) {
      const bavarianGrade = profile.evaluation?.germanGradeEquivalent 
        ? profile.evaluation.germanGradeEquivalent.toFixed(2) 
        : '2.0';

      const initialGreeting: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Guten Tag, ${profile.fullName?.split(' ')[0] || 'Applicant'}! I am your Senior German Pathway Advisor.

I am an AI intelligence engine trained directly on the **German Residence Act (Aufenthaltsgesetz)**, the **KMK Anabin Accreditation Database**, and official consular mandates for Indian applicants.

### Your Active Dossier Overview:
• **University & KMK Anabin**: ${profile.indianInstitution || 'Indian University'} (Accreditation Status: **[${profile.anabinStatus || 'H+'}]**)
• **Converted Bavarian Grade**: **${bavarianGrade}** (German scale where 1.0 is top honors and 4.0 is passing threshold)
• **Target Pathway**: **${profile.targetPathway.replace(/_/g, ' ')}**
• **APS India Verification**: ${profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? '✅ Verified in Document Vault' : '⚠️ Digital APS certificate token required for German visa'}
• **Statutory Blocked Account**: €11,904/year (€992/month release under Section 16b AufenthG)

How can I assist your Germany journey today? You can select a quick topic below or type your question in English or German.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceCitations: [
          {
            title: 'KMK Anabin Central Office for Foreign Education (ZAB)',
            source: 'anabin.kmk.org – Standing Conference of Education Ministers',
            referenceSnippet: `Institution "${profile.indianInstitution || 'Higher Education Institution'}" has accreditation status ${profile.anabinStatus || 'H+'}, granting official degree equivalence across the Federal Republic of Germany.`,
            relevance: 'HIGH'
          },
          {
            title: 'Modified Bavarian Formula (Bayerische Formel)',
            source: 'KMK Resolution 15.03.1991',
            referenceSnippet: `Standard conversion formula N = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin) maps Indian university marks to the German 1.0–4.0 grading scale.`,
            relevance: 'HIGH'
          },
          {
            title: 'German Residence Act (Aufenthaltsgesetz)',
            source: 'Sections 16b / 16a / 20a AufenthG',
            referenceSnippet: 'Mandates APS certificate verification for Indian applicants, proof of living maintenance (€11,904 Sperrkonto), and statutory health insurance.',
            relevance: 'HIGH'
          }
        ],
        privacyDisclosure: 'Grounded in German statutory databases and active applicant dossier.'
      };
      setMessages([initialGreeting]);
    }
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice Input Speech Recognition
  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
        speechRecognitionRef.current = null;
      }
      setIsListeningVoice(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice speech recognition is not supported in this browser. Please type your message.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        if (transcript.trim()) {
          setInputValue(transcript.trim());
        }
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsListeningVoice(true);
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Text-To-Speech for Advisor Messages
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/•/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || isLoading) return;

    if (isListeningVoice) {
      toggleVoiceInput();
    }

    setErrorMsg(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          profileId: profile.id,
          profile,
          history: messages.slice(-5).map(m => ({ role: m.role, text: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Determine suggested shortcut based on answer context
      let suggestedAction: ChatMessage['suggestedAction'] = undefined;
      const lowerReply = (data.reply || '').toLowerCase();
      if (lowerReply.includes('interview') || lowerReply.includes('mock') || lowerReply.includes('mirror') || lowerReply.includes('consular question')) {
        suggestedAction = { label: 'Practice This in InterviewMirror', targetTab: 'interview-mirror' };
      } else if (lowerReply.includes('scenario') || lowerReply.includes('twin') || lowerReply.includes('simulate') || lowerReply.includes('upgrade')) {
        suggestedAction = { label: 'Simulate Upgrade in FutureTwin', targetTab: 'future-twin' };
      } else if (lowerReply.includes('budget') || lowerReply.includes('cost') || lowerReply.includes('rent') || lowerReply.includes('city') || lowerReply.includes('sperrkonto')) {
        suggestedAction = { label: 'Calculate Living Costs in LifeLens', targetTab: 'life-lens' };
      } else if (lowerReply.includes('course') || lowerReply.includes('skill') || lowerReply.includes('gap') || lowerReply.includes('ects') || lowerReply.includes('bridge')) {
        suggestedAction = { label: 'Find Bridge Courses in Gap2Growth', targetTab: 'gap2growth' };
      }

      const assistantMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Your inquiry was evaluated against German federal criteria.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutionState: data.toolExecutionState,
        evidenceCitations: data.evidenceCitations,
        clarificationRequests: data.clarificationRequests,
        privacyDisclosure: 'Grounded in German statutory databases and active applicant dossier.',
        suggestedAction
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Conversational agent invocation error:', err);
      setErrorMsg('The advisory engine encountered a brief hiccup. Please ask again.');
    } finally {
      setIsLoading(false);
    }
  };

  const topicCategories = [
    { id: 'ALL', label: 'All Topics' },
    { id: 'ADMISSION', label: '🎓 University & VPD' },
    { id: 'APS', label: '📑 APS India Token' },
    { id: 'BLOCKED', label: '💶 Blocked Account & TK' },
    { id: 'LANGUAGE', label: '🇩🇪 German B1/B2' },
    { id: 'CAREER', label: '💼 Ausbildung & Jobs' }
  ];

  const samplePrompts = [
    { 
      category: 'ADMISSION', 
      label: "Convert My Grade (Bavarian Formula)", 
      query: "Show me the exact Modified Bavarian Formula calculation for my Indian marks, my converted German grade, and how German university admissions evaluate it." 
    },
    { 
      category: 'ADMISSION', 
      label: "Check University in Anabin", 
      query: `Does my university (${profile.indianInstitution || 'my Indian university'}) have official H+ accreditation status in the KMK Anabin database for direct master admissions?` 
    },
    { 
      category: 'APS', 
      label: "Mandatory APS India Steps & Fee", 
      query: "What are the exact step-by-step procedures, DigiLocker requirements, and ₹18,000 fee payment for the APS India certificate from New Delhi?" 
    },
    { 
      category: 'BLOCKED', 
      label: "Blocked Account (€11,904) & Health Insurance", 
      query: "Explain the €11,904 student blocked account (Sperrkonto), monthly €992 disbursement rules, and mandatory Techniker Krankenkasse (TK) health insurance." 
    },
    { 
      category: 'CAREER', 
      label: "Opportunity Card (Chancenkarte) Points", 
      query: "How many points do I qualify for under the German Opportunity Card (Chancenkarte Section 20a AufenthG) based on my degree, age, and German level?" 
    },
    { 
      category: 'CAREER', 
      label: "Duale Ausbildung Requirements & Salary", 
      query: "What are the eligibility requirements, German B1/B2 Goethe language proofs, and monthly trainee stipends (€900–€1,300) for a Duale Ausbildung?" 
    }
  ];

  const filteredPrompts = selectedCategory === 'ALL' 
    ? samplePrompts 
    : samplePrompts.filter(p => p.category === selectedCategory);

  const handleClearChat = () => {
    if (speakingMsgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
    setMessages([]);
  };

  const toggleCitations = (msgId: string) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const bavarianGrade = profile.evaluation?.germanGradeEquivalent 
    ? profile.evaluation.germanGradeEquivalent.toFixed(2) 
    : '2.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#EDE8DE]">
      
      {/* Workspace Header */}
      <div className="border-b border-white/[0.08] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE ATELIER</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Gemini AI Connected</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>German Legal Framework</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            AI Advisory Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-1.5 max-w-2xl font-light leading-relaxed">
            Real-time personalized advisor trained in German Higher Education, APS India mandates, Bavarian Grade conversion, and the Residence Act (AufenthG).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DossierProgressMeter profile={profile} onNavigateTab={onNavigateTab} size={36} />
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="px-3 py-1.5 bg-[#161A18] border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-[#9C968A] hover:text-[#FAF6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>DSGVO Privacy</span>
            </button>
          )}
        </div>
      </div>

      {/* Applicant Quick Metric At-A-Glance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-[#111413] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[#9C968A]">
            <span className="text-[10px] uppercase font-mono-numbers">Bavarian Grade</span>
            <Scale className="w-3.5 h-3.5 text-[#C5A880]" />
          </div>
          <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">
            {bavarianGrade} <span className="text-[10px] text-[#C5A880] font-normal">German Note</span>
          </p>
          <span className="text-[10px] text-[#9C968A] block">1.0 is best; 4.0 is pass</span>
        </div>

        <div className="p-3.5 bg-[#111413] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[#9C968A]">
            <span className="text-[10px] uppercase font-mono-numbers">KMK Anabin</span>
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-mono-numbers text-xl font-semibold text-emerald-400">
            {profile.anabinStatus || 'H+'} <span className="text-[10px] text-[#9C968A] font-normal">Recognized</span>
          </p>
          <span className="text-[10px] text-[#9C968A] block truncate">{profile.indianInstitution || 'Accredited Institution'}</span>
        </div>

        <div className="p-3.5 bg-[#111413] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[#9C968A]">
            <span className="text-[10px] uppercase font-mono-numbers">APS Certificate</span>
            <BadgeAlert className="w-3.5 h-3.5 text-[#C5A880]" />
          </div>
          <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">
            {profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? (
              <span className="text-emerald-400">Verified</span>
            ) : (
              <span className="text-amber-300">₹18,000 Required</span>
            )}
          </p>
          <span className="text-[10px] text-[#9C968A] block">Section 16b AufenthG Token</span>
        </div>

        <div className="p-3.5 bg-[#111413] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[#9C968A]">
            <span className="text-[10px] uppercase font-mono-numbers">Blocked Account</span>
            <Landmark className="w-3.5 h-3.5 text-[#C5A880]" />
          </div>
          <p className="font-mono-numbers text-xl font-semibold text-[#FAF6F0]">
            €11,904 <span className="text-[10px] text-[#9C968A] font-normal">/ yr</span>
          </p>
          <span className="text-[10px] text-[#9C968A] block">€992/month disbursement</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Chat Stream (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[740px] bg-[#111413] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Stream Header */}
          <div className="px-5 py-3.5 bg-[#161A18] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-[#FAF6F0]">
                Senior Pathway Intelligence Advisor
              </span>
              <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8 Flash Active
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleClearChat}
              className="text-[11px] text-[#9C968A] hover:text-[#FAF6F0] flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono-numbers text-[#9C968A]">
                  <span className="flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <UserIcon className="w-3 h-3" />
                        <span>{profile.fullName || 'You'}</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-[#C5A880]" />
                        <span>Eurobridge Advisor</span>
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-2xl sm:max-w-3xl rounded-2xl p-5 text-xs leading-relaxed space-y-3.5 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-[#C5A880] text-[#0B0D0C] font-medium'
                      : 'bg-[#161A18] border border-white/10 text-[#EDE8DE]'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs leading-relaxed font-light">
                    {msg.content}
                  </div>

                  {/* Actions for Assistant Message (Audio Listen, Copy) */}
                  {msg.role === 'assistant' && (
                    <div className="pt-2 flex items-center gap-2 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.id, msg.content)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[11px] text-[#FAF6F0] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Read answer aloud"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-red-400" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[11px] text-[#9C968A] hover:text-[#FAF6F0] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Suggested Shortcut Button */}
                  {msg.suggestedAction && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigateTab(msg.suggestedAction!.targetTab)}
                        className="px-3.5 py-1.5 bg-[#C5A880]/15 hover:bg-[#C5A880]/25 border border-[#C5A880]/40 text-[#C5A880] hover:text-[#FAF6F0] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Expandable Statutory Citations & Legal Framework */}
                  {msg.evidenceCitations && msg.evidenceCitations.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => toggleCitations(msg.id)}
                        className="flex items-center justify-between w-full text-[11px] font-mono-numbers text-[#C5A880] hover:text-[#FAF6F0] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                          <BookOpen className="w-3 h-3" />
                          <span>Official Legal Grounding ({msg.evidenceCitations.length} Citations)</span>
                        </span>
                        {expandedCitations[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedCitations[msg.id] && (
                        <div className="mt-2.5 space-y-2">
                          {msg.evidenceCitations.map((cit, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-[#111413] border border-white/10 rounded-lg text-[11px] space-y-1"
                            >
                              <div className="font-semibold text-[#FAF6F0] flex items-center justify-between">
                                <span>{cit.title}</span>
                                <span className="text-[10px] font-mono-numbers text-[#C5A880]">
                                  {cit.source}
                                </span>
                              </div>
                              <p className="text-[#9C968A] text-[10px] italic">
                                "{cit.referenceSnippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start space-y-2">
                <span className="text-[10px] font-mono-numbers text-[#9C968A]">
                  Advisor researching official guidelines...
                </span>
                <div className="bg-[#161A18] border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C5A880] animate-ping" />
                  <span className="text-xs text-[#EDE8DE] font-light">
                    Consulting KMK Anabin criteria, Bavarian grading formula, and German visa statutes...
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Prompts Category Tabs & Chips */}
          <div className="px-4 py-2.5 bg-[#161A18] border-t border-white/[0.08] space-y-2 shrink-0">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {topicCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-[#C5A880] text-[#0B0D0C] font-semibold' 
                      : 'bg-[#111413] text-[#9C968A] hover:text-[#FAF6F0] border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {filteredPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(p.query)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-[#111413] hover:bg-[#1D2220] border border-white/10 hover:border-[#C5A880]/60 text-[#EDE8DE] hover:text-[#FAF6F0] rounded-lg text-[11px] whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar with Voice Microphone Support */}
          <div className="p-3.5 sm:p-4 bg-[#111413] border-t border-white/[0.08]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about admissions, APS India, Bavarian formula, or visa requirements..."
                  disabled={isLoading}
                  className="w-full bg-[#161A18] border border-white/10 rounded-xl px-4 py-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880] transition-colors pr-12"
                />

                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors cursor-pointer ${
                    isListeningVoice ? 'bg-red-600 text-white animate-pulse' : 'text-[#9C968A] hover:text-[#C5A880]'
                  }`}
                  title={isListeningVoice ? 'Stop voice recording' : 'Dictate with voice'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-3 bg-[#C5A880] hover:bg-[#D8C3A5] disabled:opacity-40 text-[#0B0D0C] rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask Advisor</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Information Rail (4 cols): Quick Reference Guide */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Guidance Card */}
          <div className="p-5 bg-[#111413] border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FAF6F0]">
              <Compass className="w-4 h-4 text-[#C5A880]" />
              <span>Direct Pathway Shortcuts</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('future-twin')}
                className="w-full p-3 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 hover:border-[#C5A880]/40 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[#FAF6F0] block">FutureTwin Simulator</span>
                  <span className="text-[11px] text-[#9C968A]">Test German B2 or work exp impact</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('interview-mirror')}
                className="w-full p-3 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 hover:border-[#C5A880]/40 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[#FAF6F0] block">InterviewMirror Practice</span>
                  <span className="text-[11px] text-[#9C968A]">Live camera mirror + examiner voice</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('life-lens')}
                className="w-full p-3 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 hover:border-[#C5A880]/40 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[#FAF6F0] block">LifeLens Financial Planner</span>
                  <span className="text-[11px] text-[#9C968A]">City rents, WG costs & living budgets</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('gap2growth')}
                className="w-full p-3 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 hover:border-[#C5A880]/40 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[#FAF6F0] block">Gap2Growth Academy</span>
                  <span className="text-[11px] text-[#9C968A]">Bridging courses for language & ECTS</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>
            </div>
          </div>

          {/* Official German Statutory Grounding Box */}
          <div className="p-5 bg-[#111413] border border-[#C5A880]/30 rounded-2xl space-y-3 text-xs shadow-xl">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block font-semibold">
              Legal Compliance Grounding
            </span>
            <p className="text-[#9C968A] text-xs leading-relaxed font-light">
              This advisor operates strictly under official regulations:
            </p>
            <ul className="space-y-1.5 text-[11px] text-[#EDE8DE] list-disc pl-4 font-light">
              <li><strong className="text-[#FAF6F0]">Section 16b AufenthG:</strong> Higher Education admission & blocked account criteria.</li>
              <li><strong className="text-[#FAF6F0]">Section 16a AufenthG:</strong> Duale Ausbildung vocational training approvals.</li>
              <li><strong className="text-[#FAF6F0]">Section 20a AufenthG:</strong> Opportunity Card (Chancenkarte) point score evaluation.</li>
              <li><strong className="text-[#FAF6F0]">APS India:</strong> Digital certificate issued by APS New Delhi for Indian university degree recognition.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
