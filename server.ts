import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.ts';
import { ANABIN_INDIAN_INSTITUTIONS, calculateBavarianGrade, evaluateChancenkartePoints } from './server/data/anabin.ts';
import { GERMAN_CITIES_DATA } from './server/data/cities.ts';
import { VERIFIED_COURSES_CATALOG } from './server/data/courses.ts';
import { 
  runDocumentIntelligenceAgent, 
  runDiscrepancyAndConflictAgent, 
  runQualificationEvaluationAgent, 
  generatePersonalizedRoadmap,
  runVideoCommunicationAgent,
  generateGermanLebenslauf,
  runConversationalAssistantAgent,
  runFutureTwinSimulation,
  generateAdaptiveInterviewQuestion,
  evaluateInterviewSession,
  calculateRelocationBudget,
  detectApplicantGaps,
  rankCoursesForApplicant,
  generateGrowthRoadmapPlan
} from './server/agents/index.ts';
import { 
  ApplicantProfile, 
  UploadedDocument, 
  FutureTwinScenario, 
  InterviewSession, 
  InterviewAnswerItem, 
  LearningGrowthPlan, 
  AutopilotEvent 
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 50mb limit for PDF/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  if (!req.url.startsWith('/@') && !req.url.includes('.')) {
    console.log(`[EUROBRIDGE AI] ${req.method} ${req.url}`);
  }
  next();
});

// ==========================================
// CORE PLATFORM API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'EUROBRIDGE AI Signature Intelligence Suite',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Anabin Institutions & Bavarian Grade Tools
app.get('/api/anabin/institutions', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  if (!query) {
    return res.json(ANABIN_INDIAN_INSTITUTIONS);
  }
  const filtered = ANABIN_INDIAN_INSTITUTIONS.filter(inst => 
    inst.name.toLowerCase().includes(query) || 
    inst.state.toLowerCase().includes(query)
  );
  res.json(filtered);
});

app.post('/api/anabin/bavarian-grade', (req, res) => {
  const { obtained, max, minPass } = req.body;
  if (obtained === undefined || max === undefined || minPass === undefined) {
    return res.status(400).json({ error: 'Missing obtained, max, or minPass parameters' });
  }
  const result = calculateBavarianGrade(Number(obtained), Number(max), Number(minPass));
  res.json(result);
});

app.post('/api/chancenkarte/calculate', (req, res) => {
  const criteria = req.body;
  const result = evaluateChancenkartePoints(criteria);
  res.json(result);
});

// Users and Sessions
app.get('/api/users', (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/auth/register', (req, res) => {
  const { id, email, fullName, role = 'APPLICANT', phone } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and Full Name are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    if (id && existing.id !== id) {
      existing.id = id;
    }
    return res.json({ user: existing, profile: db.getProfileByUserId(existing.id) });
  }

  const newUser = db.createUser({
    id: id || `user-${Date.now()}`,
    email,
    fullName,
    role,
    phone,
    createdAt: new Date().toISOString()
  });

  let newProfile: ApplicantProfile | null = null;
  if (role === 'APPLICANT') {
    const { targetPathway = 'HIGHER_EDUCATION', cityOfResidence = 'Bengaluru', state = 'Karnataka' } = req.body;
    newProfile = {
      id: `prof-${newUser.id}`,
      userId: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: phone || '',
      cityOfResidence,
      state,
      targetPathway,
      targetIntake: 'Winter Semester 2026/27',
      highestDegree: '',
      indianInstitution: '',
      anabinStatus: 'H+',
      majorFieldOfStudy: '',
      graduationYear: new Date().getFullYear(),
      gradingScaleType: 'CGPA_10',
      obtainedScore: 8.0,
      maximumScore: 10.0,
      minimumPassingScore: 4.0,
      germanLevel: 'NONE',
      englishTestType: 'IELTS',
      englishScore: '',
      yearsOfWorkExperience: 0,
      plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF',
      blockedAccountPrepared: false,
      documents: [],
      clarifications: [],
      roadmap: [],
      consultantStatus: 'NEW',
      updatedAt: new Date().toISOString()
    };
    db.upsertProfile(newProfile);
  }

  res.json({ user: newUser, profile: newProfile });
});

