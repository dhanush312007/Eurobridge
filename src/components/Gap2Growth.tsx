import React, { useState, useEffect } from 'react';
import { 
  ApplicantProfile, 
  SkillGapItem, 
  CourseRecommendation, 
  LearningGrowthPlan 
} from '../types/index.ts';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  Target, 
  Award, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  FileText,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { syncLearningPlanToFirestore, deleteLearningPlanFromFirestore } from '../services/firestoreService.ts';

interface Gap2GrowthProps {
  profile: ApplicantProfile;
  onNavigateTab: (tab: string) => void;
  onTriggerEvaluation?: () => Promise<void>;
}

export const Gap2Growth: React.FC<Gap2GrowthProps> = ({
  profile,
  onNavigateTab,
  onTriggerEvaluation
}) => {
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<{ course: CourseRecommendation; addressedGaps: SkillGapItem[]; relevance: number }[]>([]);
  const [learningPlans, setLearningPlans] = useState<LearningGrowthPlan[]>([]);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<CourseRecommendation | null>(null);
  const [isEnrollingPlan, setIsEnrollingPlan] = useState<string | null>(null);
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);
  const [reassessingPlanId, setReassessingPlanId] = useState<string | null>(null);
  const [reassessmentNotice, setReassessmentNotice] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Load gaps, course recommendations and active plans
  const loadGapData = async () => {
    try {
      const [gapsRes, plansRes] = await Promise.all([
        fetch(`/api/gap2growth/gaps/${profile.id}`),
        fetch(`/api/gap2growth/plans/${profile.id}`)
      ]);

      if (gapsRes.ok) {
        const data = await gapsRes.json();
        setGaps(data.gaps || []);
        setRecommendedCourses(data.recommendedCourses || []);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setLearningPlans(plansData || []);
      }
    } catch (err) {
      console.warn('Error loading Gap2Growth data:', err);
    }
  };

  useEffect(() => {
    loadGapData();
  }, [profile.id, profile.updatedAt]);

  const handleCreatePlan = async (gapId: string, courseId: string) => {
    setIsEnrollingPlan(courseId);
    try {
      const res = await fetch('/api/gap2growth/create-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: profile.id,
          gapId,
          courseId
        })
      });
      if (res.ok) {
        const newPlan = await res.json();
        setLearningPlans(prev => [newPlan, ...prev]);
        setEnrolledNotice(`Added "${newPlan.course.title}" to your active Growth Plan.`);
        syncLearningPlanToFirestore(newPlan).catch(e => console.warn('Sync learning plan warning:', e));
        setTimeout(() => setEnrolledNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error creating learning plan:', err);
    } finally {
      setIsEnrollingPlan(null);
    }
  };

  const handleToggleMilestone = async (planId: string, milestoneId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/gap2growth/plans/${planId}/milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, completed })
      });
      if (res.ok) {
        const updated = await res.json();
        setLearningPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
        syncLearningPlanToFirestore(updated).catch(e => console.warn('Sync learning plan warning:', e));
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  const handleRequestReassessment = async (planId: string) => {
    setReassessingPlanId(planId);
    try {
      const res = await fetch(`/api/gap2growth/plans/${planId}/reassess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: profile.id })
      });
      if (res.ok) {
        setReassessmentNotice('Autonomous qualification reassessment completed. Check your updated dossier score!');
        if (onTriggerEvaluation) await onTriggerEvaluation();
        setTimeout(() => setReassessmentNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error requesting reassessment:', err);
    } finally {
      setReassessingPlanId(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await fetch(`/api/gap2growth/plans/${planId}`, { method: 'DELETE' });
      setLearningPlans(prev => prev.filter(p => p.id !== planId));
      deleteLearningPlanFromFirestore(planId).catch(e => console.warn('Delete learning plan warning:', e));
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const filteredCourses = filterCategory === 'ALL'
    ? recommendedCourses
    : recommendedCourses.filter(rc => rc.course.targetGapCategories.includes(filterCategory as any));

  const mandatoryGaps = gaps.filter(g => g.isMandatory);
  const optionalGaps = gaps.filter(g => !g.isMandatory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE INTELLIGENCE SUITE</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>FEATURE 04</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Qualification Bridging</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            EUROBRIDGE Gap2Growth
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-3xl font-light leading-relaxed">
            Autonomous skill-gap intelligence: Detect missing qualifications, ECTS deficits, language thresholds, and document verifications — then discover verified, source-backed learning resources to bridge them.
          </p>
        </div>

        {/* Workflow Cycle Pill */}
        <div className="p-3 bg-[#161A18] border border-white/10 rounded-2xl flex items-center gap-2 text-[10px] font-mono-numbers text-[#C5A880] uppercase tracking-wider shrink-0">
          <span>DETECT GAP</span>
          <span>→</span>
          <span>REAL COURSE</span>
          <span>→</span>
          <span>ROADMAP</span>
          <span>→</span>
          <span>REASSESS</span>
        </div>
      </div>

      {/* Success Notices */}
      {enrolledNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{enrolledNotice}</span>
        </div>
      )}

      {reassessmentNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reassessmentNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('evaluation')}
            className="text-[11px] font-semibold text-[#C5A880] hover:underline cursor-pointer"
          >
            View Evaluation Results →
          </button>
        </div>
      )}

      {/* SECTION 1: Detected Gaps Matrix */}
      <div className="bg-[#111413] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Automated Diagnostic Audit
            </span>
            <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
              Identified Qualification & Document Gaps ({gaps.length})
            </h2>
          </div>

          <span className="text-xs font-mono-numbers text-[#9C968A]">
            {mandatoryGaps.length} Statutory Mandatory • {optionalGaps.length} Development Recommendations
          </span>
        </div>

        {/* Gaps List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((gap) => (
            <div 
              key={gap.id}
              className={`p-5 rounded-xl border text-xs space-y-3 ${
                gap.isMandatory 
                  ? 'bg-red-950/20 border-red-500/30' 
                  : 'bg-[#161A18] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[9px] font-mono-numbers uppercase px-1.5 py-0.5 rounded border ${
                    gap.isMandatory 
                      ? 'bg-red-950/60 text-red-300 border-red-500/30' 
                      : 'bg-white/5 text-[#9C968A] border-white/10'
                  }`}>
                    {gap.isMandatory ? 'MANDATORY CRITERION' : 'PERSONAL DEVELOPMENT'}
                  </span>
                  <h4 className="font-serif-display text-base text-[#FAF6F0] mt-1.5 font-normal">
                    {gap.title}
                  </h4>
                </div>
                <span className="font-mono-numbers text-xs text-[#C5A880] font-semibold">
                  Priority {gap.impactScore}/10
                </span>
              </div>

              <p className="text-xs text-[#EDE8DE] leading-relaxed">
                {gap.description}
              </p>

              <div className="p-2.5 bg-[#111413] rounded-lg text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#9C968A]">Current Status:</span>
                  <span className="font-medium text-[#FAF6F0]">{gap.currentValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C968A]">Target Requirement:</span>
                  <span className="font-semibold text-[#C5A880]">{gap.requiredValue}</span>
                </div>
              </div>

              <p className="text-[10px] text-[#9C968A] italic">
                Legal standard: {gap.statutoryCitation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Active Growth Roadmaps (If Enrolled) */}
      {learningPlans.length > 0 && (
        <div className="bg-[#111413] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Active Individual Roadmap
              </span>
              <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
                My Growth Plans ({learningPlans.length})
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            {learningPlans.map((plan) => (
              <div key={plan.id} className="p-6 bg-[#161A18] border border-white/10 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                      Target: {plan.gapTitle}
                    </span>
                    <h3 className="font-serif-display text-xl text-[#FAF6F0] font-normal mt-0.5">
                      {plan.course.title}
                    </h3>
                    <p className="text-xs text-[#9C968A]">
                      Provider: {plan.course.provider} • Format: {plan.course.format}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">Progress</span>
                      <p className="font-mono-numbers text-xl font-semibold text-[#C5A880]">
                        {plan.progressPercentage}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1 text-[#9C968A] hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Milestones Checkbox Checklist */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#9C968A] block">
                    Structured Learning Milestones:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {plan.milestones.map((m) => (
                      <label 
                        key={m.id}
                        className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                          m.completed 
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                            : 'bg-[#111413] border-white/10 text-[#EDE8DE]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={(e) => handleToggleMilestone(plan.id, m.id, e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 text-[#C5A880] focus:ring-[#C5A880] mt-0.5 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <span className={`font-medium text-xs ${m.completed ? 'line-through text-[#9C968A]' : 'text-[#FAF6F0]'}`}>
                            Week {m.weekNumber}: {m.title}
                          </span>
                          <p className="text-[10px] text-[#9C968A]">{m.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Plan Actions: View Course & Reassess */}
                <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <a
                    href={plan.course.courseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C5A880] hover:underline flex items-center gap-1.5 font-medium"
                  >
                    <span>Open Provider Course Page ({plan.course.provider})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('future-twin')}
                      className="text-xs text-[#9C968A] hover:text-[#FAF6F0] transition-colors cursor-pointer"
                    >
                      Simulate Impact in FutureTwin →
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestReassessment(plan.id)}
                      disabled={reassessingPlanId === plan.id}
                      className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{reassessingPlanId === plan.id ? 'Reassessing...' : 'Request Qualification Reassessment'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Sourced Course Recommendation Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Verified Education Catalog
            </span>
            <h2 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-0.5">
              Source-Backed Course & Certificate Recommendations
            </h2>
            <p className="text-xs text-[#9C968A] mt-0.5">
              All courses connect directly to official German examination centers (Goethe-Institut, DAAD, uni-assist, RWTH Aachen).
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            {['ALL', 'LANGUAGE_PROFICIENCY', 'DOCUMENT_COMPLIANCE', 'ACADEMIC_PREPARATION', 'PROFESSIONAL_SKILL', 'FINANCIAL_READINESS'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono-numbers transition-colors whitespace-nowrap cursor-pointer ${
                  filterCategory === cat 
                    ? 'bg-[#C5A880] text-[#0B0D0C] font-semibold' 
                    : 'bg-[#161A18] text-[#9C968A] hover:text-[#FAF6F0] border border-white/10'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(({ course, addressedGaps, relevance }) => (
            <div 
              key={course.id}
              className="bg-[#111413] border border-white/10 hover:border-[#C5A880]/50 rounded-2xl p-6 flex flex-col justify-between transition-all space-y-4 shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#C5A880]">
                    {course.provider}
                  </span>
                  <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
                    Match: {relevance}/10
                  </span>
                </div>

                <h3 className="font-serif-display text-xl text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-[#9C968A] leading-relaxed">
                  {course.whyRecommended}
                </p>

                {/* Addressed Skills List */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono-numbers uppercase tracking-wider text-[#9C968A] block mb-1">
                    Skills Addressed:
                  </span>
                  <ul className="text-[11px] text-[#EDE8DE] space-y-1">
                    {course.skillsAddressed.slice(0, 2).map((skill, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5">
                        <span className="text-[#C5A880]">✓</span>
                        <span className="line-clamp-1">{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Course Meta Info Strip */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08] text-xs">
                <div className="flex justify-between text-[#9C968A]">
                  <span>Format:</span>
                  <span className="text-[#FAF6F0] font-medium">{course.format.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-[#9C968A]">
                  <span>Cost:</span>
                  <span className="font-mono-numbers font-semibold text-[#C5A880]">{course.costDisplay}</span>
                </div>
                <div className="flex justify-between text-[#9C968A]">
                  <span>Credential:</span>
                  <span className="text-[#FAF6F0] truncate max-w-[170px]" title={course.certificateDetails}>
                    {course.certificateDetails}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <a
                    href={course.courseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#9C968A] hover:text-[#FAF6F0] border border-white/10 hover:border-white/20 rounded-lg transition-colors inline-flex items-center gap-1"
                    title="View official provider portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Portal</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCreatePlan(addressedGaps[0]?.id || 'gap-general', course.id)}
                    disabled={isEnrollingPlan === course.id}
                    className="px-3.5 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEnrollingPlan === course.id ? 'Adding...' : 'Add to Growth Plan'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
