import React, { useState, useEffect } from 'react';
import { ApplicantProfile, PathwayType, GermanLevel } from '../types/index.ts';
import { calculateBavarianGrade, ANABIN_INDIAN_INSTITUTIONS } from '../../server/data/anabin.ts';
import { DossierProgressMeter } from './DossierProgressMeter.tsx';
import { GraduationCap, Languages, DollarSign, Calculator, CheckCircle2 } from 'lucide-react';

interface ProfileBuilderProps {
  profile: ApplicantProfile;
  onUpdateProfile: (updated: ApplicantProfile) => void;
  onTriggerEvaluation: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ProfileBuilder: React.FC<ProfileBuilderProps> = ({
  profile,
  onUpdateProfile,
  onTriggerEvaluation,
  onNavigateTab
}) => {
  const [formData, setFormData] = useState<ApplicantProfile>(profile);
  const [bavarianPreview, setBavarianPreview] = useState(
    calculateBavarianGrade(profile.obtainedScore, profile.maximumScore, profile.minimumPassingScore)
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    const calc = calculateBavarianGrade(
      Number(formData.obtainedScore) || 0,
      Number(formData.maximumScore) || 10,
      Number(formData.minimumPassingScore) || 4
    );
    setBavarianPreview(calc);
  }, [formData.obtainedScore, formData.maximumScore, formData.minimumPassingScore]);