app.post('/api/auth/login', (req, res) => {
  const { id, email, autoRegister = false, fullName = '', role = 'APPLICANT' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    if (autoRegister) {
      const generatedName = fullName || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      user = db.createUser({
        id: id || `user-${Date.now()}`,
        email,
        fullName: generatedName,
        role: (role === 'CONSULTANT' ? 'CONSULTANT' : 'APPLICANT'),
        phone: '',
        createdAt: new Date().toISOString()
      });

      let newProfile: ApplicantProfile | null = null;
      if (user.role === 'APPLICANT') {
        newProfile = {
          id: `prof-${user.id}`,
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: '',
          cityOfResidence: 'Bengaluru',
          state: 'Karnataka',
          targetPathway: 'HIGHER_EDUCATION',
          targetIntake: 'Winter Semester 2026/27',
          highestDegree: 'Bachelor of Technology',
          indianInstitution: 'Visvesvaraya Technological University (VTU), Belagavi',
          anabinStatus: 'H+',
          majorFieldOfStudy: 'Computer Science',
          graduationYear: new Date().getFullYear(),
          gradingScaleType: 'CGPA_10',
          obtainedScore: 8.0,
          maximumScore: 10.0,
          minimumPassingScore: 4.0,
          germanLevel: 'A2',
          englishTestType: 'IELTS',
          englishScore: '7.5 (C1)',
          yearsOfWorkExperience: 1,
          plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF',
          blockedAccountPrepared: false,
          documents: [],
          clarifications: [],
          roadmap: [],
          consultantStatus: 'NEW',
          updatedAt: new Date().toISOString()
        };
        db.upsertProfile(newProfile);
      }
      return res.json({ user, profile: newProfile });
    }
    return res.status(404).json({ error: 'No account registered with this email. Please create an account.' });
  }

  const profile = db.getProfileByUserId(user.id);
  res.json({ user, profile });
});

// Profiles API
app.get('/api/profiles', (req, res) => {
  res.json(db.getAllProfiles());
});

