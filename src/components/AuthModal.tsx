import React, { useState } from 'react';
import { User, UserRole, PathwayType } from '../types/index.ts';
import { 
  X, 
  ArrowRight, 
  AlertCircle, 
  Copy, 
  Check 
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase/config.ts';
import { syncUserToFirestore, syncProfileToFirestore } from '../services/firestoreService.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, profile?: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [role, setRole] = useState<UserRole>('APPLICANT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetPathway, setTargetPathway] = useState<PathwayType>('HIGHER_EDUCATION');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [state, setState] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unauthorizedDomainNotice, setUnauthorizedDomainNotice] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [fallbackName, setFallbackName] = useState('');

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentHostname && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleOneClickLogin = async (targetEmail: string, targetName = '', targetRole: UserRole = 'APPLICANT') => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: targetEmail.trim(), 
          autoRegister: true, 
          fullName: targetName,
          role: targetRole 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      await syncUserToFirestore(data.user);
      if (data.profile) {
        await syncProfileToFirestore(data.profile);
      }
      onAuthSuccess(data.user, data.profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setUnauthorizedDomainNotice(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userPayload: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        fullName: fbUser.displayName || 'Applicant',
        role: role || 'APPLICANT',
        phone: fbUser.phoneNumber || '',
        createdAt: new Date().toISOString()
      };

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: fbUser.uid,
          email: fbUser.email,
          autoRegister: true,
          fullName: fbUser.displayName || 'Applicant',
          role
        })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const finalUser: User = {
          ...loginData.user,
          id: fbUser.uid,
          email: fbUser.email || loginData.user.email,
          fullName: fbUser.displayName || loginData.user.fullName
        };

        await syncUserToFirestore(finalUser);

        let finalProfile = loginData.profile;
        if (!finalProfile) {
          finalProfile = {
            id: `prof-${fbUser.uid}`,
            userId: fbUser.uid,
            fullName: finalUser.fullName,
            email: finalUser.email,
            phone: finalUser.phone || '',
            cityOfResidence: cityOfResidence.trim() || 'Bengaluru',
            state: state.trim() || 'Karnataka',
            targetPathway,
            targetIntake: 'Winter Semester 2026/27',
            highestDegree: 'Bachelor of Technology',
            indianInstitution: 'Visvesvaraya Technological University',
            anabinStatus: 'H+',
            majorFieldOfStudy: 'Computer Science & Engineering',
            graduationYear: 2024,
            gradingScaleType: 'CGPA_10',
            obtainedScore: 8.2,
            maximumScore: 10.0,
            minimumPassingScore: 4.0,
            germanLevel: 'A2',
            englishTestType: 'IELTS',
            englishScore: '7.5 (C1)',
            yearsOfWorkExperience: 1,
            plannedFinancingSource: 'BLOCKED_ACCOUNT_SELF',
            blockedAccountPrepared: true,
            documents: [],
            clarifications: [],
            roadmap: [],
            consultantStatus: 'NEW',
            updatedAt: new Date().toISOString()
          };
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalProfile)
          });
        } else {
          finalProfile = {
            ...finalProfile,
            userId: fbUser.uid
          };
        }

        await syncProfileToFirestore(finalProfile);
        onAuthSuccess(finalUser, finalProfile);
        onClose();
        return;
      }

      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || 'Applicant',
          role,
          phone: fbUser.phoneNumber || '',
          targetPathway,
          cityOfResidence: cityOfResidence.trim() || 'Bengaluru',
          state: state.trim() || 'Karnataka'
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        setErrorMsg(regData.error || 'Failed to complete registration with Google account.');
        return;
      }
      const registeredUser: User = {
        ...regData.user,
        id: fbUser.uid
      };
      await syncUserToFirestore(registeredUser);
      let registeredProfile = regData.profile;
      if (registeredProfile) {
        registeredProfile = {
          ...registeredProfile,
          userId: fbUser.uid
        };
        await syncProfileToFirestore(registeredProfile);
      }
      onAuthSuccess(registeredUser, registeredProfile);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomainNotice(currentHostname);
      } else {
        setErrorMsg(err.message || 'Google authentication was not completed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (mode === 'REGISTER' && !fullName.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'REGISTER') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            fullName: fullName.trim(),
            role,
            phone: phone.trim(),
            targetPathway,
            cityOfResidence: cityOfResidence.trim() || 'Bengaluru',
            state: state.trim() || 'Karnataka'
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to register account.');
          return;
        }
        await syncUserToFirestore(data.user);
        if (data.profile) {
          await syncProfileToFirestore(data.profile);
        }
        onAuthSuccess(data.user, data.profile);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email.trim(), 
            autoRegister: true, 
            fullName: email.split('@')[0].replace(/[._]/g, ' ') 
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Account not found. Please register first.');
          return;
        }
        await syncUserToFirestore(data.user);
        if (data.profile) {
          await syncProfileToFirestore(data.profile);
        }
        onAuthSuccess(data.user, data.profile);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D0C]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111413] border border-white/10 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl text-[#EDE8DE] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              <span>EUROBRIDGE ATELIER</span>
              <span aria-hidden="true">/</span>
              <span>Educaro Deutschland</span>
            </div>
            <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal mt-1">
              {mode === 'REGISTER' ? 'Create Your Applicant Dossier' : 'Sign In to Your Dossier'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9C968A] hover:text-[#FAF6F0] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#161A18] rounded-lg border border-white/[0.08] text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setErrorMsg(''); setUnauthorizedDomainNotice(null); }}
            className={`py-2 rounded-md transition-colors cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-[#222724] text-[#FAF6F0] shadow-xs font-semibold'
                : 'text-[#9C968A] hover:text-[#FAF6F0]'
            }`}
          >
            Register New Dossier
          </button>
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setErrorMsg(''); setUnauthorizedDomainNotice(null); }}
            className={`py-2 rounded-md transition-colors cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-[#222724] text-[#FAF6F0] shadow-xs font-semibold'
                : 'text-[#9C968A] hover:text-[#FAF6F0]'
            }`}
          >
            Sign In Existing
          </button>
        </div>

        {/* Google Authentication Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 bg-[#181C1A] border border-white/10 hover:border-[#C5A880]/50 text-[#FAF6F0] rounded-lg text-xs font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-colors hover:bg-[#202522] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.19 0 10.03 0 12s.46 3.81 1.26 5.42l4.02-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>
              {googleLoading ? 'Connecting to Google...' : mode === 'REGISTER' ? 'Sign up with Google' : 'Sign in with Google'}
            </span>
          </button>

          {unauthorizedDomainNotice && (
            <div className="mt-3.5 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-start gap-2 text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-100">
                    Preview Domain Authorization Notice
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Google OAuth requires authorized domains in Firebase Console. You can enter your email directly below:
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-amber-500/20 font-mono text-[11px] text-amber-200">
                <span className="truncate flex-1">{unauthorizedDomainNotice}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="pt-1 border-t border-amber-500/20 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={fallbackEmail}
                    onChange={(e) => setFallbackEmail(e.target.value)}
                    placeholder="your.email@domain.com"
                    className="flex-1 bg-[#111413] border border-amber-500/30 rounded px-2.5 py-1.5 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                  />
                  <button
                    type="button"
                    onClick={() => handleOneClickLogin(fallbackEmail, fallbackName || '', role)}
                    disabled={!fallbackEmail || !fallbackEmail.includes('@') || loading}
                    className="px-3 py-1.5 bg-[#C5A880] text-[#0B0D0C] font-semibold text-xs rounded hover:bg-[#D8C3A5] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#111413] px-2 text-[#9C968A] font-mono-numbers">
                or continue with email credentials
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1.5">
                  Account Type & Objective
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole('APPLICANT')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      role === 'APPLICANT'
                        ? 'border-[#C5A880] bg-[#1C201E] text-[#FAF6F0] font-semibold'
                        : 'border-white/10 bg-[#161A18] text-[#9C968A]'
                    }`}
                  >
                    <p className="font-semibold text-xs text-[#FAF6F0]">Indian Applicant</p>
                    <p className="text-[11px] font-normal mt-0.5 text-[#9C968A]">Higher Ed / Ausbildung / Job</p>
                  </div>
                  <div
                    onClick={() => setRole('CONSULTANT')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      role === 'CONSULTANT'
                        ? 'border-[#C5A880] bg-[#1C201E] text-[#FAF6F0] font-semibold'
                        : 'border-white/10 bg-[#161A18] text-[#9C968A]'
                    }`}
                  >
                    <p className="font-semibold text-xs text-[#FAF6F0]">Educaro Advisor</p>
                    <p className="text-[11px] font-normal mt-0.5 text-[#9C968A]">Case review & endorsement</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#EDE8DE] mb-1">
                  Full Legal Name (as per Passport)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditi Sharma"
                  className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {role === 'APPLICANT' && (
                <>
                  <div>
                    <label className="block font-medium text-[#EDE8DE] mb-1">
                      Target Pathway in Germany
                    </label>
                    <select
                      aria-label="Target Pathway in Germany"
                      value={targetPathway}
                      onChange={(e) => setTargetPathway(e.target.value as PathwayType)}
                      className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="HIGHER_EDUCATION">Higher Education (Master's / Bachelor's)</option>
                      <option value="AUSBILDUNG">Duale Ausbildung (Paid Vocational Training)</option>
                      <option value="EMPLOYMENT">Skilled Employment / Chancenkarte</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-[#EDE8DE] mb-1">City in India</label>
                      <input
                        type="text"
                        value={cityOfResidence}
                        onChange={(e) => setCityOfResidence(e.target.value)}
                        placeholder="e.g. Pune"
                        className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#EDE8DE] mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block font-medium text-[#EDE8DE] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. applicant@domain.in"
              className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block font-medium text-[#EDE8DE] mb-1">
                Phone Number (optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#181C1A] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] placeholder-[#6B665D] focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#C5A880] text-[#0B0D0C] rounded-lg text-xs font-semibold hover:bg-[#D8C3A5] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Processing...' : mode === 'REGISTER' ? 'Register Dossier' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
