export type PathwayType = 'HIGHER_EDUCATION' | 'AUSBILDUNG' | 'EMPLOYMENT';
export type UserRole = 'APPLICANT' | 'CONSULTANT' | 'ADMIN';
export type AnabinStatus = 'H+' | 'H+/-' | 'H-';
export type APSStatus = 'NOT_APPLIED' | 'IN_PROGRESS' | 'VERIFIED' | 'EXEMPT';
export type GermanLevel = 'NONE' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type DocumentType = 
  | 'BACHELOR_DEGREE'
  | 'ACADEMIC_TRANSCRIPT'
  | 'APS_CERTIFICATE'
  | 'GERMAN_CERTIFICATE'
  | 'ENGLISH_CERTIFICATE'
  | 'PASSPORT'
  | 'RESUME'
  | 'EXPERIENCE_LETTER'
  | 'SCHOOL_LEAVING_CERT';

export type VerificationStatus = 'PENDING' | 'PARSED' | 'VERIFIED' | 'FLAGGED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface DocumentEvidence {
  field: string;
  extractedValue: string;
  confidence: number; // 0 to 1
  pageNumber?: number;
  snippet?: string;
}

export interface UploadedDocument {
  id: string;
  applicantId: string;
  type: DocumentType;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  status: VerificationStatus;
  extractedFields: Record<string, string>;
  evidences: DocumentEvidence[];
  flaggedIssues: string[];
}

export interface VideoIntroduction {
  id: string;
  applicantId: string;
  recordedAt: string;
  durationSeconds: number;
  transcript: string;
  englishFluencyScore: number; // 1-10
  germanSpeakingConfidence: number; // 1-10
  motivationSummary: string;
  keyStrengthsDetected: string[];
  applicantConfirmed: boolean;
  videoBlobUrl?: string;
  audioEnhanced?: boolean;
  extractedInfo?: {
    statedFieldOfStudy?: string;
    statedTargetPathway?: string;
    statedGermanLevel?: string;
    keySkillsMentioned?: string[];
    statedCareerAspirations?: string;
  };
}

export interface ClarificationQuestion {
  id: string;
  applicantId: string;
  field: string;
  question: string;
  reason: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  resolved: boolean;
  applicantAnswer?: string;
  createdAt: string;
}

export interface QualificationEvaluation {
  id: string;
  applicantId: string;
  evaluatedAt: string;
  pathway: PathwayType;
  overallEligibility: 'HIGHLY_ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'ACTION_REQUIRED' | 'INELIGIBLE';
  overallScore: number; // 0 to 100
  // Higher Education Specifics
  germanGradeEquivalent?: number; // 1.0 (best) to 4.0 (pass) Bavarian formula
  bavarianFormulaCalculation?: string;
  anabinUniversityStatus?: AnabinStatus;
  apsCertificateStatus?: APSStatus;
  ectsEquivalence?: {
    estimatedECTS: number;
    sufficientForDirectMaster: boolean;
    requiresBridgeOrPreMaster: boolean;
  };
  // Chancenkarte / Opportunity Card Specifics (for Employment pathway)
  chancenkartePoints?: {
    totalPoints: number;
    minimumRequired: number; // 6 points
    breakdown: {
      category: string;
      pointsAwarded: number;
      maxPoints: number;
      explanation: string;
    }[];
  };
  // Ausbildung Specifics
  ausbildungReadiness?: {
    germanLevelAdequate: boolean;
    schoolRecognitionMatch: string;
    stipendExpectationMonthlyEur: number;
    recommendedTrades: string[];
  };
  // Common Assessment
  requirementsMet: string[];
  blockersAndRisks: string[];
  evidenceBackedStrengths: string[];
  financialReadiness: {
    blockedAccountNeededEur: number; // e.g. 11,904 EUR
    verifiedFundsEur?: number;
    status: 'READY' | 'PARTIAL' | 'NOT_STARTED';
  };
}

export interface MilestoneStep {
  id: string;
  title: string;
  description: string;
  stage: 'DOCUMENT_PREPARATION' | 'APS_AND_EVALUATION' | 'APPLICATION' | 'VISA_AND_FINANCE' | 'DEPARTURE';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';
  dueDate?: string;
  estimatedWeeks: number;
  actionItems: string[];
}