  const handleChange = (field: keyof ApplicantProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInstitutionSelect = (instName: string) => {
    const matched = ANABIN_INDIAN_INSTITUTIONS.find(i => i.name === instName);
    setFormData(prev => ({
      ...prev,
      indianInstitution: instName,
      anabinStatus: matched ? matched.status : 'H+'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            Applicant Credentials & Pathway Parameters
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl text-[#FAF6F0] font-normal mt-1">
            Progressive Profile Builder
          </h2>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-1 max-w-xl font-light">
            Grounded against the German Central Office for Foreign Education (ZAB) and Bavarian Academic Grade standards.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <DossierProgressMeter
            profile={profile}
            onNavigateTab={onNavigateTab}
            size={38}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={onTriggerEvaluation}
              className="px-4 py-2.5 bg-[#161A18] border border-white/10 text-[#FAF6F0] rounded-lg text-xs font-semibold hover:bg-[#1D2220] transition-colors whitespace-nowrap cursor-pointer"
            >
              Run Pipeline
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile parameters saved to your persistent dossier.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Target Pathway */}
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-serif-display text-xl text-[#FAF6F0]">
              01. Target Germany Pathway & Legal Objective
            </h3>
            <span className="text-xs font-mono-numbers text-[#C5A880]">Aufenthaltsgesetz</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">
                Immigration Pathway
              </label>
              <select
                aria-label="Immigration Pathway"
                value={formData.targetPathway}
                onChange={(e) => handleChange('targetPathway', e.target.value as PathwayType)}
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="HIGHER_EDUCATION">Higher Education (Master's / Bachelor's) – § 16b</option>
                <option value="AUSBILDUNG">Duale Ausbildung (Paid Vocational Training) – § 16a</option>
                <option value="EMPLOYMENT">Skilled Employment / Chancenkarte – § 20a</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">
                Target Intake Semester
              </label>
              <input
                type="text"
                value={formData.targetIntake}
                onChange={(e) => handleChange('targetIntake', e.target.value)}
                placeholder="e.g. Winter Semester 2026/27"
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic Background */}
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-serif-display text-xl text-[#FAF6F0] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#C5A880]" />
              <span>02. Higher Education & Institutional Classification</span>
            </h3>
            <span className="text-xs font-mono-numbers text-[#C5A880]">KMK Anabin</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">
                Indian University or Degree-Awarding Institution
              </label>
              <input
                type="text"
                list="institutions-list"
                value={formData.indianInstitution}
                onChange={(e) => handleInstitutionSelect(e.target.value)}
                placeholder="Type to search official KMK Anabin recognized Indian institutions..."
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
              />
              <datalist id="institutions-list">
                {ANABIN_INDIAN_INSTITUTIONS.map((inst, idx) => (
                  <option key={idx} value={inst.name}>
                    {inst.state} — Status [{inst.status}]
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">Highest Degree</label>
                <input
                  type="text"
                  value={formData.highestDegree}
                  onChange={(e) => handleChange('highestDegree', e.target.value)}
                  placeholder="e.g. Bachelor of Technology"
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">Major Field of Study</label>
                <input
                  type="text"
                  value={formData.majorFieldOfStudy}
                  onChange={(e) => handleChange('majorFieldOfStudy', e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">Graduation Year</label>
                <input
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => handleChange('graduationYear', Number(e.target.value))}
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bavarian Formula */}
        <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-serif-display text-xl text-[#FAF6F0] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#C5A880]" />
              <span>03. Modified Bavarian Formula (Modifizierte bayerische Formel)</span>
            </h3>
            <span className="text-xs font-mono-numbers text-[#C5A880]">KMK Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">Grading Scale</label>
              <select
                aria-label="Grading Scale"
                value={formData.gradingScaleType}
                onChange={(e) => handleChange('gradingScaleType', e.target.value)}
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="CGPA_10">10-Point Scale (CGPA)</option>
                <option value="PERCENTAGE">Percentage (%) Scale</option>
                <option value="CGPA_4">4.0 Scale</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">Obtained Score (Nd)</label>
              <input
                type="number"
                step="0.01"
                value={formData.obtainedScore}
                onChange={(e) => handleChange('obtainedScore', Number(e.target.value))}
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">Maximum Possible (Nmax)</label>
              <input
                type="number"
                step="0.01"
                value={formData.maximumScore}
                onChange={(e) => handleChange('maximumScore', Number(e.target.value))}
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1.5">Minimum Pass (Nmin)</label>
              <input
                type="number"
                step="0.01"
                value={formData.minimumPassingScore}
                onChange={(e) => handleChange('minimumPassingScore', Number(e.target.value))}
                className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
                Calculated German Grade Equivalent
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-serif-display text-4xl font-medium text-[#FAF6F0]">
                  {bavarianPreview.germanGrade.toFixed(2)}
                </span>
                <span className="text-xs text-[#C5A880] font-medium">
                  {bavarianPreview.classification}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#9C968A] max-w-xs font-mono-numbers">
              {bavarianPreview.formulaString}
            </p>
          </div>
        </div>

        {/* Section 4: Languages & Financing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-serif-display text-xl text-[#FAF6F0] flex items-center gap-2">
                <Languages className="w-5 h-5 text-[#C5A880]" />
                <span>04. Language Competencies</span>
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">German Proficiency (CEFR)</label>
                <select
                  aria-label="German Proficiency (CEFR)"
                  value={formData.germanLevel}
                  onChange={(e) => handleChange('germanLevel', e.target.value as GermanLevel)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="NONE">None / Beginner (A0)</option>
                  <option value="A1">A1 (Goethe / telc certified)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate – Ausbildung prerequisite)</option>
                  <option value="B2">B2 (Vantage – University direct study)</option>
                  <option value="C1">C1 (Advanced / TestDaF 4x4)</option>
                  <option value="C2">C2 (Mastery)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">English Score (IELTS / TOEFL)</label>
                <input
                  type="text"
                  value={formData.englishScore}
                  onChange={(e) => handleChange('englishScore', e.target.value)}
                  placeholder="e.g. IELTS 7.5 Overall"
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-serif-display text-xl text-[#FAF6F0] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C5A880]" />
                <span>05. Financial Proof & Blocked Account</span>
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">Financing Plan</label>
                <select
                  aria-label="Financing Plan"
                  value={formData.plannedFinancingSource}
                  onChange={(e) => handleChange('plannedFinancingSource', e.target.value as any)}
                  className="w-full bg-[#161A18] border border-white/10 rounded-lg p-3 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="BLOCKED_ACCOUNT_SELF">Blocked Account (Sperrkonto €11,904/year)</option>
                  <option value="AUSBILDUNG_SALARY">Ausbildung Monthly Salary (No blocked account needed)</option>
                  <option value="SCHOLARSHIP">DAAD or Institutional Scholarship</option>
                  <option value="VERPFLICHTUNGSERKLAERUNG">Formal Declaration of Commitment (§ 68)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.blockedAccountPrepared}
                    onChange={(e) => handleChange('blockedAccountPrepared', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880]"
                  />
                  <span className="text-xs text-[#EDE8DE]">
                    Blocked account / financial commitment letter already opened & funded
                  </span>
                </label>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-[#C5A880] text-[#0B0D0C] rounded-xl text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-md cursor-pointer"
          >
            Save All Profile Credentials
          </button>
        </div>
      </form>
    </div>
  );
};
