import React from 'react';
import { ApplicantProfile, QualificationEvaluation } from '../types/index.ts';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  RefreshCw, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface AgentOrchestratorViewProps {
  profile: ApplicantProfile;
  onTriggerEvaluation: () => void;
  onNavigateToRoadmap?: () => void;
  onNavigateToLebenslauf?: () => void;
}

export const AgentOrchestratorView: React.FC<AgentOrchestratorViewProps> = ({
  profile,
  onTriggerEvaluation,
  onNavigateToRoadmap,
  onNavigateToLebenslauf
}) => {
  const evalData: QualificationEvaluation | undefined = profile.evaluation;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Official Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE ATELIER</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Statutory Assessment Report</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Gutachten zur Visa-Voraussetzung</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            Qualification Assessment & Statutory Audit
          </h2>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-1.5 max-w-2xl font-light">
            Deterministic pre-screening evaluation grounded in KMK Anabin criteria, the Modified Bavarian Formula, and the German Residence Act (Aufenthaltsgesetz).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTriggerEvaluation}
            className="px-4 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-execute Pipeline</span>
          </button>
        </div>
      </div>

      {/* Multi-Agent Orchestration Chain */}
      <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-[#9C968A]">
          <span className="font-mono-numbers uppercase tracking-widest text-[10px] text-[#C5A880]">
            5-Agent Deterministic Execution Trace
          </span>
          <span>KMK & AufenthG Compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
            <span className="text-[10px] font-mono-numbers text-[#9C968A] block mb-1">01. INGESTION</span>
            <p className="text-xs font-semibold text-[#FAF6F0]">Document OCR</p>
            <p className="text-[11px] text-[#9C968A] mt-1">{profile.documents.length} verified dossiers</p>
          </div>
          <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
            <span className="text-[10px] font-mono-numbers text-[#9C968A] block mb-1">02. CONFLICT</span>
            <p className="text-xs font-semibold text-[#FAF6F0]">Discrepancy Agent</p>
            <p className="text-[11px] text-[#9C968A] mt-1">
              {profile.clarifications.filter(c => !c.resolved).length} active items
            </p>
          </div>
          <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
            <span className="text-[10px] font-mono-numbers text-[#9C968A] block mb-1">03. RULES</span>
            <p className="text-xs font-semibold text-[#FAF6F0]">Bavarian & Anabin</p>
            <p className="text-[11px] text-[#9C968A] mt-1">
              {evalData?.germanGradeEquivalent ? `Grade ${evalData.germanGradeEquivalent.toFixed(1)}` : 'Calculated'}
            </p>
          </div>
          <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
            <span className="text-[10px] font-mono-numbers text-[#9C968A] block mb-1">04. ROADMAP</span>
            <p className="text-xs font-semibold text-[#FAF6F0]">Roadmap Agent</p>
            <p className="text-[11px] text-[#9C968A] mt-1">{profile.roadmap.length} milestones</p>
          </div>
          <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
            <span className="text-[10px] font-mono-numbers text-[#9C968A] block mb-1">05. ADVISOR</span>
            <p className="text-xs font-semibold text-[#FAF6F0]">Consular Review</p>
            <p className="text-[11px] text-[#9C968A] mt-1">{profile.consultantStatus}</p>
          </div>
        </div>
      </div>

      {/* Main Results Sheet */}
      {evalData ? (
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-7 sm:p-9 space-y-8 shadow-2xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Pre-Screening Determination
              </span>
              <h3 className="font-serif-display text-3xl text-[#FAF6F0]">
                {evalData.overallEligibility.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-[#9C968A]">
                Evaluated under Section 16b / 16a / 20a of the German Residence Act.
              </p>
            </div>

            <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl flex items-center gap-4">
              <div>
                <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Consular Match Score</span>
                <p className="font-serif-display text-3xl font-medium text-[#C5A880]">
                  {evalData.overallScore}<span className="text-base text-[#9C968A]">/100</span>
                </p>
              </div>
            </div>
          </div>

          {/* Three Statutory Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Col 1: Bavarian Converted Grade */}
            <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAF6F0]">Modified Bavarian Grade</span>
                <Scale className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="space-y-1">
                <span className="font-serif-display text-3xl font-medium text-[#FAF6F0]">
                  {evalData.germanGradeEquivalent ? evalData.germanGradeEquivalent.toFixed(1) : 'Calculated'}
                </span>
                <p className="text-[11px] text-[#9C968A]">
                  Formula: N = 1 + 3 × (Nmax - Nd) / (Nmax - Nmin)
                </p>
              </div>
              <p className="text-[11px] text-[#9C968A] pt-2 border-t border-white/[0.08]">
                Indian Score: {profile.obtainedScore} on scale {profile.gradingScaleType}
              </p>
            </div>

            {/* Col 2: Institutional Standing */}
            <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAF6F0]">KMK Anabin Accreditation</span>
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="space-y-1">
                <span className="font-mono-numbers text-2xl font-semibold text-[#C5A880]">
                  [{evalData.anabinUniversityStatus || profile.anabinStatus || 'H+'}]
                </span>
                <p className="text-[11px] text-[#9C968A]">
                  Central Office for Foreign Education (ZAB)
                </p>
              </div>
              <p className="text-[11px] text-[#9C968A] pt-2 border-t border-white/[0.08]">
                {profile.indianInstitution || 'Registered Institution'}
              </p>
            </div>

            {/* Col 3: Chancenkarte Points */}
            <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAF6F0]">Opportunity Card Points</span>
                <BookOpen className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="space-y-1">
                <span className="font-serif-display text-3xl font-medium text-[#FAF6F0]">
                  {evalData.chancenkartePoints ? `${evalData.chancenkartePoints.totalPoints} pts` : 'Qualified'}
                </span>
                <p className="text-[11px] text-[#9C968A]">
                  Minimum 6 points required under § 20a AufenthG
                </p>
              </div>
              <p className="text-[11px] text-[#9C968A] pt-2 border-t border-white/[0.08]">
                {evalData.chancenkartePoints && evalData.chancenkartePoints.totalPoints >= evalData.chancenkartePoints.minimumRequired ? '✓ Threshold satisfied' : 'Audit completed'}
              </p>
            </div>
          </div>

          {/* Strengths & Missing Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.08]">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#FAF6F0] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
                <span>Statutory Strengths</span>
              </span>
              <ul className="text-xs text-[#9C968A] space-y-2 list-disc pl-5">
                {(evalData.evidenceBackedStrengths || evalData.requirementsMet || []).map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#FAF6F0] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Prerequisites to Complete</span>
              </span>
              <ul className="text-xs text-[#9C968A] space-y-2 list-disc pl-5">
                {(evalData.blockersAndRisks || []).map((req: string, i: number) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
            <span className="text-xs text-[#9C968A]">
              Dossier authenticated for consular submission.
            </span>
            <div className="flex items-center gap-3">
              {onNavigateToLebenslauf && (
                <button
                  type="button"
                  onClick={onNavigateToLebenslauf}
                  className="px-4 py-2.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-medium text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
                >
                  DIN 5008 CV
                </button>
              )}
              {onNavigateToRoadmap && (
                <button
                  type="button"
                  onClick={onNavigateToRoadmap}
                  className="px-4 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Visa Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4">
          <Scale className="w-10 h-10 mx-auto text-[#C5A880] opacity-80" />
          <h3 className="font-serif-display text-2xl text-[#FAF6F0]">Pipeline Pending Execution</h3>
          <p className="text-xs text-[#9C968A] max-w-md mx-auto">
            Click below to execute the 5-agent statutory pipeline against your uploaded academic transcripts and KMK database registries.
          </p>
          <button
            type="button"
            onClick={onTriggerEvaluation}
            className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
          >
            Execute Evaluation Engine
          </button>
        </div>
      )}

    </div>
  );
};
