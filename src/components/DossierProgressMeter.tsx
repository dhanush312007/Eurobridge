import React, { useState, useRef, useEffect } from 'react';
import { ApplicantProfile } from '../types/index.ts';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock
} from 'lucide-react';

export interface ProgressStepItem {
  id: string;
  category: 'PROFILE' | 'DOCUMENT' | 'VIDEO' | 'AI_EVAL';
  title: string;
  description: string;
  weight: number;
  completed: boolean;
  statusText: string;
  statusType: 'COMPLETED' | 'IN_PROGRESS' | 'ATTENTION' | 'PENDING';
  targetTab?: string;
}

export function computeDossierCompletion(profile: ApplicantProfile): {
  totalPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  steps: ProgressStepItem[];
  docsVerifiedCount: number;
  docsTotalCount: number;
  docsFlaggedCount: number;
} {
  const docs = profile.documents || [];
  const docsTotalCount = docs.length;
  const docsVerifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
  const docsFlaggedCount = docs.filter(d => d.status === 'FLAGGED').length;

  const hasPersonalInfo = Boolean(
    profile.fullName?.trim() && 
    profile.email?.trim() && 
    profile.cityOfResidence?.trim()
  );

  const hasAcademicInfo = Boolean(
    profile.highestDegree?.trim() && 
    profile.indianInstitution?.trim() && 
    profile.obtainedScore > 0 && 
    profile.graduationYear > 1980
  );

  const hasLanguageInfo = Boolean(
    profile.germanLevel && 
    profile.germanLevel !== 'NONE' && 
    profile.englishScore?.trim()
  );

  const hasFinancialInfo = Boolean(profile.plannedFinancingSource);
  const hasUploadedDocs = docsTotalCount > 0;
  const allDocsVerified = docsTotalCount > 0 && docsVerifiedCount === docsTotalCount;
  const hasDocValidationIssues = docsFlaggedCount > 0;
  const hasPartialDocVerification = docsTotalCount > 0 && docsVerifiedCount > 0 && docsVerifiedCount < docsTotalCount;

  const hasVideo = Boolean(profile.videoIntro && profile.videoIntro.transcript?.trim());
  const hasEvaluation = Boolean(profile.evaluation && profile.evaluation.overallScore > 0);

  const steps: ProgressStepItem[] = [
    {
      id: 'step-personal',
      category: 'PROFILE',
      title: 'Identity & Residence',
      description: 'Legal passport name, contact phone, and Indian domicile',
      weight: 15,
      completed: hasPersonalInfo,
      statusText: hasPersonalInfo ? 'Complete' : 'Missing contact details',
      statusType: hasPersonalInfo ? 'COMPLETED' : 'PENDING',
      targetTab: 'profile'
    },
    {
      id: 'step-academic',
      category: 'PROFILE',
      title: 'Academic Credentials',
      description: 'Degree title, Indian university, and grading scale parameters',
      weight: 15,
      completed: hasAcademicInfo,
      statusText: hasAcademicInfo ? 'Verified' : 'Incomplete academic profile',
      statusType: hasAcademicInfo ? 'COMPLETED' : 'PENDING',
      targetTab: 'profile'
    },
    {
      id: 'step-language',
      category: 'PROFILE',
      title: 'Language & Financing',
      description: 'CEFR German level, English scores, and blocked account',
      weight: 10,
      completed: hasLanguageInfo && hasFinancialInfo,
      statusText: hasLanguageInfo ? 'Specified' : 'Requires German certification',
      statusType: hasLanguageInfo ? 'COMPLETED' : 'PENDING',
      targetTab: 'profile'
    },
    {
      id: 'step-docs-upload',
      category: 'DOCUMENT',
      title: 'Evidence Ingestion',
      description: 'University transcripts, marksheets, and degree certificates',
      weight: 15,
      completed: hasUploadedDocs,
      statusText: hasUploadedDocs ? `${docsTotalCount} files ingested` : 'No documents uploaded',
      statusType: hasUploadedDocs ? 'COMPLETED' : 'PENDING',
      targetTab: 'documents'
    },
    {
      id: 'step-docs-validation',
      category: 'DOCUMENT',
      title: 'Autonomous OCR Audit',
      description: 'Discrepancy screening and institutional verification',
      weight: 15,
      completed: allDocsVerified,
      statusText: allDocsVerified
        ? 'All files authenticated'
        : hasDocValidationIssues
        ? `${docsFlaggedCount} discrepancy flagged`
        : hasPartialDocVerification
        ? `${docsVerifiedCount}/${docsTotalCount} verified`
        : 'Pending OCR evaluation',
      statusType: allDocsVerified 
        ? 'COMPLETED' 
        : hasDocValidationIssues 
        ? 'ATTENTION' 
        : hasPartialDocVerification 
        ? 'IN_PROGRESS' 
        : 'PENDING',
      targetTab: 'documents'
    },
    {
      id: 'step-video',
      category: 'VIDEO',
      title: 'Video Pitch & Articulation',
      description: '30s to 1:00 min spoken pitch with auto-enhanced sound',
      weight: 15,
      completed: hasVideo,
      statusText: hasVideo ? 'Recorded & Uploaded' : 'Pending video recording',
      statusType: hasVideo ? 'COMPLETED' : 'PENDING',
      targetTab: 'video'
    },
    {
      id: 'step-ai-eval',
      category: 'AI_EVAL',
      title: 'Statutory Evaluation Engine',
      description: 'KMK Anabin, Bavarian Grade, and Chancenkarte point audit',
      weight: 15,
      completed: hasEvaluation,
      statusText: hasEvaluation ? 'Determination Issued' : 'Ready to evaluate',
      statusType: hasEvaluation ? 'COMPLETED' : 'PENDING',
      targetTab: 'evaluation'
    }
  ];

  let totalPercentage = 0;
  let completedStepsCount = 0;

  steps.forEach(step => {
    if (step.completed) {
      totalPercentage += step.weight;
      completedStepsCount += 1;
    } else if (step.id === 'step-docs-validation' && hasPartialDocVerification) {
      totalPercentage += Math.round(step.weight * (docsVerifiedCount / Math.max(1, docsTotalCount)));
    }
  });

  totalPercentage = Math.min(100, Math.max(0, totalPercentage));

  return {
    totalPercentage,
    completedStepsCount,
    totalStepsCount: steps.length,
    steps,
    docsVerifiedCount,
    docsTotalCount,
    docsFlaggedCount
  };
}

