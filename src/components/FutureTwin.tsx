import React, { useState, useEffect } from 'react';
import { 
  ApplicantProfile, 
  HypotheticalVariables, 
  ScenarioComparison, 
  FutureTwinScenario, 
  GermanLevel, 
  PathwayType 
} from '../types/index.ts';
import { 
  Sliders, 
  Sparkles, 
  ArrowRight, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Save, 
  Trash2, 
  RotateCcw, 
  GraduationCap, 
  Languages, 
  Briefcase, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { syncScenarioToFirestore, deleteScenarioFromFirestore } from '../services/firestoreService.ts';

interface FutureTwinProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
  onRefreshProfile?: () => Promise<void>;
}

export const FutureTwin: React.FC<FutureTwinProps> = ({
  profile,
  onNavigateTab,
  onRefreshProfile
}) => {
  // Current Profile Snapshot
  const initialVariables: HypotheticalVariables = {
    germanLevel: profile.germanLevel || 'A2',
    englishScore: profile.englishScore || '7.5 (C1)',
    yearsOfWorkExperience: profile.yearsOfWorkExperience || 1,
    highestDegree: profile.highestDegree || 'Bachelor of Technology',
    targetPathway: profile.targetPathway || 'HIGHER_EDUCATION',
    blockedAccountPrepared: profile.blockedAccountPrepared || false,
    verifiedFundsEur: profile.blockedAccountPrepared ? 11904 : 0,
    apsVerified: profile.documents.some(d => d.type === 'APS_CERTIFICATE'),
    ectsPoints: (profile.highestDegree || '').toLowerCase().includes('b.tech') ? 240 : 180,
    hasGermanCert: profile.documents.some(d => d.type === 'GERMAN_CERTIFICATE'),
    additionalCertifications: []
  };

  const [hypothetical, setHypothetical] = useState<HypotheticalVariables>(initialVariables);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<FutureTwinScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('B2 German & APS Verified');
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessNotice, setApplySuccessNotice] = useState<string | null>(null);

  // Load saved scenarios
  useEffect(() => {
    fetch(`/api/future-twin/scenarios/${profile.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSavedScenarios(data);
      })
      .catch(err => console.warn('Could not load saved scenarios:', err));
  }, [profile.id]);

  // Run simulation on variable change
  const runSimulation = async (vars: HypotheticalVariables) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/future-twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          hypotheticalVariables: vars
        })
      });
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation(hypothetical);
  }, [
    hypothetical.germanLevel,
    hypothetical.englishScore,
    hypothetical.yearsOfWorkExperience,
    hypothetical.targetPathway,
    hypothetical.blockedAccountPrepared,
    hypothetical.apsVerified,
    hypothetical.hasGermanCert
  ]);

  const handleVariableChange = <K extends keyof HypotheticalVariables>(key: K, value: HypotheticalVariables[K]) => {
    setHypothetical(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetToCurrent = () => {
    setHypothetical(initialVariables);
  };

  const handleSaveScenario = async () => {
    if (!comparison || !scenarioName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/future-twin/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: profile.id,
          name: scenarioName.trim(),
          description: `Simulated for ${hypothetical.targetPathway.replace(/_/g, ' ')} with German ${hypothetical.germanLevel}`,
          hypotheticalVariables: hypothetical,
          comparison
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedScenarios(prev => [saved, ...prev]);
        setSaveNotice(`Scenario "${scenarioName}" saved.`);
        await syncScenarioToFirestore(saved);
        setTimeout(() => setSaveNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error saving scenario:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      await fetch(`/api/future-twin/scenarios/${id}`, { method: 'DELETE' });
      setSavedScenarios(prev => prev.filter(s => s.id !== id));
      await deleteScenarioFromFirestore(id);
    } catch (err) {
      console.error('Error deleting scenario:', err);
    }
  };

  const handleLoadScenario = (scenario: FutureTwinScenario) => {
    setHypothetical(scenario.hypotheticalVariables);
    setScenarioName(scenario.name);
    setComparison(scenario.comparison);
  };

  const handleApplyToProfile = async () => {
    setIsApplying(true);
    try {
      const res = await fetch('/api/future-twin/apply-to-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          scenarioId: savedScenarios[0]?.id || 'custom',
          userConfirmed: true
        })
      });
      if (res.ok) {
        setShowApplyConfirm(false);
        setApplySuccessNotice('Profile successfully updated with confirmed scenario attributes.');
        if (onRefreshProfile) await onRefreshProfile();
        setTimeout(() => setApplySuccessNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error applying scenario to profile:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE INTELLIGENCE SUITE</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>FEATURE 01</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Scenario Twin</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            EUROBRIDGE FutureTwin
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-3xl font-light leading-relaxed">
            AI-powered scenario simulator. Test hypothetical upgrades in German language proficiency, professional experience, APS document verification, and relocation finances without altering your verified profile.
          </p>
        </div>

        {/* Safeguard Disclaimer Badge */}
        <div className="p-3 bg-[#161A18] border border-amber-500/30 rounded-xl flex items-center gap-3 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-[11px] text-amber-200/90 leading-tight">
            <span className="font-semibold block">Hypothetical Simulator</span>
            <span>Profile remains untouched unless explicitly confirmed.</span>
          </div>
        </div>
      </div>

      {/* Success / Alert Notices */}
      {saveNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveNotice}</span>
          </div>
        </div>
      )}

      {applySuccessNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{applySuccessNotice}</span>
          </div>
        </div>
      )}

      {/* Main Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: My Current Profile (5 cols) */}
        <div className="lg:col-span-5 bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
                Baseline Credentials
              </span>
              <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
                My Current Profile
              </h2>
            </div>
            <span className="text-[10px] font-mono-numbers px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#C5A880]">
              VERIFIED
            </span>
          </div>

          {/* Current Key Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
              <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Consular Score</span>
              <p className="font-serif-display text-2xl text-[#FAF6F0] font-medium mt-1">
                {profile.evaluation?.overallScore || 85}<span className="text-xs text-[#9C968A]">/100</span>
              </p>
            </div>
            <div className="p-3.5 bg-[#161A18] rounded-xl border border-white/10">
              <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Bavarian Grade</span>
              <p className="font-serif-display text-2xl text-[#FAF6F0] font-medium mt-1">
                {profile.evaluation?.germanGradeEquivalent ? profile.evaluation.germanGradeEquivalent.toFixed(1) : '2.0'}
              </p>
            </div>
          </div>

          {/* Current Profile Attributes List */}
          <div className="space-y-3 text-xs divide-y divide-white/[0.06]">
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <Languages className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>German Language:</span>
              </span>
              <span className="font-mono-numbers font-medium text-[#FAF6F0]">
                {profile.germanLevel || 'A2'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <Languages className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>English Test:</span>
              </span>
              <span className="font-mono-numbers font-medium text-[#FAF6F0]">
                {profile.englishScore || '7.5 (C1)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Work Experience:</span>
              </span>
              <span className="font-mono-numbers font-medium text-[#FAF6F0]">
                {profile.yearsOfWorkExperience || 1} Year(s)
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Target Pathway:</span>
              </span>
              <span className="font-medium text-[#FAF6F0]">
                {profile.targetPathway.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>APS India Token:</span>
              </span>
              <span className={`font-mono-numbers text-[11px] ${
                profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {profile.documents.some(d => d.type === 'APS_CERTIFICATE') ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#9C968A] flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Blocked Account:</span>
              </span>
              <span className={`font-mono-numbers text-[11px] ${
                profile.blockedAccountPrepared ? 'text-emerald-400' : 'text-[#9C968A]'
              }`}>
                {profile.blockedAccountPrepared ? '€11,904 Deposited' : 'Unprepared'}
              </span>
            </div>
          </div>

          {/* Current Evaluation Eligibility Tag */}
          <div className="p-4 bg-[#161A18] border border-white/10 rounded-xl space-y-2">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
              Current Legal Determination
            </span>
            <p className="font-serif-display text-lg text-[#FAF6F0]">
              {profile.evaluation?.overallEligibility.replace(/_/g, ' ') || 'CONDITIONALLY ELIGIBLE'}
            </p>
            <p className="text-[11px] text-[#9C968A] leading-relaxed">
              {profile.evaluation?.blockersAndRisks[0] || 'APS certification pending under Section 16b AufenthG.'}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: My Future Scenario (7 cols) */}
        <div className="lg:col-span-7 bg-[#111413] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                  Hypothetical Sandbox
                </span>
              </div>
              <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
                My Future Scenario
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="px-2.5 py-1.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 rounded-lg text-[11px] text-[#9C968A] hover:text-[#FAF6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset simulation to current profile values"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="space-y-4">
            <span className="text-[11px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
              Adjust Hypothetical Variables
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Variable 1: German Language */}
              <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-1.5">
                <label className="block font-medium text-[#FAF6F0]">
                  Hypothetical German Level (CEFR)
                </label>
                <select
                  value={hypothetical.germanLevel}
                  onChange={(e) => handleVariableChange('germanLevel', e.target.value as GermanLevel)}
                  className="w-full bg-[#111413] border border-white/10 rounded-lg p-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate - Dual Ausbildung Standard)</option>
                  <option value="B2">B2 (Vantage - German University Direct Access)</option>
                  <option value="C1">C1 (Proficient / TestDaF 4x4)</option>
                </select>
                <span className="text-[10px] text-[#9C968A] block">
                  {hypothetical.germanLevel === 'B1' ? 'Unlocks Ausbildung & +2 Opportunity Card pts' :
                   hypothetical.germanLevel === 'B2' ? 'Direct German university admission & +3 pts' :
                   'Baseline language standard'}
                </span>
              </div>

              {/* Variable 2: Work Experience */}
              <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-medium text-[#FAF6F0]">
                    Work Experience: {hypothetical.yearsOfWorkExperience} Year(s)
                  </label>
                  <span className="font-mono-numbers text-[#C5A880] text-[11px]">
                    {hypothetical.yearsOfWorkExperience >= 5 ? '+3 pts' : hypothetical.yearsOfWorkExperience >= 2 ? '+2 pts' : '+0 pts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={hypothetical.yearsOfWorkExperience}
                  onChange={(e) => handleVariableChange('yearsOfWorkExperience', Number(e.target.value))}
                  className="w-full accent-[#C5A880] cursor-pointer"
                />
                <span className="text-[10px] text-[#9C968A] block">
                  {hypothetical.yearsOfWorkExperience >= 2 ? 'Meets Section 20a Opportunity Card experience criterion' : 'Entry-level graduate standing'}
                </span>
              </div>

              {/* Variable 3: Target Pathway */}
              <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-1.5">
                <label className="block font-medium text-[#FAF6F0]">
                  Target Pathway
                </label>
                <select
                  value={hypothetical.targetPathway}
                  onChange={(e) => handleVariableChange('targetPathway', e.target.value as PathwayType)}
                  className="w-full bg-[#111413] border border-white/10 rounded-lg p-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="HIGHER_EDUCATION">Higher Education (Master / Bachelor)</option>
                  <option value="AUSBILDUNG">Duale Ausbildung (Vocational Training)</option>
                  <option value="EMPLOYMENT">Skilled Employment / Chancenkarte</option>
                </select>
              </div>

              {/* Variable 4: English Score */}
              <div className="p-3.5 bg-[#161A18] border border-white/10 rounded-xl space-y-1.5">
                <label className="block font-medium text-[#FAF6F0]">
                  English Score
                </label>
                <select
                  value={hypothetical.englishScore}
                  onChange={(e) => handleVariableChange('englishScore', e.target.value)}
                  className="w-full bg-[#111413] border border-white/10 rounded-lg p-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="6.5 (B2)">IELTS 6.5 (B2 Competent)</option>
                  <option value="7.5 (C1)">IELTS 7.5 (C1 Proficient)</option>
                  <option value="8.0 (C1+)">IELTS 8.0 (C1 Advanced)</option>
                  <option value="8.5 (C2)">IELTS 8.5 (C2 Mastery)</option>
                </select>
              </div>
            </div>

            {/* Toggle Checkboxes: APS & Blocked Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="p-3 bg-[#161A18] border border-white/10 rounded-xl flex items-center gap-3 cursor-pointer hover:border-[#C5A880]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hypothetical.apsVerified}
                  onChange={(e) => handleVariableChange('apsVerified', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880]"
                />
                <div className="text-xs">
                  <span className="font-medium text-[#FAF6F0] block">APS India Verified</span>
                  <span className="text-[10px] text-[#9C968A]">Digital verification token issued</span>
                </div>
              </label>

              <label className="p-3 bg-[#161A18] border border-white/10 rounded-xl flex items-center gap-3 cursor-pointer hover:border-[#C5A880]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hypothetical.blockedAccountPrepared}
                  onChange={(e) => handleVariableChange('blockedAccountPrepared', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880]"
                />
                <div className="text-xs">
                  <span className="font-medium text-[#FAF6F0] block">€11,904 Blocked Account</span>
                  <span className="text-[10px] text-[#9C968A]">Maintenance funds deposited</span>
                </div>
              </label>
            </div>
          </div>

          {/* SIMULATION RESULT DISPLAY */}
          {comparison && (
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              
              {/* Delta Score Banner */}
              <div className="p-4 bg-[#161A18] border border-[#C5A880]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">
                    Simulated Determination
                  </span>
                  <h3 className="font-serif-display text-xl text-[#FAF6F0] mt-0.5">
                    {comparison.hypotheticalEvaluation.overallEligibility.replace(/_/g, ' ')}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Consular Match</span>
                    <p className="font-serif-display text-2xl font-medium text-[#C5A880]">
                      {comparison.hypotheticalEvaluation.overallScore}/100
                    </p>
                  </div>
                  {comparison.scoreDifference !== 0 && (
                    <span className={`px-2.5 py-1 rounded text-xs font-mono-numbers font-semibold ${
                      comparison.scoreDifference > 0 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}>
                      {comparison.scoreDifference > 0 ? `+${comparison.scoreDifference}` : comparison.scoreDifference} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Explanations of What Changes */}
              <div className="space-y-2 text-xs">
                <span className="font-mono-numbers uppercase tracking-widest text-[10px] text-[#C5A880] block">
                  Simulated Impact Analysis:
                </span>
                
                {comparison.satisfiedGaps.length > 0 && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                    <p className="font-semibold text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Requirements Satisfied Under Simulation ({comparison.satisfiedGaps.length})</span>
                    </p>
                    <ul className="list-disc pl-4 text-emerald-200/90 space-y-0.5 text-[11px]">
                      {comparison.satisfiedGaps.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.remainingGaps.length > 0 && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-1">
                    <p className="font-semibold text-amber-300 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remaining Prerequisites ({comparison.remainingGaps.length})</span>
                    </p>
                    <ul className="list-disc pl-4 text-amber-200/90 space-y-0.5 text-[11px]">
                      {comparison.remainingGaps.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions Toolbar */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Scenario name..."
                    className="bg-[#161A18] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880] w-48"
                  />
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Scenario</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('gap2growth')}
                    className="px-3 py-1.5 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-medium text-[#FAF6F0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Explore Courses (Gap2Growth)</span>
                    <ArrowRight className="w-3 h-3 text-[#C5A880]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyConfirm(true)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#9C968A] hover:text-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
                  >
                    Apply to Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Scenarios Comparison Carousel / Cards */}
      {savedScenarios.length > 0 && (
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Comparison Archive
              </span>
              <h3 className="font-serif-display text-xl text-[#FAF6F0] mt-0.5">
                Saved Hypothetical Scenarios ({savedScenarios.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedScenarios.map((sc) => (
              <div 
                key={sc.id} 
                className="p-4 bg-[#161A18] border border-white/10 hover:border-[#C5A880]/50 rounded-xl space-y-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif-display text-base text-[#FAF6F0] font-normal">{sc.name}</h4>
                    <p className="text-[10px] font-mono-numbers text-[#9C968A] mt-0.5">
                      {new Date(sc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteScenario(sc.id)}
                    className="text-[#9C968A] hover:text-red-400 p-1 cursor-pointer transition-colors"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9C968A]">German:</span>
                    <span className="font-medium text-[#FAF6F0]">{sc.hypotheticalVariables.germanLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9C968A]">Experience:</span>
                    <span className="font-medium text-[#FAF6F0]">{sc.hypotheticalVariables.yearsOfWorkExperience}y</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9C968A]">Simulated Score:</span>
                    <span className="font-mono-numbers font-semibold text-[#C5A880]">
                      {sc.comparison.hypotheticalEvaluation.overallScore}/100
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center">
                  <span className="text-[10px] font-mono-numbers text-emerald-400">
                    {sc.comparison.scoreDifference > 0 ? `+${sc.comparison.scoreDifference} pts` : 'No change'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLoadScenario(sc)}
                    className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Load Simulation</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal: Apply Scenario to Real Profile */}
      {showApplyConfirm && (
        <div className="fixed inset-0 z-50 bg-[#0B0D0C]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111413] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#EDE8DE]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display text-lg text-[#FAF6F0]">Confirm Profile Update</h3>
                <p className="text-xs text-[#9C968A]">FutureTwin Safeguard Protocol</p>
              </div>
            </div>

            <p className="text-xs text-[#EDE8DE] leading-relaxed">
              You are about to update your actual applicant profile with the simulated variables:
              German <strong>{hypothetical.germanLevel}</strong>, Work Experience <strong>{hypothetical.yearsOfWorkExperience}y</strong>, Pathway <strong>{hypothetical.targetPathway.replace(/_/g, ' ')}</strong>.
            </p>
            <p className="text-[11px] text-amber-200/90 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
              Note: German universities and visa consulates will require authentic documentary proof (certificates and transcripts) for all updated attributes.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApplyConfirm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg text-[#9C968A] hover:text-[#FAF6F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyToProfile}
                disabled={isApplying}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'Yes, Update My Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
