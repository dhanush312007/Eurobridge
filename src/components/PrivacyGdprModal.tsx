import React, { useState } from 'react';
import { ApplicantProfile } from '../types/index.ts';
import { ShieldCheck, Download, Trash2, X, Lock } from 'lucide-react';

interface PrivacyGdprModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ApplicantProfile;
  onDeleteProfile: () => Promise<void>;
  onDeleteDocument?: (docId: string) => Promise<void>;
}

export const PrivacyGdprModal: React.FC<PrivacyGdprModalProps> = ({
  isOpen,
  onClose,
  profile,
  onDeleteProfile
}) => {
  if (!isOpen) return null;

  const [consentEducationalMatching, setConsentEducationalMatching] = useState(true);
  const [consentDiscrepancyChecking, setConsentDiscrepancyChecking] = useState(true);
  const [consentConsultantReview, setConsentConsultantReview] = useState(true);
  const [allowVideoProcessing, setAllowVideoProcessing] = useState(true);
  const [consentSaved, setConsentSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eurobridge_dossier_${profile.fullName.replace(/\s+/g, '_')}_gdpr.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveConsent = () => {
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D0C]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111413] border border-white/10 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#EDE8DE] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#161A18] text-[#C5A880] flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal">
                DSGVO Privacy & Sovereignty Center
              </h3>
              <p className="text-xs text-[#9C968A]">
                EU General Data Protection Regulation (Regulation EU 2016/679) & German BDSG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9C968A] hover:text-[#FAF6F0] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 text-xs text-[#EDE8DE]">
          
          <div className="p-4 bg-[#161A18] rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#FAF6F0]">
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Statutory Data Protection & Purpose Limitation (Art. 5 DSGVO)</span>
            </div>
            <p className="text-[#9C968A] leading-relaxed">
              Your academic records, APS tokens, and marksheets are ingested solely for qualification equivalence matching and German consular pre-screening. Credentials are never transferred to unauthorized external parties or used for public foundation model retraining.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              01. Consent Controls (Art. 6(1)(a) & Art. 7 DSGVO)
            </h4>
            <div className="bg-[#161A18] border border-white/10 rounded-xl divide-y divide-white/[0.06] p-1">
              
              <div className="p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#FAF6F0]">Academic & Institutional Equivalence Matching</p>
                  <p className="text-[11px] text-[#9C968A]">
                    Cross-references your university and degree against the KMK Anabin database.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consentEducationalMatching}
                  onChange={(e) => setConsentEducationalMatching(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                />
              </div>

              <div className="p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#FAF6F0]">Autonomous Discrepancy Auditing</p>
                  <p className="text-[11px] text-[#9C968A]">
                    Checks for name order variations, grade conversion discrepancies, and APS tokens.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consentDiscrepancyChecking}
                  onChange={(e) => setConsentDiscrepancyChecking(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                />
              </div>

              <div className="p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#FAF6F0]">Consultant Case Access & Endorsement</p>
                  <p className="text-[11px] text-[#9C968A]">
                    Permits certified Educaro Germany advisors to review your case and issue visa endorsements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consentConsultantReview}
                  onChange={(e) => setConsentConsultantReview(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                />
              </div>

              <div className="p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#FAF6F0]">Video Articulation Processing</p>
                  <p className="text-[11px] text-[#9C968A]">
                    Permits audio enhancement and spoken pitch articulation analysis.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowVideoProcessing}
                  onChange={(e) => setAllowVideoProcessing(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                />
              </div>

            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveConsent}
                className="px-4 py-2 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-semibold text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
              >
                {consentSaved ? '✓ Preferences Saved' : 'Update Consent Preferences'}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/[0.08]">
            <h4 className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              02. Right to Data Portability (Art. 20 DSGVO)
            </h4>
            <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-[#FAF6F0]">Download Complete Dossier Archive</p>
                <p className="text-[11px] text-[#9C968A]">
                  Export all profile data, extracted OCR fields, and Bavarian grade calculations as JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3.5 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/[0.08]">
            <h4 className="text-xs font-mono-numbers uppercase tracking-widest text-red-400">
              03. Right to Erasure / "Right to be Forgotten" (Art. 17 DSGVO)
            </h4>
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-red-200">Permanently Delete Dossier</p>
                <p className="text-[11px] text-red-300/80">
                  Irreversibly deletes your applicant profile, uploaded documents, video introductions, and evaluation records.
                </p>
              </div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteProfile();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#FAF6F0] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 bg-red-800 hover:bg-red-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Dossier</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
