import React from 'react';
import { User, ApplicantProfile } from '../types/index.ts';
import { computeDossierCompletion } from './DossierProgressMeter.tsx';
import { 
  Compass, 
  LayoutDashboard, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  Video, 
  Award, 
  FileCheck, 
  Route, 
  UserCheck, 
  PanelLeftClose, 
  PanelLeftOpen, 
  X, 
  ShieldCheck, 
  LogOut, 
  UserPlus, 
  Layers,
  Mic,
  DollarSign,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  activeProfile?: ApplicantProfile | null;
  isOpen: boolean; // Mobile drawer open
  onClose: () => void; // Mobile drawer close
  isCollapsed: boolean; // Desktop sidebar collapsed
  onToggleCollapse: () => void; // Desktop sidebar toggle
  onOpenPrivacy: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeType?: 'gold' | 'emerald' | 'amber' | 'neutral';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  activeProfile,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  onOpenPrivacy,
  onOpenAuth,
  onSignOut
}) => {
  const dossierMetrics = activeProfile ? computeDossierCompletion(activeProfile) : null;
  const docsCount = activeProfile?.documents?.length || 0;
  const evalScore = activeProfile?.evaluation?.overallScore;
  const hasVideo = Boolean(activeProfile?.videoIntro?.transcript);

  const navSections: NavSection[] = [
    {
      title: 'INTELLIGENCE SUITE',
      items: [
        {
          id: 'future-twin',
          label: 'FutureTwin',
          icon: Layers,
          description: 'AI scenario simulator & delta comparison',
          badge: 'Simulate',
          badgeType: 'gold'
        },
        {
          id: 'interview-mirror',
          label: 'InterviewMirror',
          icon: Mic,
          description: 'Adaptive AI coach with live video preview',
          badge: 'Coach',
          badgeType: 'gold'
        },
        {
          id: 'life-lens',
          label: 'LifeLens',
          icon: DollarSign,
          description: 'Sourced German cities & budget planner',
          badge: 'Finance',
          badgeType: 'neutral'
        },
        {
          id: 'gap2growth',
          label: 'Gap2Growth',
          icon: TrendingUp,
          description: 'Skill gap detection & verified course catalog',
          badge: 'Growth',
          badgeType: 'emerald'
        }
      ]
    },
    {
      title: 'Navigation & Discovery',
      items: [
        {
          id: 'overview',
          label: 'Federal Pathways',
          icon: Compass,
          description: 'Higher Education, Ausbildung, Opportunity Card'
        },
        {
          id: 'dashboard',
          label: 'Applicant Dossier',
          icon: LayoutDashboard,
          description: 'Milestones & readiness journey',
          badge: activeProfile ? `${dossierMetrics?.totalPercentage || 0}%` : undefined,
          badgeType: (dossierMetrics?.totalPercentage || 0) >= 70 ? 'emerald' : 'gold'
        },
        {
          id: 'workspace',
          label: 'AI Advisory Workspace',
          icon: Sparkles,
          description: 'Multi-turn legal advisor & citations',
          badge: 'Live',
          badgeType: 'gold'
        }
      ]
    },
    {
      title: 'Credentials & Assets',
      items: [
        {
          id: 'profile',
          label: 'Academic Credentials',
          icon: GraduationCap,
          description: 'ZAB Anabin & Bavarian grade parameters'
        },
        {
          id: 'documents',
          label: 'Document Intelligence',
          icon: FileText,
          description: 'Autonomous OCR verification vault',
          badge: docsCount > 0 ? `${docsCount}` : undefined,
          badgeType: 'neutral'
        },
        {
          id: 'video',
          label: 'Video Pitch Studio',
          icon: Video,
          description: 'Spoken articulation & broadcast sound',
          badge: hasVideo ? 'Active' : 'Studio',
          badgeType: hasVideo ? 'emerald' : 'gold'
        }
      ]
    },
    {
      title: 'Assessment & Deliverables',
      items: [
        {
          id: 'evaluation',
          label: 'Qualification Assessment',
          icon: Award,
          description: 'Deterministic rules & Chancenkarte audit',
          badge: evalScore ? `${evalScore}/100` : undefined,
          badgeType: evalScore && evalScore >= 80 ? 'emerald' : 'amber'
        },
        {
          id: 'lebenslauf',
          label: 'DIN 5008 CV',
          icon: FileCheck,
          description: 'Standardized German Lebenslauf export'
        },
        {
          id: 'roadmap',
          label: 'Relocation Roadmap',
          icon: Route,
          description: 'Sequential statutory visa timeline'
        }
      ]
    },
    {
      title: 'Governance & Advisory',
      items: [
        {
          id: 'consultant',
          label: 'Advisor Review Portal',
          icon: UserCheck,
          description: 'Senior academic consultation & endorsements',
          badge: activeProfile?.consultantStatus === 'VISA_ENDORSED' ? 'Endorsed' : 'Portal',
          badgeType: activeProfile?.consultantStatus === 'VISA_ENDORSED' ? 'emerald' : 'neutral'
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const renderBadge = (badge: string, type: 'gold' | 'emerald' | 'amber' | 'neutral' = 'neutral') => {
    let classes = 'bg-white/10 text-[#9C968A] border-white/10';
    if (type === 'gold') {
      classes = 'bg-[#C5A880]/15 text-[#C5A880] border-[#C5A880]/30';
    } else if (type === 'emerald') {
      classes = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (type === 'amber') {
      classes = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-numbers border font-medium shrink-0 ${classes}`}>
        {badge}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0B0D0C]/80 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0E1110] border-r border-white/[0.08] text-[#EDE8DE]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 border-b border-white/[0.08] px-5 flex items-center justify-between shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelectTab('overview')}
                className="text-left group focus:outline-none cursor-pointer"
              >
                <span className="font-serif-display text-xl tracking-tight text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors block">
                  EUROBRIDGE AI
                </span>
                <span className="text-[10px] font-mono-numbers text-[#9C968A] tracking-wider uppercase block">
                  Atelier Intelligence
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectTab('overview')}
              className="mx-auto w-10 h-10 rounded-xl bg-[#161A18] border border-white/10 flex items-center justify-center text-[#C5A880] font-serif-display text-lg cursor-pointer"
              title="EUROBRIDGE AI"
            >
              E
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 text-[#9C968A] hover:text-[#FAF6F0] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#C5A880]" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex lg:hidden p-2 text-[#9C968A] hover:text-[#FAF6F0] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group relative
                        ${isActive 
                          ? 'bg-[#181C1A] text-[#FAF6F0] font-semibold border border-[#C5A880]/30 shadow-xs' 
                          : 'text-[#9C968A] hover:text-[#EDE8DE] hover:bg-white/[0.04] border border-transparent'}
                      `}
                    >
                      {isActive && (
                        <span 
                          className="absolute left-0 top-2 bottom-2 w-1 bg-[#C5A880] rounded-r" 
                          aria-hidden="true" 
                        />
                      )}
                      <div className={`shrink-0 p-1 rounded-lg ${isActive ? 'text-[#C5A880]' : 'text-[#8E887E] group-hover:text-[#EDE8DE]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="text-xs block truncate leading-tight">
                              {item.label}
                            </span>
                          </div>
                          {item.badge && renderBadge(item.badge, item.badgeType)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/[0.08] p-3 space-y-3 shrink-0 bg-[#0A0C0B]">
          {!isCollapsed && activeProfile && dossierMetrics && (
            <div 
              onClick={() => handleSelectTab('dashboard')}
              className="p-3 bg-[#131715] border border-white/[0.08] hover:border-[#C5A880]/30 rounded-xl space-y-2 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9C968A] group-hover:text-[#FAF6F0] transition-colors font-medium">Dossier Progress</span>
                <span className="font-mono-numbers text-[#C5A880] font-semibold">{dossierMetrics.totalPercentage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#C5A880] h-full transition-all duration-300"
                  style={{ width: `${dossierMetrics.totalPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#8E887E]">
                <span>{dossierMetrics.completedStepsCount} of {dossierMetrics.totalStepsCount} verified</span>
                <ChevronRight className="w-3 h-3 text-[#C5A880]" />
              </div>
            </div>
          )}

          {currentUser ? (
            <div className={`flex items-center justify-between p-2 rounded-xl bg-[#141716] border border-white/[0.06] ${isCollapsed ? 'justify-center p-1.5' : ''}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] flex items-center justify-center font-serif-display text-sm font-semibold shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#FAF6F0] truncate leading-tight">
                      {currentUser.fullName}
                    </p>
                    <span className="text-[10px] font-mono-numbers text-[#9C968A] uppercase">
                      {currentUser.role === 'CONSULTANT' ? 'Advisor' : 'Applicant'}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="p-1.5 text-[#9C968A] hover:text-[#FAF6F0] rounded-md transition-colors cursor-pointer"
                    title="DSGVO & Privacy Sovereignty"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="p-1.5 text-[#9C968A] hover:text-red-400 rounded-md transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-1 ${isCollapsed ? 'text-center' : ''}`}>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-2.5 px-3 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-10 h-10 mx-auto rounded-xl bg-[#C5A880] text-[#0B0D0C] flex items-center justify-center cursor-pointer"
                  title="Sign In / Register"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
