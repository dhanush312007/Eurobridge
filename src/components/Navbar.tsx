import React from 'react';
import { User, NotificationAlert, ApplicantProfile } from '../types/index.ts';
import { NotificationBell } from './NotificationBell.tsx';
import { DossierProgressMeter } from './DossierProgressMeter.tsx';
import { 
  ShieldCheck, 
  Menu, 
  PanelLeftClose, 
  PanelLeftOpen, 
  UserPlus,
  CloudCheck
} from 'lucide-react';
import { auth } from '../firebase/config.ts';

interface NavbarProps {
  currentUser: User | null;
  activeProfile?: ApplicantProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: NotificationAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearReadHistory?: () => void;
  onOpenPrivacy: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  // Signature Intelligence Suite
  'future-twin': { title: 'FutureTwin Scenario Simulator', category: 'Intelligence Suite' },
  'interview-mirror': { title: 'InterviewMirror AI Coach', category: 'Intelligence Suite' },
  'life-lens': { title: 'LifeLens Relocation Finance', category: 'Intelligence Suite' },
  'gap2growth': { title: 'Gap2Growth Skill Intelligence', category: 'Intelligence Suite' },

  // Core Platform Tabs
  'overview': { title: 'Federal Pathways', category: 'Exploration' },
  'dashboard': { title: 'Applicant Dossier', category: 'Personal Hub' },
  'workspace': { title: 'AI Advisory Workspace', category: 'Autonomous Agents' },
  'profile': { title: 'Academic Credentials', category: 'Dossier Building' },
  'documents': { title: 'Document Intelligence Vault', category: 'Evidence OCR' },
  'video': { title: 'Video Pitch & Articulation Studio', category: 'Multimodal Articulation' },
  'evaluation': { title: 'Statutory Qualification Assessment', category: 'Bavarian & ZAB Engine' },
  'lebenslauf': { title: 'DIN 5008 German CV', category: 'Synthesizer' },
  'roadmap': { title: 'Relocation Milestone Roadmap', category: 'Visa Timeline' },
  'consultant': { title: 'Senior Advisor Review', category: 'Advisory Governance' }
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeProfile,
  activeTab,
  setActiveTab,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearReadHistory,
  onOpenPrivacy,
  onOpenAuth,
  onSignOut,
  onToggleSidebar,
  isSidebarCollapsed
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'Dashboard', category: 'Navigation' };

  return (
    <header className="sticky top-0 z-30 bg-[#0B0D0C]/90 backdrop-blur-md border-b border-white/[0.08] text-[#EDE8DE]">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle + Wordmark + Breadcrumb Trail */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          
          {/* Mobile Menu Button / Desktop Sidebar Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-[#9C968A] hover:text-[#FAF6F0] hover:bg-white/5 rounded-xl border border-white/10 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Toggle navigation sidebar'}
            aria-label="Toggle navigation sidebar"
          >
            <span className="lg:hidden">
              <Menu className="w-5 h-5 text-[#FAF6F0]" />
            </span>
            <span className="hidden lg:inline-flex">
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#C5A880]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </span>
          </button>

          {/* Logo & Wordmark */}
          <button 
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-left group focus:outline-none shrink-0 hidden sm:block cursor-pointer"
          >
            <span className="font-serif-display text-xl tracking-tight text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
              EUROBRIDGE AI
            </span>
          </button>

          {/* Editorial Breadcrumb Badge */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-white/[0.12] min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] shrink-0" aria-hidden="true" />
            <div className="min-w-0 truncate">
              <span className="hidden md:inline text-[10px] font-mono-numbers text-[#9C968A] uppercase tracking-wider">
                {currentTabInfo.category} / 
              </span>
              <span className="text-xs font-serif-display font-medium text-[#FAF6F0] tracking-tight ml-1 truncate">
                {currentTabInfo.title}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Notifications, Progress Meter & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Circular Dossier Progress Indicator (Desktop & Tablet) */}
          {activeProfile && (
            <div className="hidden sm:block">
              <DossierProgressMeter
                profile={activeProfile}
                onNavigateTab={setActiveTab}
                size={38}
              />
            </div>
          )}

          {/* Notification Bell */}
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearReadHistory={onClearReadHistory}
            onNavigateTab={setActiveTab}
          />

          {/* User Account Capsule */}
          {currentUser ? (
            <div className="hidden md:flex items-center gap-2.5 bg-[#141716] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#EDE8DE]">
              <div className="w-6 h-6 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] flex items-center justify-center font-serif-display text-xs font-semibold shrink-0">
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-[#FAF6F0] truncate max-w-[130px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded bg-black/40 text-[#C5A880] border border-[#C5A880]/20">
                  {currentUser.role === 'CONSULTANT' ? 'Advisor' : 'Applicant'}
                </span>
                {auth.currentUser && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono-numbers text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-1 py-0.2 rounded" title="Synced with Google Firebase Firestore">
                    <CloudCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Live</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="text-[11px] text-[#9C968A] hover:text-red-400 ml-1 cursor-pointer transition-colors"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 sm:px-4 py-2 bg-[#C5A880] text-[#0B0D0C] rounded-xl text-xs font-semibold hover:bg-[#D8C3A5] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In / Register</span>
              <span className="xs:hidden">Sign In</span>
            </button>
          )}

          {/* GDPR / Privacy Sovereignty Button */}
          <button
            type="button"
            onClick={onOpenPrivacy}
            title="DSGVO & Privacy Sovereignty"
            className="p-2 text-[#9C968A] hover:text-[#FAF6F0] hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
