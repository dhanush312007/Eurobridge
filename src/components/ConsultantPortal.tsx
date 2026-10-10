import React, { useState } from 'react';
import { ApplicantProfile } from '../types/index.ts';
import { ShieldCheck, UserCheck, CheckCircle2, AlertTriangle, FileText, Send, Award, ExternalLink } from 'lucide-react';
import { advisorImg } from '../assets/images.ts';

interface ConsultantPortalProps {
  profiles: ApplicantProfile[];
  onSelectApplicant: (profile: ApplicantProfile) => void;
  onUpdateReview: (profileId: string, status: ApplicantProfile['consultantStatus'], notes: string) => Promise<void>;
}

export const ConsultantPortal: React.FC<ConsultantPortalProps> = ({
  profiles,
  onSelectApplicant,
  onUpdateReview
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ApplicantProfile['consultantStatus']>('VISA_ENDORSED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pathwayFilter, setPathwayFilter] = useState<string>('ALL');

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const handleSaveReview = async () => {
    if (!selectedProfile || !reviewNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateReview(selectedProfile.id, reviewStatus, reviewNotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (pathwayFilter === 'ALL') return true;
    return p.targetPathway === pathwayFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Advisor Header Card */}
      <div className="bg-[#111413] border border-white/10 rounded-2xl p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <img
            src={advisorImg}
            alt="Educaro Senior Academic Consultant"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#C5A880] shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Educaro Deutschland GmbH
              </span>
              <span className="text-[10px] bg-[#C5A880]/15 px-2 py-0.5 rounded text-[#C5A880] font-medium border border-[#C5A880]/30">
                Certified German Education Counsel
              </span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-[#FAF6F0] font-normal mt-1">
              Consultant Case Management & Visa Endorsement
            </h2>
            <p className="text-xs text-[#9C968A] mt-1">
              Case Officer: Senior Academic Advisor & German Pathway Specialist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6 text-xs text-[#9C968A]">
          <div>
            <p className="font-mono-numbers text-xl font-bold text-[#FAF6F0]">{profiles.length}</p>
            <p className="text-[11px]">Active Dossiers</p>
          </div>
          <div>
            <p className="font-mono-numbers text-xl font-bold text-[#C5A880]">
              {profiles.filter(p => p.consultantStatus === 'VISA_ENDORSED').length}
            </p>
            <p className="text-[11px]">Visa Endorsed</p>
          </div>
          <div>
            <p className="font-mono-numbers text-xl font-bold text-[#FAF6F0]">
              {profiles.reduce((acc, p) => acc + p.documents.length, 0)}
            </p>
            <p className="text-[11px]">Verified Credentials</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Applicant Roster */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Applicant Dossier Queue ({filteredProfiles.length})
            </h3>
          </div>

          <div className="space-y-3">
            {filteredProfiles.length === 0 ? (
              <div className="p-8 bg-[#111413] border border-white/10 rounded-xl text-center text-xs text-[#9C968A]">
                No applicants currently registered in queue.
              </div>
            ) : (
              filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    onSelectApplicant(p);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    selectedProfile?.id === p.id
                      ? 'bg-[#161A18] border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-md'
                      : 'bg-[#111413] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#FAF6F0]">{p.fullName}</span>
                    <span className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded ${
                      p.consultantStatus === 'VISA_ENDORSED' 
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20' 
                        : 'bg-white/5 text-[#9C968A]'
                    }`}>
                      {p.consultantStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9C968A] truncate">
                    {p.indianInstitution || 'University'} • Anabin [{p.anabinStatus}]
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Case Review & Consular Endorsement Sheet */}
        <div className="lg:col-span-8">
          {selectedProfile ? (
            <div className="bg-[#111413] border border-white/10 rounded-2xl p-7 sm:p-9 space-y-6 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                    Case Review Workspace
                  </span>
                  <h3 className="font-serif-display text-2xl text-[#FAF6F0]">
                    {selectedProfile.fullName}
                  </h3>
                  <p className="text-xs text-[#9C968A] mt-0.5">
                    {selectedProfile.email} • {selectedProfile.targetPathway.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="font-mono-numbers text-xs text-[#C5A880] bg-[#C5A880]/10 px-3 py-1 rounded-lg border border-[#C5A880]/20">
                  Current Status: {selectedProfile.consultantStatus}
                </span>
              </div>

              {/* Core Credentials Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                  <span className="text-[#9C968A] text-[10px]">Bavarian Grade</span>
                  <p className="font-serif-display text-2xl font-medium text-[#FAF6F0]">
                    {selectedProfile.evaluation?.germanGradeEquivalent?.toFixed(1) || 'Pending'}
                  </p>
                  <p className="text-[10px] text-[#9C968A]">Score: {selectedProfile.obtainedScore}/{selectedProfile.maximumScore}</p>
                </div>
                <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                  <span className="text-[#9C968A] text-[10px]">KMK Anabin</span>
                  <p className="font-mono-numbers text-2xl font-semibold text-[#C5A880]">
                    [{selectedProfile.anabinStatus}]
                  </p>
                  <p className="text-[10px] text-[#9C968A] truncate">{selectedProfile.indianInstitution}</p>
                </div>
                <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-1">
                  <span className="text-[#9C968A] text-[10px]">Documents Ingested</span>
                  <p className="font-serif-display text-2xl font-medium text-[#FAF6F0]">
                    {selectedProfile.documents.length}
                  </p>
                  <p className="text-[10px] text-[#9C968A]">
                    {selectedProfile.documents.filter(d => d.status === 'VERIFIED').length} verified
                  </p>
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <h4 className="font-serif-display text-lg text-[#FAF6F0]">
                  Official Consular Action & Endorsement Notes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('VISA_ENDORSED')}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      reviewStatus === 'VISA_ENDORSED'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : 'bg-[#161A18] border-white/10 text-[#9C968A]'
                    }`}
                  >
                    ✓ Issue Visa Endorsement
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('REVISIONS_REQUESTED')}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      reviewStatus === 'REVISIONS_REQUESTED'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-[#161A18] border-white/10 text-[#9C968A]'
                    }`}
                  >
                    ⚠ Request Revisions
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('UNDER_REVIEW')}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      reviewStatus === 'UNDER_REVIEW'
                        ? 'bg-[#1C201E] border-[#C5A880] text-[#FAF6F0]'
                        : 'bg-[#161A18] border-white/10 text-[#9C968A]'
                    }`}
                  >
                    In Detailed Audit
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE8DE] mb-1.5">
                    Consular Advisor Review Findings & Statutory Notes
                  </label>
                  <textarea
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter official evaluation notes, missing consular prerequisites, or endorsement justification..."
                    className="w-full bg-[#161A18] border border-white/10 rounded-xl p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880] resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={isSubmitting || !reviewNotes.trim()}
                    className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Recording Action...' : 'Save & Issue Consular Determination'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 bg-[#111413] border border-white/10 rounded-2xl text-center text-xs text-[#9C968A]">
              Select an applicant from the queue to conduct consular review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
