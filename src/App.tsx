/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ApplicantProfile, PathwayType, DocumentType, NotificationAlert } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { DashboardSidebar } from './components/DashboardSidebar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ApplicantDashboard } from './components/ApplicantDashboard.tsx';
import { AiWorkspace } from './components/AiWorkspace.tsx';
import { ProfileBuilder } from './components/ProfileBuilder.tsx';
import { DocumentVault } from './components/DocumentVault.tsx';
import { VideoStudio } from './components/VideoStudio.tsx';
import { AgentOrchestratorView } from './components/AgentOrchestratorView.tsx';
import { ClarificationCenter } from './components/ClarificationCenter.tsx';
import { LebenslaufView } from './components/LebenslaufView.tsx';
import { RoadmapTimeline } from './components/RoadmapTimeline.tsx';
import { ConsultantPortal } from './components/ConsultantPortal.tsx';
import { PrivacyGdprModal } from './components/PrivacyGdprModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DossierProgressMeter } from './components/DossierProgressMeter.tsx';
import { FutureTwin } from './components/FutureTwin.tsx';
import { InterviewMirror } from './components/InterviewMirror.tsx';
import { LifeLens } from './components/LifeLens.tsx';
import { Gap2Growth } from './components/Gap2Growth.tsx';
import { notificationService } from './services/notificationService.ts';
import { auth, signOut, testFirestoreConnection, onAuthStateChanged } from './firebase/config.ts';
import { 
  syncProfileToFirestore, 
  syncUserToFirestore, 
  fetchUserFromFirestore, 
  fetchProfileByUserIdFromFirestore, 
  fetchProfileFromFirestore,
  deleteProfileFromFirestore,
  subscribeToProfile
} from './services/firestoreService.ts';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1] as const
    } 
  },
  exit: { 
    opacity: 0, 
    y: -6,
    transition: { 
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1] as const
    } 
  }
};

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<ApplicantProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ApplicantProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Build notifications from active profile data
  const buildAlertsFromProfile = (profile: ApplicantProfile | null, prevList: NotificationAlert[]): NotificationAlert[] => {
    if (!profile) return [];
    const readSet = new Set(prevList.filter(n => n.read).map(n => n.id));
    const alerts: NotificationAlert[] = [];
    const userScope = currentUser?.id;

    // 1. Consultant Endorsement Alert
    if (profile.consultantStatus === 'VISA_ENDORSED') {
      const id = `notif-cons-${profile.id}`;
      const isAlreadyRead = notificationService.isRead(id, userScope) || readSet.has(id);
      alerts.push({
        id,
        title: 'German Visa Endorsement Issued',
        message: `Official consular visa endorsement issued by ${profile.assignedConsultantName || 'Senior Academic Advisor'}.`,
        timestamp: profile.updatedAt || new Date().toISOString(),
        type: 'CONSULTANT',
        read: isAlreadyRead,
        targetTab: 'consultant',
        badgeText: 'ENDORSED'
      });
    } else if (profile.consultantStatus === 'REVISIONS_REQUESTED') {
      const id = `notif-cons-rev-${profile.id}`;
      const isAlreadyRead = notificationService.isRead(id, userScope) || readSet.has(id);
      alerts.push({
        id,
        title: 'Advisor Revision Request',
        message: profile.consultantNotes || 'Advisor requested updates to missing credentials.',
        timestamp: profile.updatedAt || new Date().toISOString(),
        type: 'CONSULTANT',
        read: isAlreadyRead,
        targetTab: 'consultant',
        badgeText: 'ACTION REQUIRED'
      });
    }

    // 2. Evaluation Results Alert
    if (profile.evaluation) {
      const id = `notif-eval-${profile.evaluation.id}`;
      let detailMsg = `Qualification assessment: ${profile.evaluation.overallEligibility.replace(/_/g, ' ')} (${profile.evaluation.overallScore}/100).`;
      if (profile.evaluation.germanGradeEquivalent) {
        detailMsg += ` Bavarian converted grade: ${profile.evaluation.germanGradeEquivalent.toFixed(1)}.`;
      }
      if (profile.evaluation.chancenkartePoints) {
        detailMsg += ` Opportunity Card score: ${profile.evaluation.chancenkartePoints.totalPoints}/14 pts.`;
      }

      const isAlreadyRead = notificationService.isRead(id, userScope) || readSet.has(id);
      alerts.push({
        id,
        title: 'AI Qualification Assessment Updated',
        message: detailMsg,
        timestamp: profile.evaluation.evaluatedAt || new Date().toISOString(),
        type: 'EVALUATION',
        read: isAlreadyRead,
        targetTab: 'evaluation',
        badgeText: profile.evaluation.overallEligibility.replace(/_/g, ' ')
      });
    }

    // 3. Document Verification Status Alerts
    if (profile.documents && profile.documents.length > 0) {
      profile.documents.forEach(doc => {
        const id = `notif-doc-${doc.id}`;
        const isVerified = doc.status === 'VERIFIED';
        const confidence = doc.evidences?.[0]?.confidence ? Math.round(doc.evidences[0].confidence * 100) : 98;
        const isAlreadyRead = notificationService.isRead(id, userScope) || readSet.has(id);
        
        alerts.push({
          id,
          title: isVerified ? `Document Verified: ${doc.fileName}` : `Document Discrepancy: ${doc.fileName}`,
          message: isVerified 
            ? `Multimodal OCR extracted credentials with ${confidence}% confidence.` 
            : `Discrepancy detected: ${doc.flaggedIssues?.[0] || 'Clarification required for this document.'}`,
          timestamp: doc.uploadedAt || new Date().toISOString(),
          type: 'DOCUMENT',
          read: isAlreadyRead,
          targetTab: 'documents',
          badgeText: doc.status
        });
      });
    }

    // 4. Clarification Questions Alerts
    if (profile.clarifications && profile.clarifications.length > 0) {
      profile.clarifications.filter(c => !c.resolved).forEach(clar => {
        const id = `notif-clar-${clar.id}`;
        const isAlreadyRead = notificationService.isRead(id, userScope) || readSet.has(id);
        alerts.push({
          id,
          title: `Action Required: ${clar.field}`,
          message: clar.question,
          timestamp: clar.createdAt || new Date().toISOString(),
          type: 'CLARIFICATION',
          read: isAlreadyRead,
          targetTab: 'evaluation',
          badgeText: clar.severity
        });
      });
    }

    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const profileAlertIds = new Set(alerts.map(a => a.id));
    const extraAlerts = prevList.filter(n => !profileAlertIds.has(n.id));
    return notificationService.applyReadStates([...alerts, ...extraAlerts], userScope);
  };

  useEffect(() => {
    if (activeProfile) {
      setNotifications(prev => buildAlertsFromProfile(activeProfile, prev));
    } else {
      setNotifications([]);
    }
  }, [
    activeProfile?.id, 
    activeProfile?.documents?.length, 
    activeProfile?.evaluation?.id, 
    activeProfile?.clarifications?.length, 
    activeProfile?.consultantStatus, 
    currentUser?.id
  ]);

  useEffect(() => {
    if (currentUser?.id) {
      notificationService.syncWithDatabase(currentUser.id).then(() => {
        setNotifications(prev => notificationService.applyReadStates(prev, currentUser.id));
      });
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setNotifications(prev => notificationService.applyReadStates(prev, currentUser?.id));
    });
    return unsubscribe;
  }, [currentUser?.id]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id, currentUser?.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    notificationService.markAllAsRead(allIds, currentUser?.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearReadHistory = async () => {
    await notificationService.clearReadHistory(currentUser?.id);
    if (activeProfile) {
      setNotifications(prev => buildAlertsFromProfile(activeProfile, []));
    }
  };

  const loadData = async () => {
    try {
      testFirestoreConnection().catch(err => {
        console.warn('Firestore connection check notice:', err);
      });

      const [usersRes, profilesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/profiles')
      ]);

      const usersData = await usersRes.json();
      const profilesData = await profilesRes.json();
      setUsers(usersData);
      setProfiles(profilesData);
      // Remove any pre-login: app opens in unauthenticated state until user signs in via Firebase Auth
      localStorage.removeItem('eurobridge_current_user_id');
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const firestoreUser = await fetchUserFromFirestore(fbUser.uid);
          const resolvedUser: User = firestoreUser || {
            id: fbUser.uid,
            email: fbUser.email || '',
            fullName: fbUser.displayName || 'Applicant',
            role: 'APPLICANT',
            phone: fbUser.phoneNumber || '',
            createdAt: new Date().toISOString()
          };
          setCurrentUser(resolvedUser);
          localStorage.setItem('eurobridge_current_user_id', resolvedUser.id);
          await syncUserToFirestore(resolvedUser);

          let firestoreProfile = await fetchProfileByUserIdFromFirestore(fbUser.uid);
          if (!firestoreProfile) {
            firestoreProfile = await fetchProfileFromFirestore(`prof-${fbUser.uid}`);
          }
          if (firestoreProfile) {
            setActiveProfile(firestoreProfile);
          } else {
            const serverProfileRes = await fetch(`/api/profiles/user/${fbUser.uid}`).catch(() => null);
            if (serverProfileRes && serverProfileRes.ok) {
              const profData = await serverProfileRes.json();
              if (profData) {
                setActiveProfile(profData);
                await syncProfileToFirestore(profData);
              }
            }
          }
        } catch (err) {
          console.warn('[Firebase Auth] Listener sync notice:', err);
        }
      } else {
        // No pre-login: guest state until user logs in
        setCurrentUser(null);
        setActiveProfile(null);
        localStorage.removeItem('eurobridge_current_user_id');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore synchronization for active dossier
  useEffect(() => {
    if (!auth.currentUser || !activeProfile?.id) return;
    try {
      const unsub = subscribeToProfile(activeProfile.id, (updatedProfile) => {
        if (updatedProfile && updatedProfile.updatedAt && updatedProfile.updatedAt !== activeProfile.updatedAt) {
          setActiveProfile(updatedProfile);
        }
      });
      return () => unsub();
    } catch {
      // offline or rule catch
    }
  }, [activeProfile?.id, currentUser?.id]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('eurobridge_current_user_id');
    setCurrentUser(null);
    setActiveProfile(null);
    setActiveTab('overview');
  };

  const handleAuthSuccess = (user: User, profile?: any) => {
    setCurrentUser(user);
    localStorage.setItem('eurobridge_current_user_id', user.id);
    
    setUsers(prev => {
      if (prev.some(u => u.id === user.id)) return prev;
      return [...prev, user];
    });

    if (user.role === 'CONSULTANT') {
      setActiveTab('consultant');
    } else {
      if (profile) {
        setActiveProfile(profile);
        setProfiles(prev => {
          const idx = prev.findIndex(p => p.id === profile.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = profile;
            return copy;
          }
          return [...prev, profile];
        });
      }
      setActiveTab('dashboard');
    }
  };

  const handleSelectPathway = async (pathway: PathwayType) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    if (!activeProfile) {
      setActiveTab('profile');
      return;
    }

    const updated = { ...activeProfile, targetPathway: pathway };
    setActiveProfile(updated);
    await syncProfileToFirestore(updated);
    
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    
    await handleTriggerEvaluation();
    setActiveTab('evaluation');
  };

  const handleUpdateProfile = async (updated: ApplicantProfile) => {
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const saved = await res.json();
      setActiveProfile(saved);
      setProfiles(prev => prev.map(p => p.id === saved.id ? saved : p));
      await syncProfileToFirestore(saved);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleTriggerEvaluation = async () => {
    if (!activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${activeProfile.id}/evaluate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.profile) {
        setActiveProfile(data.profile);
        setProfiles(prev => prev.map(p => p.id === data.profile.id ? data.profile : p));
        await syncProfileToFirestore(data.profile);

        const evalRes = data.evaluation;
        const newAlert: NotificationAlert = {
          id: `alert-eval-${Date.now()}`,
          title: 'AI Qualification Engine Completed',
          message: evalRes 
            ? `Status: ${evalRes.overallEligibility.replace(/_/g, ' ')} (${evalRes.overallScore}/100). Bavarian Grade: ${evalRes.germanGradeEquivalent?.toFixed(1) || 'N/A'}.`
            : 'Deterministic rules evaluated against German immigration standards.',
          timestamp: new Date().toISOString(),
          type: 'EVALUATION',
          read: false,
          targetTab: 'evaluation',
          badgeText: 'AI RESULT'
        };
        setNotifications(prev => [newAlert, ...prev]);
      }
    } catch (err) {
      console.error('Failed to run agent evaluation:', err);
    }
  };

  const handleUploadDocument = async (docData: {
    type: DocumentType;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    base64Data?: string;
    rawText?: string;
  }) => {
    if (!activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${activeProfile.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      const result = await res.json();
      if (result.profile) {
        setActiveProfile(result.profile);
        setProfiles(prev => prev.map(p => p.id === result.profile.id ? result.profile : p));
        await syncProfileToFirestore(result.profile);
        await handleTriggerEvaluation();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${activeProfile.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.profile) {
        setActiveProfile(result.profile);
        setProfiles(prev => prev.map(p => p.id === result.profile.id ? result.profile : p));
        await syncProfileToFirestore(result.profile);
        await handleTriggerEvaluation();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSubmitVideoIntro = async (transcript: string, durationSeconds: number, videoBlobUrl?: string) => {
    if (!activeProfile) return;
    const res = await fetch(`/api/profiles/${activeProfile.id}/video-intro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, durationSeconds, videoBlobUrl })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }
    const result = await res.json();
    if (result.profile) {
      setActiveProfile(result.profile);
      setProfiles(prev => prev.map(p => p.id === result.profile.id ? result.profile : p));
      await syncProfileToFirestore(result.profile);
      await handleTriggerEvaluation();
    }
  };

  const handleDeleteVideoIntro = async () => {
    if (!activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${activeProfile.id}/video-intro`, {
        method: 'DELETE'
      });
      const result = await res.json();
      const updatedProfile: ApplicantProfile = result.profile ? { ...result.profile } : { ...activeProfile };
      delete (updatedProfile as any).videoIntro;
      
      setActiveProfile(updatedProfile);
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      await syncProfileToFirestore(updatedProfile);
    } catch (err) {
      console.error('Failed to delete video introduction:', err);
    }
  };

  const handleResolveClarification = async (clarId: string, answer: string) => {
    if (!activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${activeProfile.id}/clarifications/${clarId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const result = await res.json();
      if (result.profile) {
        setActiveProfile(result.profile);
        setProfiles(prev => prev.map(p => p.id === result.profile.id ? result.profile : p));
        await syncProfileToFirestore(result.profile);
        await handleTriggerEvaluation();
      }
    } catch (err) {
      console.error('Failed to resolve clarification:', err);
    }
  };

  const handleUpdateConsultantReview = async (
    profileId: string,
    status: ApplicantProfile['consultantStatus'],
    notes: string
  ) => {
    try {
      const res = await fetch(`/api/profiles/${profileId}/consultant-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          consultantName: currentUser?.fullName || 'Senior Academic Advisor'
        })
      });
      const updated = await res.json();
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (activeProfile?.id === updated.id) {
        setActiveProfile(updated);
      }
      await syncProfileToFirestore(updated);
    } catch (err) {
      console.error('Failed to update consultant review:', err);
    }
  };

  const handleDeleteProfile = async () => {
    if (!activeProfile) return;
    try {
      await deleteProfileFromFirestore(activeProfile.id);
      await fetch(`/api/profiles/${activeProfile.id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error('Failed to delete profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0D0C] text-[#FAF6F0]">
        <div className="text-center space-y-4">
          <div className="font-serif-display text-4xl text-[#C5A880] tracking-tight animate-pulse">
            EUROBRIDGE AI
          </div>
          <p className="text-xs font-mono-numbers text-[#9C968A] uppercase tracking-widest">
            Initializing Signature Intelligence Suite & Anabin Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0B0D0C] text-[#EDE8DE] selection:bg-[#C5A880] selection:text-[#0B0D0C]">
      
      {/* Atelier Dashboard Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        activeProfile={activeProfile}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopSidebarCollapsed}
        onToggleCollapse={() => setIsDesktopSidebarCollapsed(prev => !prev)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area Offset for Desktop Sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          activeProfile={activeProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearReadHistory={handleClearReadHistory}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setIsMobileSidebarOpen(prev => !prev);
            } else {
              setIsDesktopSidebarCollapsed(prev => !prev);
            }
          }}
          isSidebarCollapsed={isDesktopSidebarCollapsed}
        />

        {/* Main Viewport Router with Smooth Transitions */}
        <main className="flex-1 w-full">
          <AnimatePresence mode="wait">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <HeroSection
                  onSelectPathway={handleSelectPathway}
                  activePathway={activeProfile?.targetPathway || 'HIGHER_EDUCATION'}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
                  {currentUser && activeProfile ? (
                    <div className="p-8 bg-[#111413] border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                      <div>
                        <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                          Active Applicant Dossier
                        </span>
                        <h3 className="font-serif-display text-2xl text-[#FAF6F0] mt-1">
                          {activeProfile.fullName} — {activeProfile.targetPathway.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-xs text-[#9C968A] mt-1">
                          {activeProfile.indianInstitution ? `${activeProfile.indianInstitution} (Anabin ${activeProfile.anabinStatus}) • ` : ''}
                          Bavarian Grade: {activeProfile.evaluation?.germanGradeEquivalent?.toFixed(1) || '2.0'}
                        </p>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                        <DossierProgressMeter
                          profile={activeProfile}
                          onNavigateTab={setActiveTab}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab('future-twin')}
                            className="px-4 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            FutureTwin Simulator
                          </button>
                          <button
                            onClick={() => setActiveTab('dashboard')}
                            className="px-4 py-2.5 bg-[#161A18] border border-white/10 text-[#FAF6F0] rounded-lg text-xs font-semibold hover:bg-[#1D2220] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Personal Dossier
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 sm:p-10 bg-[#111413] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                          Authentication Required
                        </span>
                        <h3 className="font-serif-display text-2xl sm:text-3xl text-[#FAF6F0]">
                          Begin Your Germany Application Journey
                        </h3>
                        <p className="text-xs text-[#9C968A] max-w-xl font-light">
                          Create your verified applicant account to access the Signature Intelligence Suite: FutureTwin, InterviewMirror, LifeLens, and Gap2Growth.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsAuthOpen(true)}
                          className="px-5 py-3 bg-[#C5A880] text-[#0B0D0C] rounded-xl text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: FEATURE 1 — FUTURETWIN */}
            {activeTab === 'future-twin' && (
              <motion.div
                key="future-twin"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <FutureTwin
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                    onRefreshProfile={loadData}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">FutureTwin requires an active applicant profile to simulate scenarios.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: FEATURE 2 — INTERVIEWMIRROR */}
            {activeTab === 'interview-mirror' && (
              <motion.div
                key="interview-mirror"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <InterviewMirror
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">InterviewMirror requires an applicant profile to tailor interview questions.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: FEATURE 3 — LIFELENS */}
            {activeTab === 'life-lens' && (
              <motion.div
                key="life-lens"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <LifeLens
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">LifeLens requires an applicant profile to plan relocation finances.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: FEATURE 4 — GAP2GROWTH */}
            {activeTab === 'gap2growth' && (
              <motion.div
                key="gap2growth"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <Gap2Growth
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                    onTriggerEvaluation={handleTriggerEvaluation}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Gap2Growth requires an applicant profile to audit qualification gaps.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <ApplicantDashboard
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                    onTriggerEvaluation={handleTriggerEvaluation}
                    onOpenPrivacy={() => setIsPrivacyOpen(true)}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Access your personal Germany journey workspace once logged in.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: AI WORKSPACE */}
            {activeTab === 'workspace' && (
              <motion.div
                key="workspace"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <AiWorkspace
                    profile={activeProfile}
                    onNavigateTab={setActiveTab}
                    onOpenPrivacy={() => setIsPrivacyOpen(true)}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">The AI Advisory Workspace requires an active applicant profile.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full space-y-10 pb-16"
              >
                {activeProfile ? (
                  <>
                    <ProfileBuilder
                      profile={activeProfile}
                      onUpdateProfile={handleUpdateProfile}
                      onTriggerEvaluation={handleTriggerEvaluation}
                      onNavigateTab={setActiveTab}
                    />
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                      <VideoStudio
                        videoIntro={activeProfile.videoIntro}
                        onSubmitVideoIntro={handleSubmitVideoIntro}
                        onDeleteVideoIntro={handleDeleteVideoIntro}
                      />
                      <ClarificationCenter
                        clarifications={activeProfile.clarifications}
                        onResolveClarification={handleResolveClarification}
                      />
                    </div>
                  </>
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Create your account to start building your applicant profile.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === 'documents' && (
              <motion.div
                key="documents"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <DocumentVault
                    documents={activeProfile.documents}
                    onUploadDocument={handleUploadDocument}
                    onDeleteDocument={handleDeleteDocument}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Upload your actual documents once logged in.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: VIDEO STUDIO */}
            {activeTab === 'video' && (
              <motion.div
                key="video"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-8"
              >
                <div className="border-b border-white/[0.08] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                      <span>Atelier Studio</span>
                      <span aria-hidden="true">•</span>
                      <span>Applicant Pitch & Articulation</span>
                      <span aria-hidden="true">•</span>
                      <span>Automated Sound Enhancement</span>
                    </div>
                    <h2 className="font-serif-display text-3xl sm:text-4xl text-[#FAF6F0] font-normal mt-2 tracking-tight">
                      Video Introduction & Spoken Pitch Studio
                    </h2>
                    <p className="text-xs text-[#9C968A] mt-2 max-w-2xl leading-relaxed">
                      Record your 30s to 1:00 min spoken pitch or upload an existing video file. Our audio pipeline automatically enhances your voice with studio EQ and dynamics leveling.
                    </p>
                  </div>
                  {activeProfile?.videoIntro && (
                    <div className="px-4 py-2.5 bg-[#161A18] border border-[#C5A880]/30 rounded-xl text-left">
                      <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880] block">Pitch Status</span>
                      <span className="text-xs font-semibold text-[#FAF6F0]">
                        Active ({activeProfile.videoIntro.durationSeconds}s) • Confidence {activeProfile.videoIntro.germanSpeakingConfidence * 10}%
                      </span>
                    </div>
                  )}
                </div>

                {activeProfile ? (
                  <VideoStudio
                    videoIntro={activeProfile.videoIntro}
                    onSubmitVideoIntro={handleSubmitVideoIntro}
                    onDeleteVideoIntro={handleDeleteVideoIntro}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Sign in with your Google account or email to record and upload your video introduction.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: EVALUATION */}
            {activeTab === 'evaluation' && (
              <motion.div
                key="evaluation"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full space-y-10 pb-16"
              >
                {activeProfile ? (
                  <>
                    <AgentOrchestratorView
                      profile={activeProfile}
                      onTriggerEvaluation={handleTriggerEvaluation}
                      onNavigateToRoadmap={() => setActiveTab('roadmap')}
                      onNavigateToLebenslauf={() => setActiveTab('lebenslauf')}
                    />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                      <ClarificationCenter
                        clarifications={activeProfile.clarifications}
                        onResolveClarification={handleResolveClarification}
                      />
                    </div>
                  </>
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Evaluation results will appear here after creating your profile.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: LEBENSLAUF */}
            {activeTab === 'lebenslauf' && (
              <motion.div
                key="lebenslauf"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <LebenslaufView profile={activeProfile} />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Your standardized German DIN 5008 CV will generate based on your verified credentials.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: ROADMAP */}
            {activeTab === 'roadmap' && (
              <motion.div
                key="roadmap"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                {activeProfile ? (
                  <RoadmapTimeline
                    roadmap={activeProfile.roadmap}
                    pathway={activeProfile.targetPathway}
                  />
                ) : (
                  <div className="max-w-xl mx-auto p-12 mt-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">Access Control</span>
                    <p className="font-serif-display text-2xl text-[#FAF6F0]">Please Sign In or Register</p>
                    <p className="text-xs text-[#9C968A]">Visa roadmaps are generated personalized to each applicant.</p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(true)}
                      className="px-5 py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: CONSULTANT */}
            {activeTab === 'consultant' && (
              <motion.div
                key="consultant"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full pb-16"
              >
                <ConsultantPortal
                  profiles={profiles}
                  onSelectApplicant={(p) => setActiveProfile(p)}
                  onUpdateReview={handleUpdateConsultantReview}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Quiet European Luxury Editorial Footer */}
        <footer className="border-t border-white/[0.08] bg-[#070807] py-10 text-xs text-[#9C968A] mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="font-serif-display text-base text-[#FAF6F0] font-normal">
                EUROBRIDGE AI
              </span>
              <span className="text-white/20">|</span>
              <span>Federal German Immigration Intelligence • Educaro Deutschland GmbH</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="hover:text-[#FAF6F0] transition-colors cursor-pointer"
              >
                DSGVO Privacy & Sovereignty Rights
              </button>
              <span>© 2026 EUROBRIDGE AI</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* GDPR Privacy Modal */}
      {activeProfile && (
        <PrivacyGdprModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
          profile={activeProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}
    </div>
  );
}
