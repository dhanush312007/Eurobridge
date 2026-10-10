import React, { useState } from 'react';
import { ClarificationQuestion } from '../types/index.ts';
import { CheckCircle2, AlertTriangle, Send } from 'lucide-react';

interface ClarificationCenterProps {
  clarifications: ClarificationQuestion[];
  onResolveClarification: (clarId: string, answer: string) => Promise<void>;
}

export const ClarificationCenter: React.FC<ClarificationCenterProps> = ({
  clarifications,
  onResolveClarification
}) => {
  const [activeAnswers, setActiveAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleAnswerChange = (id: string, text: string) => {
    setActiveAnswers(prev => ({ ...prev, [id]: text }));
  };

  const handleSubmit = async (id: string) => {
    const text = activeAnswers[id];
    if (!text || !text.trim()) return;
    setIsSubmitting(id);
    try {
      await onResolveClarification(id, text);
      setActiveAnswers(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const openQuestions = clarifications.filter(c => !c.resolved);
  const resolvedQuestions = clarifications.filter(c => c.resolved);

  return (
    <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 text-[#EDE8DE] shadow-xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            Autonomous Clarification Loop
          </span>
          <h3 className="font-serif-display text-2xl text-[#FAF6F0] mt-0.5">
            Intelligent Discrepancy Clarifications
          </h3>
          <p className="text-xs text-[#9C968A] mt-0.5 font-light">
            Resolve conflicts detected between declared credentials and German regulatory mandates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-numbers text-[#9C968A]">
            {openQuestions.length} Open • {resolvedQuestions.length} Resolved
          </span>
        </div>
      </div>

      {/* Open Questions */}
      <div className="space-y-4">
        {openQuestions.length === 0 ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All credential discrepancies have been clarified and resolved. No active blockers.</span>
          </div>
        ) : (
          openQuestions.map(item => (
            <div 
              key={item.id} 
              className={`p-5 rounded-xl border text-xs space-y-3 ${
                item.severity === 'CRITICAL' 
                  ? 'border-red-500/30 bg-red-950/20' 
                  : 'border-amber-500/30 bg-amber-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    item.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <span className="font-semibold text-[#FAF6F0]">{item.field}</span>
                </div>
                <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded border ${
                  item.severity === 'CRITICAL' 
                    ? 'bg-red-950/80 text-red-300 border-red-500/30' 
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                }`}>
                  {item.severity}
                </span>
              </div>

              <p className="text-xs text-[#EDE8DE] leading-relaxed">
                {item.question}
              </p>

              <p className="text-[11px] text-[#9C968A] italic">
                Statutory Reason: {item.reason}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={activeAnswers[item.id] || ''}
                  onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                  placeholder="Provide clarifying details or official document explanation..."
                  className="flex-1 bg-[#161A18] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                />
                <button
                  type="button"
                  onClick={() => handleSubmit(item.id)}
                  disabled={isSubmitting === item.id || !activeAnswers[item.id]?.trim()}
                  className="px-4 py-2 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting === item.id ? 'Submitting...' : 'Submit Resolution'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolved Questions */}
      {resolvedQuestions.length > 0 && (
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
            Previously Resolved Clarifications ({resolvedQuestions.length})
          </span>
          <div className="space-y-2">
            {resolvedQuestions.map(item => (
              <div 
                key={item.id}
                className="p-3 bg-[#161A18] border border-white/10 rounded-xl text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span className="font-medium text-[#FAF6F0]">{item.field}</span>
                  <span className="text-[#9C968A] truncate max-w-md"> – Answer: {item.applicantAnswer || 'Resolved'}</span>
                </div>
                <span className="text-[10px] font-mono-numbers text-[#C5A880] bg-[#C5A880]/10 px-2 py-0.5 rounded border border-[#C5A880]/20 shrink-0">
                  RESOLVED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