export interface ApplicantProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  cityOfResidence: string;
  state: string;
  targetPathway: PathwayType;
  targetIntake: string;
  // Education Background
  highestDegree: string;
  indianInstitution: string;
  anabinStatus: AnabinStatus;
  majorFieldOfStudy: string;
  graduationYear: number;
  gradingScaleType: 'CGPA_10' | 'PERCENTAGE' | 'CGPA_4';
  obtainedScore: number;
  maximumScore: number;
  minimumPassingScore: number;
  // Language proficiencies
  germanLevel: GermanLevel;
  germanCertificateProvider?: string;
  germanCertificateScore?: string;
  englishTestType: 'IELTS' | 'TOEFL' | 'PTE' | 'MEDIUM_OF_INSTRUCTION';
  englishScore: string;
  // Experience
  yearsOfWorkExperience: number;
  currentDesignation?: string;
  industryDomain?: string;
  // Financial status
  plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF' | 'AUSBILDUNG_SALARY' | 'EDUCATION_LOAN' | 'FAMILY_SPONSOR' | 'SCHOLARSHIP' | 'VERPFLICHTUNGSERKLAERUNG';
  blockedAccountPrepared: boolean;
  // Documents and Media
  documents: UploadedDocument[];
  videoIntro?: VideoIntroduction;
  clarifications: ClarificationQuestion[];
  evaluation?: QualificationEvaluation;
  roadmap: MilestoneStep[];
  // Consultant Review
  consultantStatus: 'NEW' | 'UNDER_REVIEW' | 'REVISIONS_REQUESTED' | 'VISA_ENDORSED';
  consultantNotes?: string;
  assignedConsultantName?: string;
  updatedAt: string;
}

export type NotificationType = 'DOCUMENT' | 'EVALUATION' | 'CLARIFICATION' | 'CONSULTANT' | 'INTERVIEW' | 'FUTURE_TWIN' | 'GAP2GROWTH';

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  targetTab?: 'overview' | 'dashboard' | 'workspace' | 'profile' | 'documents' | 'video' | 'evaluation' | 'lebenslauf' | 'roadmap' | 'consultant' | 'future-twin' | 'interview-mirror' | 'life-lens' | 'gap2growth';
  badgeText?: string;
}

// ========================================================
// 1. EUROBRIDGE FUTURETWIN TYPES
// ========================================================
export interface HypotheticalVariables {
  germanLevel: GermanLevel;
  englishScore: string;
  yearsOfWorkExperience: number;
  highestDegree: string;
  targetPathway: PathwayType;
  blockedAccountPrepared: boolean;
  verifiedFundsEur: number;
  apsVerified: boolean;
  ectsPoints: number;
  hasGermanCert: boolean;
  additionalCertifications: string[];
}

export interface ScenarioComparison {
  currentEvaluation: QualificationEvaluation;
  hypotheticalEvaluation: QualificationEvaluation;
  scoreDifference: number;
  gradeDifference?: number;
  chancenkartePointsDiff?: number;
  changedConditions: string[];
  satisfiedGaps: string[];
  remainingGaps: string[];
  improvementOpportunities: string[];
  legalEligibilityChanged: boolean;
  summary: string;
}

export interface FutureTwinScenario {
  id: string;
  applicantId: string;
  name: string;
  description: string;
  hypotheticalVariables: HypotheticalVariables;
  comparison: ScenarioComparison;
  createdAt: string;
}

// ========================================================
// 2. EUROBRIDGE INTERVIEWMIRROR TYPES
// ========================================================
export type InterviewPathway = 'HIGHER_EDUCATION' | 'AUSBILDUNG' | 'INTERNSHIP' | 'EMPLOYMENT';
export type InterviewType = 'UNIVERSITY_ADMISSION' | 'AUSBILDUNG_APPRENTICESHIP' | 'TECHNICAL_JOB' | 'CONSULAR_VISA';
export type InterviewMode = 'TEXT' | 'VOICE' | 'VIDEO';
export type InterviewLanguage = 'ENGLISH' | 'GERMAN' | 'BILINGUAL';
export type InterviewDifficulty = 'FOUNDATIONAL' | 'STANDARD' | 'ADVANCED_CONSULAR';

export interface InterviewQuestionItem {
  id: string;
  order: number;
  questionText: string;
  questionType: 'MOTIVATION' | 'ACADEMIC' | 'TECHNICAL' | 'CULTURAL_ADAPTATION' | 'FINANCIAL_VISA';
  expectedFocus: string;
  germanTranslation?: string;
  adaptiveReason?: string;
}

export interface InterviewAnswerItem {
  id: string;
  questionId: string;
  questionText: string;
  responseText: string;
  audioBlobUrl?: string;
  videoBlobUrl?: string;
  durationSeconds: number;
  timestamp: string;
  interimFeedback?: {
    relevanceScore: number;
    conciseness: string;
    quickTip: string;
  };
}

export interface InterviewEvaluationReport {
  overallRating: number; // 1-10
  answerRelevance: number; // 1-10
  answerCompleteness: number; // 1-10
  communicationStructure: number; // 1-10
  clarityAndConfidence: number; // 1-10
  languageUsageScore: number; // 1-10
  omittedKeyInformation: string[];
  positiveHighlights: string[];
  suggestedImprovedWording: {
    originalQuote: string;
    improvedPhrase: string;
    reason: string;
  }[];
  recommendedFollowUpPractice: string[];
  growthActionSummary: string;
}

export interface InterviewSession {
  id: string;
  applicantId: string;
  pathway: InterviewPathway;
  interviewType: InterviewType;
  mode: InterviewMode;
  language: InterviewLanguage;
  difficulty: InterviewDifficulty;
  totalPlannedQuestions: number;
  currentQuestionIndex: number;
  questions: InterviewQuestionItem[];
  answers: InterviewAnswerItem[];
  feedbackReport?: InterviewEvaluationReport;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt?: string;
}

