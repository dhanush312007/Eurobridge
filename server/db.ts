import fs from 'fs';
import path from 'path';
import { 
  ApplicantProfile, 
  User, 
  UploadedDocument, 
  ClarificationQuestion, 
  QualificationEvaluation, 
  MilestoneStep,
  FutureTwinScenario,
  InterviewSession,
  LearningGrowthPlan,
  AutopilotEvent
} from '../src/types/index.ts';

const DB_FILE = path.join(process.cwd(), 'data', 'eurobridge_store.json');

interface DatabaseStore {
  users: User[];
  profiles: ApplicantProfile[];
  scenarios?: FutureTwinScenario[];
  interviews?: InterviewSession[];
  learningPlans?: LearningGrowthPlan[];
  autopilotEvents?: AutopilotEvent[];
  notificationReadStates?: Record<string, string[]>;
}

function ensureDataDirectory() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export class EurobridgeDb {
  private data: DatabaseStore;

  constructor() {
    ensureDataDirectory();
    this.data = this.load();
  }

  private load(): DatabaseStore {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users) && Array.isArray(parsed.profiles)) {
          if (!Array.isArray(parsed.scenarios)) parsed.scenarios = [];
          if (!Array.isArray(parsed.interviews)) parsed.interviews = [];
          if (!Array.isArray(parsed.learningPlans)) parsed.learningPlans = [];
          if (!Array.isArray(parsed.autopilotEvents)) parsed.autopilotEvents = [];
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database, reinitializing with default store:', err);
    }

    const defaultData: DatabaseStore = {
      users: [],
      profiles: [],
      scenarios: [],
      interviews: [],
      learningPlans: [],
      autopilotEvents: []
    };
    this.save(defaultData);
    return defaultData;
  }

  private save(data: DatabaseStore) {
    try {
      ensureDataDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save(this.data);
    return user;
  }

  // Profiles
  getAllProfiles(): ApplicantProfile[] {
    return this.data.profiles;
  }

  getProfileById(id: string): ApplicantProfile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  getProfileByUserId(userId: string): ApplicantProfile | undefined {
    return this.data.profiles.find(p => p.userId === userId);
  }

  upsertProfile(profile: ApplicantProfile): ApplicantProfile {
    const idx = this.data.profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      this.data.profiles[idx] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.data.profiles.push({ ...profile, updatedAt: new Date().toISOString() });
    }
    this.save(this.data);
    return profile;
  }

  deleteProfile(id: string): boolean {
    const initialLen = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter(p => p.id !== id);
    if (this.data.profiles.length !== initialLen) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  // Document management
  addDocument(profileId: string, doc: UploadedDocument): UploadedDocument | null {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    profile.documents.push(doc);
    profile.updatedAt = new Date().toISOString();
    this.upsertProfile(profile);
    return doc;
  }

  deleteDocument(profileId: string, docId: string): boolean {
    const profile = this.getProfileById(profileId);
    if (!profile) return false;
    const initialLen = profile.documents.length;
    profile.documents = profile.documents.filter(d => d.id !== docId);
    if (profile.documents.length !== initialLen) {
      this.upsertProfile(profile);
      return true;
    }
    return false;
  }

  // Video management
  setVideoIntro(profileId: string, video: any) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    profile.videoIntro = video;
    this.upsertProfile(profile);
    return profile.videoIntro;
  }

  deleteVideoIntro(profileId: string) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    delete profile.videoIntro;
    profile.updatedAt = new Date().toISOString();
    this.upsertProfile(profile);
    return profile;
  }

  // Clarifications
  addClarification(profileId: string, clarification: ClarificationQuestion) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    profile.clarifications.push(clarification);
    this.upsertProfile(profile);
    return clarification;
  }

  resolveClarification(profileId: string, clarificationId: string, answer: string) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    const item = profile.clarifications.find(c => c.id === clarificationId);
    if (!item) return null;
    item.resolved = true;
    item.applicantAnswer = answer;
    this.upsertProfile(profile);
    return item;
  }

  // Consultant action
  updateConsultantReview(profileId: string, status: ApplicantProfile['consultantStatus'], notes: string, consultantName: string) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    profile.consultantStatus = status;
    profile.consultantNotes = notes;
    profile.assignedConsultantName = consultantName;
    this.upsertProfile(profile);
    return profile;
  }

  // ========================================================
  // FUTURETWIN SCENARIOS
  // ========================================================
  getScenariosByApplicantId(applicantId: string): FutureTwinScenario[] {
    if (!this.data.scenarios) this.data.scenarios = [];
    return this.data.scenarios.filter(s => s.applicantId === applicantId);
  }

  saveScenario(scenario: FutureTwinScenario): FutureTwinScenario {
    if (!this.data.scenarios) this.data.scenarios = [];
    const idx = this.data.scenarios.findIndex(s => s.id === scenario.id);
    if (idx >= 0) {
      this.data.scenarios[idx] = scenario;
    } else {
      this.data.scenarios.unshift(scenario);
    }
    this.save(this.data);
    return scenario;
  }

  deleteScenario(id: string): boolean {
    if (!this.data.scenarios) return false;
    const initialLen = this.data.scenarios.length;
    this.data.scenarios = this.data.scenarios.filter(s => s.id !== id);
    if (this.data.scenarios.length !== initialLen) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  // ========================================================
  // INTERVIEWMIRROR SESSIONS
  // ========================================================
  getInterviewsByApplicantId(applicantId: string): InterviewSession[] {
    if (!this.data.interviews) this.data.interviews = [];
    return this.data.interviews.filter(s => s.applicantId === applicantId);
  }

  getInterviewById(id: string): InterviewSession | undefined {
    if (!this.data.interviews) this.data.interviews = [];
    return this.data.interviews.find(s => s.id === id);
  }

  saveInterview(session: InterviewSession): InterviewSession {
    if (!this.data.interviews) this.data.interviews = [];
    const idx = this.data.interviews.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      this.data.interviews[idx] = session;
    } else {
      this.data.interviews.unshift(session);
    }
    this.save(this.data);
    return session;
  }

  deleteInterview(id: string): boolean {
    if (!this.data.interviews) return false;
    const initialLen = this.data.interviews.length;
    this.data.interviews = this.data.interviews.filter(s => s.id !== id);
    if (this.data.interviews.length !== initialLen) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  // ========================================================
  // GAP2GROWTH LEARNING PLANS
  // ========================================================
  getLearningPlansByApplicantId(applicantId: string): LearningGrowthPlan[] {
    if (!this.data.learningPlans) this.data.learningPlans = [];
    return this.data.learningPlans.filter(p => p.applicantId === applicantId);
  }

  saveLearningPlan(plan: LearningGrowthPlan): LearningGrowthPlan {
    if (!this.data.learningPlans) this.data.learningPlans = [];
    const idx = this.data.learningPlans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      this.data.learningPlans[idx] = plan;
    } else {
      this.data.learningPlans.unshift(plan);
    }
    this.save(this.data);
    return plan;
  }

  updateLearningPlanMilestone(planId: string, milestoneId: string, completed: boolean): LearningGrowthPlan | null {
    if (!this.data.learningPlans) return null;
    const plan = this.data.learningPlans.find(p => p.id === planId);
    if (!plan) return null;
    const milestone = plan.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      milestone.completed = completed;
      milestone.completedAt = completed ? new Date().toISOString() : undefined;
      const completedCount = plan.milestones.filter(m => m.completed).length;
      plan.progressPercentage = Math.round((completedCount / plan.milestones.length) * 100);
      if (plan.progressPercentage === 100) {
        plan.status = 'COMPLETED';
      }
      plan.updatedAt = new Date().toISOString();
      this.save(this.data);
    }
    return plan;
  }

  deleteLearningPlan(id: string): boolean {
    if (!this.data.learningPlans) return false;
    const initialLen = this.data.learningPlans.length;
    this.data.learningPlans = this.data.learningPlans.filter(p => p.id !== id);
    if (this.data.learningPlans.length !== initialLen) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  // ========================================================
  // AUTOPILOT EVENTS
  // ========================================================
  getAutopilotEvents(applicantId: string): AutopilotEvent[] {
    if (!this.data.autopilotEvents) this.data.autopilotEvents = [];
    return this.data.autopilotEvents.filter(e => e.applicantId === applicantId);
  }

  addAutopilotEvent(event: AutopilotEvent): AutopilotEvent {
    if (!this.data.autopilotEvents) this.data.autopilotEvents = [];
    // Prevent excessive duplicates of same event type within 5 minutes
    const recent = this.data.autopilotEvents.find(
      e => e.applicantId === event.applicantId &&
           e.type === event.type &&
           (Date.now() - new Date(e.timestamp).getTime()) < 300000
    );
    if (!recent) {
      this.data.autopilotEvents.unshift(event);
      if (this.data.autopilotEvents.length > 50) {
        this.data.autopilotEvents = this.data.autopilotEvents.slice(0, 50);
      }
      this.save(this.data);
    }
    return event;
  }

  // ========================================================
  // NOTIFICATIONS
  // ========================================================
  getReadNotificationIds(userId: string): string[] {
    if (!this.data.notificationReadStates) {
      this.data.notificationReadStates = {};
    }
    return this.data.notificationReadStates[userId] || [];
  }

  markNotificationsAsRead(userId: string, alertIds: string[]): string[] {
    if (!this.data.notificationReadStates) {
      this.data.notificationReadStates = {};
    }
    const current = new Set(this.data.notificationReadStates[userId] || []);
    alertIds.forEach(id => {
      if (id && typeof id === 'string') {
        current.add(id);
      }
    });
    this.data.notificationReadStates[userId] = Array.from(current);
    this.save(this.data);
    return this.data.notificationReadStates[userId];
  }

  clearReadNotifications(userId: string): void {
    if (!this.data.notificationReadStates) {
      this.data.notificationReadStates = {};
    }
    delete this.data.notificationReadStates[userId];
    this.save(this.data);
  }
}

export const db = new EurobridgeDb();
