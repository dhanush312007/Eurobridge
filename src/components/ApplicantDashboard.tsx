import React, { useState, useEffect } from 'react';
import { ApplicantProfile, AutopilotEvent } from '../types/index.ts';
import { DossierProgressMeter, computeDossierCompletion } from './DossierProgressMeter.tsx';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  ChevronRight,
  Video,
  Layers,
  Mic,
  DollarSign,
  TrendingUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ApplicantDashboardProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
  onTriggerEvaluation: () => void;
  onOpenPrivacy?: () => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  profile,
  onNavigateTab,
  onTriggerEvaluation
}) => {
  const dossierStats = computeDossierCompletion(profile);
  const evalData = profile.evaluation;
  const unresolvedClarifications = profile.clarifications.filter(c => !c.resolved);
  const [autopilotEvents, setAutopilotEvents] = useState<AutopilotEvent[]>([]);

  useEffect(() => {
    fetch(`/api/autopilot/events/${profile.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAutopilotEvents(data);
      })
      .catch(() => {});
  }, [profile.id]);

  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Applicant';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-[#EDE8DE]">
      
      {/* Editorial Welcome Header */}
      <div className="border-b border-white/[0.08] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE ATELIER</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Personal Applicant Dossier</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Intake {profile.targetIntake || 'Winter 2026/2027'}</span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight mt-2">
            Guten Tag, {firstName}.
          </h1>
          <p className="text-sm text-[#9C968A] mt-2 max-w-2xl font-light">
            Your credentials and legal eligibility are catalogued under the <strong className="text-[#EDE8DE] font-medium">{profile.targetPathway.replace(/_/g, ' ')}</strong> framework.
          </p>
        </div>

        {/* Circular Progress & Quick Tab Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <DossierProgressMeter
            profile={profile}
            onNavigateTab={onNavigateTab}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('future-twin')}
              className="px-4 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              Simulate in FutureTwin
            </button>
            <button
              onClick={() => onNavigateTab('workspace')}
              className="px-4 py-2.5 bg-[#161A18] border border-white/10 text-[#FAF6F0] rounded-lg text-xs font-semibold hover:bg-[#1D2220] transition-colors whitespace-nowrap cursor-pointer"
            >
              AI Workspace
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: CONTEXTUAL FEATURE RECOMMENDATIONS (INTELLIGENCE SUITE) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Autopilot Contextual Guidance
            </span>
          </div>
          <span className="text-xs font-mono-numbers text-[#9C968A]">
            Signature Intelligence Suite
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: FutureTwin Recommendation */}
          <div 
            onClick={() => onNavigateTab('future-twin')}
            className="p-5 bg-[#131615] hover:bg-[#181C1A] border border-white/10 hover:border-[#C5A880]/60 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-xl"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif-display text-lg text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                FutureTwin Simulator
              </h3>
              <p className="text-xs text-[#9C968A] leading-relaxed">
                Test how upgrading your German to B2 or verifying your APS token boosts your consular match score from {evalData?.overallScore || 85} to 98+.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#C5A880] font-medium">
              <span>Simulate Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: InterviewMirror Recommendation */}
          <div 
            onClick={() => onNavigateTab('interview-mirror')}
            className="p-5 bg-[#131615] hover:bg-[#181C1A] border border-white/10 hover:border-[#C5A880]/60 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-xl"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-serif-display text-lg text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                InterviewMirror Coach
              </h3>
              <p className="text-xs text-[#9C968A] leading-relaxed">
                Practice German academic or consular visa questions with adaptive AI feedback, Web Speech, and live video preview.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#C5A880] font-medium">
              <span>Start Practice Session</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: LifeLens Recommendation */}
          <div 
            onClick={() => onNavigateTab('life-lens')}
            className="p-5 bg-[#131615] hover:bg-[#181C1A] border border-white/10 hover:border-[#C5A880]/60 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-xl"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-serif-display text-lg text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                LifeLens Relocation
              </h3>
              <p className="text-xs text-[#9C968A] leading-relaxed">
                Compare actual living costs across 10 German cities (Berlin, Munich, Aachen) with sourced DAAD data and EUR/INR conversion.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#C5A880] font-medium">
              <span>Build Relocation Budget</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Gap2Growth Recommendation */}
          <div 
            onClick={() => onNavigateTab('gap2growth')}
            className="p-5 bg-[#131615] hover:bg-[#181C1A] border border-white/10 hover:border-[#C5A880]/60 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-xl"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-serif-display text-lg text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                Gap2Growth Bridging
              </h3>
              <p className="text-xs text-[#9C968A] leading-relaxed">
                Discover source-backed courses from Goethe-Institut, DAAD, and RWTH Aachen to bridge language, ECTS, and document gaps.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#C5A880] font-medium">
              <span>Explore Growth Plans</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="p-6 bg-[#131615] border border-white/10 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
              Bavarian Converted Grade
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif-display text-3xl font-medium text-[#FAF6F0]">
                {evalData?.germanGradeEquivalent ? evalData.germanGradeEquivalent.toFixed(1) : 'Calculated'}
              </span>
              <span className="text-xs text-[#9C968A]">
                ({profile.obtainedScore}/{profile.maximumScore})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#9C968A] mt-4 pt-3 border-t border-white/[0.08]">
            {profile.indianInstitution || 'University'} • [{profile.anabinStatus || 'H+'}]
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-6 bg-[#131615] border border-white/10 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
              Document Readiness
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif-display text-3xl font-medium text-[#FAF6F0]">
                {dossierStats.docsVerifiedCount}/{dossierStats.docsTotalCount}
              </span>
              <span className="text-xs text-[#9C968A]">
                verified
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#9C968A] mt-4 pt-3 border-t border-white/[0.08]">
            {dossierStats.docsFlaggedCount > 0 ? `${dossierStats.docsFlaggedCount} discrepancy flagged` : 'All ingested files authentic'}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-6 bg-[#131615] border border-white/10 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
              Outstanding Clarifications
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif-display text-3xl font-medium text-[#FAF6F0]">
                {unresolvedClarifications.length}
              </span>
              <span className="text-xs text-[#9C968A]">
                action required
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#9C968A] mt-4 pt-3 border-t border-white/[0.08]">
            {unresolvedClarifications.length === 0 ? 'Zero active discrepancies' : 'Click to answer discrepancy questions'}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-6 bg-[#131615] border border-white/10 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
              Statutory Evaluation Status
            </span>
            <div className="mt-3">
              <span className="font-serif-display text-xl font-medium text-[#C5A880] block">
                {evalData ? evalData.overallEligibility.replace(/_/g, ' ') : 'Pending Pipeline'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#9C968A] mt-4 pt-3 border-t border-white/[0.08]">
            Audited under KMK & AufenthG standards
          </p>
        </div>
      </div>

      {/* Autopilot Real-time Event Stream */}
      {autopilotEvents.length > 0 && (
        <div className="bg-[#131615] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-ping" />
              <h3 className="font-serif-display text-xl text-[#FAF6F0]">
                Autopilot Cross-Feature Activity
              </h3>
            </div>
            <span className="text-xs font-mono-numbers text-[#9C968A]">
              {autopilotEvents.length} Recent Trigger(s)
            </span>
          </div>

          <div className="space-y-3">
            {autopilotEvents.slice(0, 4).map((evt) => (
              <div 
                key={evt.id} 
                className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#FAF6F0]">{evt.title}</span>
                    <span className="text-[9px] font-mono-numbers px-1.5 py-0.2 rounded bg-white/5 text-[#C5A880] border border-white/10">
                      {evt.sourceModule}
                    </span>
                  </div>
                  <p className="text-[#9C968A] text-[11px] mt-0.5">{evt.description}</p>
                </div>

                {evt.suggestedAction && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(evt.suggestedAction!.targetTab)}
                    className="text-xs font-semibold text-[#C5A880] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer shrink-0"
                  >
                    <span>{evt.suggestedAction.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relocation Timeline */}
      <div className="bg-[#131615] border border-white/10 rounded-2xl p-7 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Phase Progression
            </span>
            <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-1">
              Germany Relocation & Qualification Timeline
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('roadmap')}
            className="text-xs font-semibold text-[#C5A880] hover:text-[#D8C3A5] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Full Milestone Roadmap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-numbers text-[#9C968A]">PHASE 01</span>
              <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
            </div>
            <h4 className="text-xs font-semibold text-[#FAF6F0]">Identity & Degree</h4>
            <p className="text-[11px] text-[#9C968A] leading-tight">
              Indian credentials registered from {profile.indianInstitution || 'University'}.
            </p>
          </div>

          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-numbers text-[#9C968A]">PHASE 02</span>
              {profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? (
                <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
              ) : (
                <Clock className="w-4 h-4 text-[#C5A880]/60" />
              )}
            </div>
            <h4 className="text-xs font-semibold text-[#FAF6F0]">APS & Evidence</h4>
            <p className="text-[11px] text-[#9C968A] leading-tight">
              {profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? 'APS Certificate verified' : 'Upload APS token in Vault'}
            </p>
          </div>

          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-numbers text-[#9C968A]">PHASE 03</span>
              {evalData ? (
                <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
              ) : (
                <Clock className="w-4 h-4 text-[#C5A880]/60" />
              )}
            </div>
            <h4 className="text-xs font-semibold text-[#FAF6F0]">Multi-Agent Audit</h4>
            <p className="text-[11px] text-[#9C968A] leading-tight">
              Bavarian grade & Anabin verification engine.
            </p>
          </div>

          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-numbers text-[#9C968A]">PHASE 04</span>
              <FileCheck className="w-4 h-4 text-[#9C968A]" />
            </div>
            <h4 className="text-xs font-semibold text-[#FAF6F0]">DIN 5008 Synthesis</h4>
            <p className="text-[11px] text-[#9C968A] leading-tight">
              Standard German CV format with verified claims.
            </p>
          </div>

          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-numbers text-[#9C968A]">PHASE 05</span>
              <ShieldCheck className="w-4 h-4 text-[#9C968A]" />
            </div>
            <h4 className="text-xs font-semibold text-[#FAF6F0]">Consular Review</h4>
            <p className="text-[11px] text-[#9C968A] leading-tight">
              Senior advisor review & visa endorsement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