// ========================================================
// 3. EUROBRIDGE LIFELENS TYPES
// ========================================================
export interface GermanCityData {
  id: string;
  cityName: string;
  stateName: string;
  rentSingleStudioEur: number;
  rentSharedWGEur: number;
  foodGroceriesEur: number;
  transportEur: number; // Deutschlandticket €49-€58 or Semesterticket
  healthInsuranceEur: number; // TK/Barmer student rate ~€125
  utilitiesGeEur: number; // Heating, power, Rundfunkbeitrag GEZ €18.36
  mobileInternetEur: number;
  personalLeisureEur: number;
  semesterContributionEur: number; // Hochschulbeitrag (every 6 months)
  monthlyEstimatedTotalEur: {
    sharedWG: number;
    singleStudio: number;
  };
  keyHubs: string[];
  sourceReference: {
    sourceName: string;
    sourceUrl: string;
    dataCollectedDate: string;
    lastVerifiedDate: string;
    notes: string;
  };
}

export interface RelocationBudgetPlan {
  cityId: string;
  accommodationType: 'SHARED_WG' | 'SINGLE_STUDIO';
  durationMonths: number;
  availableSavingsEur: number;
  monthlyExpectedIncomeEur: number; // Minijob €538, Werkstudent €1100, Ausbildung stipend €1100
  incomeSourceType: 'NONE' | 'BLOCKED_ACCOUNT_DISBURSEMENT' | 'MINIJOB' | 'WERKSTUDENT' | 'AUSBILDUNG_STIPEND' | 'EMPLOYMENT_SALARY' | 'SCHOLARSHIP';
  currency: 'EUR' | 'INR';
  exchangeRateEurToInr: number;
  rateTimestamp: string;
  // Computed Deterministic Metrics
  computedMonthlyExpensesEur: number;
  computedAnnualExpensesEur: number;
  computedNetMonthlyBalanceEur: number;
  computedRunwayMonths: number;
  statutoryBlockedAccountShortfallEur: number;
  totalSavingsNeededForStayEur: number;
}

// ========================================================
// 4. EUROBRIDGE GAP2GROWTH TYPES
// ========================================================
export type GapCategory = 
  | 'LANGUAGE_PROFICIENCY'
  | 'ACADEMIC_PREPARATION'
  | 'PROFESSIONAL_SKILL'
  | 'CERTIFICATION_EVIDENCE'
  | 'DOCUMENT_COMPLIANCE'
  | 'FINANCIAL_READINESS';

export interface SkillGapItem {
  id: string;
  category: GapCategory;
  isMandatory: boolean; // Mandatory visa/admission criterion vs Optional personal growth
  title: string;
  description: string;
  currentValue: string;
  requiredValue: string;
  statutoryCitation: string;
  impactScore: number; // 1-10 priority
}

export interface CourseRecommendation {
  id: string;
  title: string;
  provider: string; // Goethe-Institut, DAAD, RWTH Aachen, Coursera, edX, etc.
  courseUrl: string;
  skillsAddressed: string[];
  targetGapCategories: GapCategory[];
  level: string; // A1, A2, B1, B2, Advanced, Master-Prep
  format: 'ONLINE_SELF_PACED' | 'ONLINE_LIVE' | 'HYBRID' | 'IN_PERSON_GERMANY';
  durationWeeks?: number;
  costEur?: number;
  costDisplay: string;
  certificateDetails: string;
  whyRecommended: string;
  relevanceScore: number;
  lastCheckedDate: string;
  isOfficialCredential: boolean;
}

export interface LearningPlanMilestone {
  id: string;
  title: string;
  description: string;
  weekNumber: number;
  completed: boolean;
  completedAt?: string;
}

export interface LearningGrowthPlan {
  id: string;
  applicantId: string;
  gapId: string;
  gapTitle: string;
  course: CourseRecommendation;
  skillTarget: string;
  milestones: LearningPlanMilestone[];
  practiceActivities: string[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  reassessmentTriggered?: boolean;
}

// ========================================================
// 5. AUTOPILOT EVENTS & COORDINATION
// ========================================================
export type AutopilotEventType = 
  | 'QUALIFICATION_ASSESSMENT_UPDATED'
  | 'APPLICANT_GAP_IDENTIFIED'
  | 'SCENARIO_CREATED'
  | 'LEARNING_PLAN_ACCEPTED'
  | 'INTERVIEW_COMPLETED'
  | 'CITY_PREFERENCE_UPDATED'
  | 'LANGUAGE_EVIDENCE_CONFIRMED';

export interface AutopilotEvent {
  id: string;
  applicantId: string;
  type: AutopilotEventType;
  title: string;
  description: string;
  sourceModule: 'FUTURE_TWIN' | 'INTERVIEW_MIRROR' | 'LIFE_LENS' | 'GAP2GROWTH' | 'QUALIFICATION_ENGINE';
  timestamp: string;
  suggestedAction?: {
    label: string;
    targetTab: string;
  };
}