app.get('/api/profiles/:id', (req, res) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

app.get('/api/profiles/user/:userId', (req, res) => {
  const profile = db.getProfileByUserId(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

app.post('/api/profiles', (req, res) => {
  const profileData = req.body as ApplicantProfile;
  if (!profileData.id) {
    profileData.id = `prof-${Date.now()}`;
  }
  const saved = db.upsertProfile(profileData);
  res.json(saved);
});

app.delete('/api/profiles/:id', (req, res) => {
  const deleted = db.deleteProfile(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Profile not found or could not be deleted' });
  }
  res.json({ success: true, message: 'Profile and all associated data permanently erased (GDPR compliant).' });
});

// Document Upload & AI Intelligence Extraction
app.post('/api/profiles/:id/documents', async (req, res) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { type, fileName, fileSizeBytes, mimeType, base64Data, rawText } = req.body;
  if (!type || !fileName) {
    return res.status(400).json({ error: 'Document type and fileName are required' });
  }

  try {
    const aiResult = await runDocumentIntelligenceAgent(
      { type, fileName, mimeType: mimeType || 'application/pdf', rawText, base64Data },
      profile
    );

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      applicantId: profile.id,
      type,
      fileName,
      fileSizeBytes: fileSizeBytes || 500000,
      mimeType: mimeType || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      status: aiResult.flaggedIssues.length > 0 ? 'FLAGGED' : 'VERIFIED',
      extractedFields: aiResult.extractedFields,
      evidences: aiResult.evidences,
      flaggedIssues: aiResult.flaggedIssues
    };

    db.addDocument(profile.id, newDoc);

    const updatedProfile = db.getProfileById(profile.id)!;
    const conflictResult = runDiscrepancyAndConflictAgent(updatedProfile);
    
    for (const clar of conflictResult.clarifications) {
      if (!updatedProfile.clarifications.some(c => c.field === clar.field)) {
        db.addClarification(profile.id, clar);
      }
    }

    res.json({ document: newDoc, profile: db.getProfileById(profile.id) });
  } catch (err: any) {
    console.error('Document processing error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

app.delete('/api/profiles/:id/documents/:docId', (req, res) => {
  const success = db.deleteDocument(req.params.id, req.params.docId);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, profile: db.getProfileById(req.params.id) });
});

// Video Introduction & Speech Analysis
const handleVideoSave = async (req: any, res: any) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { transcript, durationSeconds = 45, videoBlobUrl, audioEnhanced = true } = req.body;

  if (!transcript || transcript.trim().length === 0) {
    db.deleteVideoIntro(profile.id);
    const updated = db.getProfileById(profile.id)!;
    updated.evaluation = runQualificationEvaluationAgent(updated);
    db.upsertProfile(updated);
    return res.json({ success: true, message: 'Video removed', profile: updated });
  }

  try {
    const analysis = await runVideoCommunicationAgent(transcript, profile);
    const videoRecord = {
      id: `vid-${Date.now()}`,
      applicantId: profile.id,
      recordedAt: new Date().toISOString(),
      durationSeconds: Math.min(60, Math.max(30, Number(durationSeconds) || 30)),
      transcript,
      videoBlobUrl: videoBlobUrl || undefined,
      audioEnhanced: Boolean(audioEnhanced),
      englishFluencyScore: analysis.englishFluencyScore,
      germanSpeakingConfidence: analysis.germanSpeakingConfidence,
      motivationSummary: analysis.motivationSummary,
      keyStrengthsDetected: analysis.keyStrengthsDetected,
      extractedInfo: analysis.extractedInfo,
      applicantConfirmed: true
    };

    db.setVideoIntro(profile.id, videoRecord);
    
    const updatedProfile = db.getProfileById(profile.id)!;
    const conflictResult = runDiscrepancyAndConflictAgent(updatedProfile);
    for (const clar of conflictResult.clarifications) {
      if (!updatedProfile.clarifications.some(c => c.field === clar.field)) {
        updatedProfile.clarifications.push(clar);
      }
    }
    updatedProfile.evaluation = runQualificationEvaluationAgent(updatedProfile);
    db.upsertProfile(updatedProfile);

    res.json({ video: videoRecord, profile: updatedProfile });
  } catch (err: any) {
    console.error('Video analysis error:', err);
    res.status(500).json({ error: err.message || 'Video analysis failed' });
  }
};

const handleVideoDelete = (req: any, res: any) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  db.deleteVideoIntro(profile.id);
  const updatedProfile = db.getProfileById(profile.id);
  if (updatedProfile) {
    updatedProfile.evaluation = runQualificationEvaluationAgent(updatedProfile);
    db.upsertProfile(updatedProfile);
  }
  res.json({ success: true, message: 'Video introduction removed successfully.', profile: updatedProfile });
};

app.post('/api/profiles/:id/video', handleVideoSave);
app.post('/api/profiles/:id/video-intro', handleVideoSave);
app.delete('/api/profiles/:id/video', handleVideoDelete);
app.delete('/api/profiles/:id/video-intro', handleVideoDelete);

// Qualification Assessment
app.post('/api/profiles/:id/evaluate', (req, res) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const conflictResult = runDiscrepancyAndConflictAgent(profile);
  for (const clar of conflictResult.clarifications) {
    if (!profile.clarifications.some(c => c.field === clar.field)) {
      profile.clarifications.push(clar);
    }
  }

  const evaluation = runQualificationEvaluationAgent(profile);
  profile.evaluation = evaluation;

  const roadmap = generatePersonalizedRoadmap(profile);
  profile.roadmap = roadmap;

  profile.updatedAt = new Date().toISOString();
  db.upsertProfile(profile);

  // Trigger Autopilot event
  db.addAutopilotEvent({
    id: `evt-${Date.now()}`,
    applicantId: profile.id,
    type: 'QUALIFICATION_ASSESSMENT_UPDATED',
    title: `Assessment Updated: ${evaluation.overallEligibility.replace(/_/g, ' ')}`,
    description: `Consular eligibility evaluated at ${evaluation.overallScore}/100. Bavarian Grade: ${evaluation.germanGradeEquivalent || 'N/A'}.`,
    sourceModule: 'QUALIFICATION_ENGINE',
    timestamp: new Date().toISOString(),
    suggestedAction: {
      label: 'Explore Simulation in FutureTwin',
      targetTab: 'future-twin'
    }
  });

  res.json({
    profile,
    evaluation,
    roadmap,
    conflictsDetected: conflictResult.conflicts
  });
});

// Clarifications
app.post('/api/profiles/:id/clarifications/:clarId/resolve', (req, res) => {
  const { answer } = req.body;
  if (!answer) {
    return res.status(400).json({ error: 'Answer is required' });
  }
  const resolved = db.resolveClarification(req.params.id, req.params.clarId, answer);
  if (!resolved) {
    return res.status(404).json({ error: 'Clarification item not found' });
  }
  res.json({ clarification: resolved, profile: db.getProfileById(req.params.id) });
});

// Consultant Review & Action
app.post('/api/profiles/:id/consultant-review', (req, res) => {
  const { status, notes, consultantName } = req.body;
  if (!status || !notes) {
    return res.status(400).json({ error: 'Status and notes are required' });
  }
  const updated = db.updateConsultantReview(req.params.id, status, notes, consultantName || 'Senior Academic Consultant');
  if (!updated) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(updated);
});

// Generate German Lebenslauf (DIN 5008 CV)
app.get('/api/profiles/:id/lebenslauf', (req, res) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  const cv = generateGermanLebenslauf(profile);
  res.json(cv);
});