interface DossierProgressMeterProps {
  profile: ApplicantProfile;
  onNavigateTab?: (tab: string) => void;
  size?: number;
  strokeWidth?: number;
}

export const DossierProgressMeter: React.FC<DossierProgressMeterProps> = ({
  profile,
  onNavigateTab,
  size = 46,
  strokeWidth = 3.5
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    totalPercentage,
    completedStepsCount,
    totalStepsCount,
    steps
  } = computeDossierCompletion(profile);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (totalPercentage / 100) * circumference;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStepClick = (targetTab?: string) => {
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Circular Progress Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        title={`Dossier Readiness: ${totalPercentage}% (${completedStepsCount}/${totalStepsCount} statutory steps completed)`}
      >
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#C5A880"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          
          <span className="absolute font-mono-numbers text-[10px] font-semibold text-[#FAF6F0]">
            {totalPercentage}%
          </span>
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#C5A880]">
            Dossier
          </span>
          <span className="text-[11px] font-medium text-[#EDE8DE] group-hover:text-[#FAF6F0]">
            {completedStepsCount}/{totalStepsCount} Steps
          </span>
        </div>
      </button>

      {/* Breakdown Drawer Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#111413] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-[#EDE8DE] animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-4 bg-[#161A18] border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Statutory Prerequisites
              </span>
              <h3 className="font-serif-display text-base text-[#FAF6F0]">
                Dossier Completeness: {totalPercentage}%
              </h3>
            </div>
            <span className="text-xs font-mono-numbers text-[#9C968A]">
              {completedStepsCount}/{totalStepsCount} Complete
            </span>
          </div>

          {/* List of Steps */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06] p-1">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.targetTab)}
                className="p-3 hover:bg-[#161A18] rounded-xl transition-colors cursor-pointer flex items-start gap-3 text-xs"
              >
                <div className="mt-0.5 shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
                  ) : step.statusType === 'ATTENTION' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#9C968A]" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${step.completed ? 'text-[#FAF6F0]' : 'text-[#9C968A]'}`}>
                      {step.title}
                    </h4>
                    <span className="text-[9px] font-mono-numbers text-[#C5A880]">
                      {step.weight}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9C968A]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
