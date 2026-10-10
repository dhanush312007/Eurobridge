import React from 'react';
import { MilestoneStep } from '../types/index.ts';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

interface RoadmapTimelineProps {
  roadmap: MilestoneStep[];
  pathway: string;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  roadmap,
  pathway
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
          Pathway Milestones & Consular Timetable
        </span>
        <h2 className="font-serif-display text-2xl sm:text-3xl text-[#FAF6F0] font-normal mt-1">
          Personalized Visa & Relocation Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-[#9C968A] mt-1 font-light">
          Chronological milestones aligned with VFS German Mission appointment lead times and intake deadlines under {pathway.replace(/_/g, ' ')}.
        </p>
      </div>

      {roadmap.length === 0 ? (
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-12 text-center text-xs text-[#9C968A]">
          No roadmap generated yet. Run the Qualification Assessment Agent to synthesize your timeline.
        </div>
      ) : (
        <div className="relative border-l-2 border-[#C5A880]/30 ml-4 sm:ml-6 space-y-8 pb-4">
          {roadmap.map((step, idx) => {
            const isCompleted = step.status === 'COMPLETED';
            const isInProgress = step.status === 'IN_PROGRESS';
            return (
              <div key={step.id} className="relative pl-6 sm:pl-8 group">
                
                {/* Node Bullet */}
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-[#0B0D0C] flex items-center justify-center ${
                  isCompleted 
                    ? 'border-emerald-500 bg-emerald-500 text-white' 
                    : isInProgress
                    ? 'border-[#C5A880] ring-4 ring-[#C5A880]/20'
                    : 'border-white/20'
                }`}>
                  {isCompleted && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>

                {/* Card */}
                <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 hover:border-[#C5A880]/50 transition-colors space-y-4 shadow-xl">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase tracking-wider">
                          Stage {idx + 1} • {step.stage.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded border ${
                          isCompleted 
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/20' 
                            : isInProgress
                            ? 'bg-[#C5A880]/15 text-[#C5A880] border-[#C5A880]/30'
                            : 'bg-white/5 text-[#9C968A] border-white/10'
                        }`}>
                          {step.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-serif-display text-xl text-[#FAF6F0] mt-1 font-normal">
                        {step.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#9C968A] shrink-0 font-mono-numbers">
                      {step.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>Target: {step.dueDate}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>~{step.estimatedWeeks} wks</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#EDE8DE] leading-relaxed">
                    {step.description}
                  </p>

                  {/* Action items */}
                  {step.actionItems && step.actionItems.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-mono-numbers uppercase tracking-widest text-[#C5A880] mb-2">
                        Action Checklist:
                      </p>
                      <ul className="space-y-1.5 text-xs text-[#9C968A]">
                        {step.actionItems.map((action, actionIdx) => (
                          <li key={actionIdx} className="flex items-start gap-2">
                            <span className="text-[#C5A880] mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