// Conversational AI Atelier Assistant
app.post('/api/assistant/chat', async (req, res) => {
  const { profileId, profile: clientProfile, message, history } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  let profile: ApplicantProfile | null = clientProfile || null;
  if (!profile && profileId) {
    profile = db.getProfileById(profileId) || null;
  }
  if (!profile) {
    const all = db.getAllProfiles();
    profile = all.find(p => p.id === profileId || p.userId === profileId) || all[0] || null;
  }

  // Authoritative default profile if guest asks questions before profile completion
  if (!profile) {
    profile = {
      id: profileId || 'guest-profile',
      userId: 'guest',
      fullName: 'Indian Applicant',
      email: '',
      phone: '',
      cityOfResidence: 'India',
      state: '',
      targetPathway: 'HIGHER_EDUCATION',
      targetIntake: 'Winter Semester 2026/27',
      highestDegree: 'Bachelor of Technology',
      indianInstitution: 'Indian Higher Education Institution (KMK Anabin Evaluated)',
      anabinStatus: 'H+',
      majorFieldOfStudy: 'Computer Science / Engineering',
      graduationYear: 2026,
      gradingScaleType: 'CGPA_10',
      obtainedScore: 8.0,
      maximumScore: 10.0,
      minimumPassingScore: 4.0,
      germanLevel: 'A2',
      englishTestType: 'IELTS',
      englishScore: '7.5',
      yearsOfWorkExperience: 1,
      plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF',
      blockedAccountPrepared: false,
      documents: [],
      clarifications: [],
      roadmap: [],
      consultantStatus: 'NEW',
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const assistantResult = await runConversationalAssistantAgent(
      message,
      profile,
      Array.isArray(history) ? history : []
    );
    res.json(assistantResult);
  } catch (err: any) {
    console.error('Conversational Assistant Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate assistant response' });
  }
});

// Compatibility route for /api/agents/conversational-assistant
app.post('/api/agents/conversational-assistant', async (req, res) => {
  const { profile, message, chatHistory } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const activeProfile = profile || db.getAllProfiles()[0];
  if (!activeProfile) return res.status(404).json({ error: 'Profile required' });
  
  const history = Array.isArray(chatHistory) ? chatHistory.map((h: any) => ({
    role: h.role,
    text: h.content || h.text || ''
  })) : [];

  const result = await runConversationalAssistantAgent(message, activeProfile, history);
  res.json(result);
});

// Notifications Persistence
app.get('/api/notifications/read-states', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.json({ readIds: [] });
  res.json({ readIds: db.getReadNotificationIds(userId) });
});

app.post('/api/notifications/read-states', (req, res) => {
  const { userId, alertIds } = req.body;
  if (!userId || !Array.isArray(alertIds)) {
    return res.status(400).json({ error: 'userId and alertIds array required' });
  }
  const updated = db.markNotificationsAsRead(userId, alertIds);
  res.json({ success: true, readIds: updated });
});

app.delete('/api/notifications/read-states', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId query parameter required' });
  db.clearReadNotifications(userId);
  res.json({ success: true, readIds: [] });
});

// ==========================================
// FEATURE 1: EUROBRIDGE FUTURETWIN API
// ==========================================

// Run hypothetical scenario simulation
app.post('/api/future-twin/simulate', (req, res) => {
  const { profileId, hypotheticalVariables } = req.body;
  if (!profileId || !hypotheticalVariables) {
    return res.status(400).json({ error: 'profileId and hypotheticalVariables required' });
  }

  const profile = db.getProfileById(profileId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const comparison = runFutureTwinSimulation(profile, hypotheticalVariables);
  res.json(comparison);
});

// Save simulated scenario
app.post('/api/future-twin/scenarios', (req, res) => {
  const { applicantId, name, description, hypotheticalVariables, comparison } = req.body;
  if (!applicantId || !name || !hypotheticalVariables || !comparison) {
    return res.status(400).json({ error: 'Missing required scenario fields' });
  }

  const scenario: FutureTwinScenario = {
    id: `scenario-${Date.now()}`,
    applicantId,
    name,
    description: description || 'Simulated readiness scenario',
    hypotheticalVariables,
    comparison,
    createdAt: new Date().toISOString()
  };

  db.saveScenario(scenario);

  // Trigger Autopilot event
  db.addAutopilotEvent({
    id: `evt-${Date.now()}`,
    applicantId,
    type: 'SCENARIO_CREATED',
    title: `FutureTwin Scenario Created: "${name}"`,
    description: `Simulated outcome: ${comparison.summary}`,
    sourceModule: 'FUTURE_TWIN',
    timestamp: new Date().toISOString(),
    suggestedAction: {
      label: 'Find Bridging Courses in Gap2Growth',
      targetTab: 'gap2growth'
    }
  });

  res.json(scenario);
});

// List saved scenarios for applicant
app.get('/api/future-twin/scenarios/:applicantId', (req, res) => {
  const scenarios = db.getScenariosByApplicantId(req.params.applicantId);
  res.json(scenarios);
});

// Delete saved scenario
app.delete('/api/future-twin/scenarios/:id', (req, res) => {
  const success = db.deleteScenario(req.params.id);
  res.json({ success });
});

// Explicit confirmation to apply scenario changes to real profile
app.post('/api/future-twin/apply-to-profile', (req, res) => {
  const { profileId, scenarioId, userConfirmed } = req.body;
  if (!userConfirmed) {
    return res.status(400).json({ error: 'Explicit user confirmation required to modify real profile.' });
  }

  const profile = db.getProfileById(profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const scenarios = db.getScenariosByApplicantId(profile.id);
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

  // Update profile with confirmed changes
  const vars = scenario.hypotheticalVariables;
  profile.germanLevel = vars.germanLevel;
  profile.englishScore = vars.englishScore;
  profile.yearsOfWorkExperience = vars.yearsOfWorkExperience;
  profile.targetPathway = vars.targetPathway;
  profile.blockedAccountPrepared = vars.blockedAccountPrepared;
  profile.updatedAt = new Date().toISOString();

  // Re-run evaluation
  profile.evaluation = runQualificationEvaluationAgent(profile);
  db.upsertProfile(profile);

  res.json({ success: true, message: 'Profile updated with confirmed scenario attributes.', profile });
});

// ==========================================
// FEATURE 2: EUROBRIDGE INTERVIEWMIRROR API
// ==========================================

// Helper to resolve or construct applicant profile
function resolveApplicantProfile(applicantId: string, clientProfile?: Partial<ApplicantProfile>): ApplicantProfile {
  let profile = db.getProfileById(applicantId);
  if (!profile && clientProfile && clientProfile.id) {
    profile = clientProfile as ApplicantProfile;
    db.upsertProfile(profile);
  }
  if (!profile) {
    const all = db.getAllProfiles();
    profile = all.find(p => p.id === applicantId || p.userId === applicantId) || all[0];
  }
  if (!profile) {
    profile = {
      id: applicantId,
      userId: applicantId,
      fullName: clientProfile?.fullName || 'Applicant',
      email: clientProfile?.email || '',
      phone: '',
      cityOfResidence: clientProfile?.cityOfResidence || 'India',
      state: '',
      targetPathway: clientProfile?.targetPathway || 'HIGHER_EDUCATION',
      targetIntake: 'Winter Semester 2026/27',
      highestDegree: clientProfile?.highestDegree || 'Bachelor of Technology',
      indianInstitution: clientProfile?.indianInstitution || 'Recognized Indian Higher Education Institution',
      anabinStatus: clientProfile?.anabinStatus || 'H+',
      majorFieldOfStudy: clientProfile?.majorFieldOfStudy || 'Engineering',
      graduationYear: 2026,
      gradingScaleType: 'CGPA_10',
      obtainedScore: clientProfile?.obtainedScore || 8.0,
      maximumScore: clientProfile?.maximumScore || 10.0,
      minimumPassingScore: 4.0,
      germanLevel: clientProfile?.germanLevel || 'A2',
      englishTestType: 'IELTS',
      englishScore: clientProfile?.englishScore || '7.5',
      yearsOfWorkExperience: clientProfile?.yearsOfWorkExperience || 1,
      plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF',
      blockedAccountPrepared: false,
      documents: [],
      clarifications: [],
      roadmap: [],
      consultantStatus: 'NEW',
      updatedAt: new Date().toISOString()
    };
    db.upsertProfile(profile);
  }
  return profile;
}

// Start new interview session
app.post('/api/interview-mirror/start', async (req, res) => {
  const { applicantId, profile: clientProfile, pathway, interviewType, mode, language, difficulty, totalQuestions = 3 } = req.body;
  if (!applicantId) {
    return res.status(400).json({ error: 'applicantId is required' });
  }

  const profile = resolveApplicantProfile(applicantId, clientProfile);

  const session: InterviewSession = {
    id: `interview-${Date.now()}`,
    applicantId,
    pathway: pathway || profile.targetPathway,
    interviewType: interviewType || 'UNIVERSITY_ADMISSION',
    mode: mode || 'TEXT',
    language: language || 'ENGLISH',
    difficulty: difficulty || 'STANDARD',
    totalPlannedQuestions: Math.min(8, Math.max(3, Number(totalQuestions) || 3)),
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString()
  };

  // Generate first question
  const firstQuestion = await generateAdaptiveInterviewQuestion({
    pathway: session.pathway,
    interviewType: session.interviewType,
    language: session.language,
    difficulty: session.difficulty,
    questionNumber: 1,
    totalQuestions: session.totalPlannedQuestions,
    previousQAs: []
  }, profile);

  session.questions.push(firstQuestion);
  db.saveInterview(session);

  res.json(session);
});

// Submit answer and fetch next adaptive question
app.post('/api/interview-mirror/answer', async (req, res) => {
  const { sessionId, profile: clientProfile, answerText, durationSeconds = 30, audioBlobUrl, videoBlobUrl } = req.body;
  if (!sessionId || !answerText) {
    return res.status(400).json({ error: 'sessionId and answerText are required' });
  }

  const session = db.getInterviewById(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const profile = resolveApplicantProfile(session.applicantId, clientProfile);

  const currentQ = session.questions[session.currentQuestionIndex];
  if (!currentQ) return res.status(400).json({ error: 'No active question found' });

  // Record answer
  const answerItem: InterviewAnswerItem = {
    id: `ans-${Date.now()}`,
    questionId: currentQ.id,
    questionText: currentQ.questionText,
    responseText: answerText.trim(),
    durationSeconds: Number(durationSeconds) || 30,
    audioBlobUrl,
    videoBlobUrl,
    timestamp: new Date().toISOString()
  };
  session.answers.push(answerItem);
  session.currentQuestionIndex += 1;

  // Check if session is complete
  if (session.currentQuestionIndex >= session.totalPlannedQuestions) {
    session.status = 'COMPLETED';
    session.completedAt = new Date().toISOString();
    session.feedbackReport = await evaluateInterviewSession(session, profile);
    db.saveInterview(session);

    // Trigger Autopilot event
    db.addAutopilotEvent({
      id: `evt-${Date.now()}`,
      applicantId: profile.id,
      type: 'INTERVIEW_COMPLETED',
      title: `InterviewMirror Session Completed (${session.pathway})`,
      description: `Evaluation Rating: ${session.feedbackReport.overallRating}/10. ${session.feedbackReport.positiveHighlights[0] || 'Session recorded.'}`,
      sourceModule: 'INTERVIEW_MIRROR',
      timestamp: new Date().toISOString(),
      suggestedAction: {
        label: 'Review Growth Recommendations',
        targetTab: 'gap2growth'
      }
    });

    return res.json({ session, isCompleted: true, feedbackReport: session.feedbackReport });
  }

  // Generate next adaptive question
  const previousQAs = session.answers.map((a, i) => ({
    question: session.questions[i]?.questionText || '',
    answer: a.responseText
  }));

  const nextQuestion = await generateAdaptiveInterviewQuestion({
    pathway: session.pathway,
    interviewType: session.interviewType,
    language: session.language,
    difficulty: session.difficulty,
    questionNumber: session.currentQuestionIndex + 1,
    totalQuestions: session.totalPlannedQuestions,
    previousQAs
  }, profile);

  session.questions.push(nextQuestion);
  db.saveInterview(session);

  res.json({ session, isCompleted: false, nextQuestion });
});

// Finish session prematurely and generate report
app.post('/api/interview-mirror/finish', async (req, res) => {
  const { sessionId, profile: clientProfile } = req.body;
  const session = db.getInterviewById(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const profile = resolveApplicantProfile(session.applicantId, clientProfile);

  session.status = 'COMPLETED';
  session.completedAt = new Date().toISOString();
  session.feedbackReport = await evaluateInterviewSession(session, profile);
  db.saveInterview(session);

  res.json(session);
});

// List interview sessions for applicant
app.get('/api/interview-mirror/sessions/:applicantId', (req, res) => {
  const sessions = db.getInterviewsByApplicantId(req.params.applicantId);
  res.json(sessions);
});

app.get('/api/interview-mirror/sessions/detail/:id', (req, res) => {
  const session = db.getInterviewById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.delete('/api/interview-mirror/sessions/:id', (req, res) => {
  const success = db.deleteInterview(req.params.id);
  res.json({ success });
});

// ==========================================
// FEATURE 3: EUROBRIDGE LIFELENS API
// ==========================================

app.get('/api/life-lens/cities', (req, res) => {
  res.json(GERMAN_CITIES_DATA);
});

app.post('/api/life-lens/calculate', (req, res) => {
  const { 
    cityId, 
    accommodationType = 'SHARED_WG', 
    durationMonths = 12, 
    availableSavingsEur = 11904, 
    monthlyExpectedIncomeEur = 0,
    incomeSourceType = 'NONE',
    currency = 'EUR',
    exchangeRateEurToInr = 90.5
  } = req.body;

  const result = calculateRelocationBudget(
    cityId || 'berlin',
    accommodationType,
    Number(durationMonths) || 12,
    Number(availableSavingsEur) || 0,
    Number(monthlyExpectedIncomeEur) || 0,
    incomeSourceType,
    currency,
    Number(exchangeRateEurToInr) || 90.5
  );

  res.json(result);
});

// ==========================================
// FEATURE 4: EUROBRIDGE GAP2GROWTH API
// ==========================================

// Detect gaps for applicant
app.get('/api/gap2growth/gaps/:applicantId', (req, res) => {
  const profile = db.getProfileById(req.params.applicantId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const gaps = detectApplicantGaps(profile);
  const rankedCourses = rankCoursesForApplicant(gaps, VERIFIED_COURSES_CATALOG);

  res.json({ gaps, recommendedCourses: rankedCourses });
});

// Get verified course catalog
app.get('/api/gap2growth/courses', (req, res) => {
  res.json(VERIFIED_COURSES_CATALOG);
});

// Create individualized learning plan
app.post('/api/gap2growth/create-plan', async (req, res) => {
  const { applicantId, gapId, courseId } = req.body;
  const profile = db.getProfileById(applicantId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const gaps = detectApplicantGaps(profile);
  const gap = gaps.find(g => g.id === gapId) || gaps[0];
  const course = VERIFIED_COURSES_CATALOG.find(c => c.id === courseId) || VERIFIED_COURSES_CATALOG[0];

  const plan = await generateGrowthRoadmapPlan(gap, course, profile);
  db.saveLearningPlan(plan);

  // Trigger Autopilot event
  db.addAutopilotEvent({
    id: `evt-${Date.now()}`,
    applicantId,
    type: 'LEARNING_PLAN_ACCEPTED',
    title: `Growth Plan Enrolled: "${course.title}"`,
    description: `Addressing: ${gap.title} (${course.provider}). Milestones established.`,
    sourceModule: 'GAP2GROWTH',
    timestamp: new Date().toISOString(),
    suggestedAction: {
      label: 'Simulate Upgrade in FutureTwin',
      targetTab: 'future-twin'
    }
  });

  res.json(plan);
});

// Get learning plans
app.get('/api/gap2growth/plans/:applicantId', (req, res) => {
  const plans = db.getLearningPlansByApplicantId(req.params.applicantId);
  res.json(plans);
});

// Update plan milestone
app.post('/api/gap2growth/plans/:planId/milestone', (req, res) => {
  const { milestoneId, completed } = req.body;
  const updated = db.updateLearningPlanMilestone(req.params.planId, milestoneId, Boolean(completed));
  if (!updated) return res.status(404).json({ error: 'Plan not found' });
  res.json(updated);
});

// Trigger qualification reassessment based on growth progress
app.post('/api/gap2growth/plans/:planId/reassess', (req, res) => {
  const plans = db.getLearningPlansByApplicantId(req.body.applicantId || '');
  const plan = plans.find(p => p.id === req.params.planId);
  
  const profile = db.getProfileById(req.body.applicantId || (plan ? plan.applicantId : ''));
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  // Re-run evaluation
  profile.evaluation = runQualificationEvaluationAgent(profile);
  profile.updatedAt = new Date().toISOString();
  db.upsertProfile(profile);

  if (plan) {
    plan.reassessmentTriggered = true;
    db.saveLearningPlan(plan);
  }

  res.json({ success: true, profile, evaluation: profile.evaluation });
});

// Delete learning plan
app.delete('/api/gap2growth/plans/:planId', (req, res) => {
  const success = db.deleteLearningPlan(req.params.planId);
  res.json({ success });
});

// ==========================================
// AUTOPILOT EVENTS API
// ==========================================

app.get('/api/autopilot/events/:applicantId', (req, res) => {
  const events = db.getAutopilotEvents(req.params.applicantId);
  res.json(events);
});

app.post('/api/autopilot/events', (req, res) => {
  const { applicantId, type, title, description, sourceModule, suggestedAction } = req.body;
  if (!applicantId || !type || !title) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  const event: AutopilotEvent = {
    id: `evt-${Date.now()}`,
    applicantId,
    type,
    title,
    description: description || '',
    sourceModule: sourceModule || 'QUALIFICATION_ENGINE',
    timestamp: new Date().toISOString(),
    suggestedAction
  };

  db.addAutopilotEvent(event);
  res.json(event);
});

// ==========================================
// VITE DEV SERVER OR PRODUCTION SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EUROBRIDGE AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
