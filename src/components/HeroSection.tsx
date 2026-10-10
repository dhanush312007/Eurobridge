import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PathwayType } from '../types/index.ts';
import { berlinArchImg, munichLibraryImg, ausbildungImg, employmentImg } from '../assets/images.ts';

interface HeroSectionProps {
  onSelectPathway: (pathway: PathwayType) => void;
  activePathway: PathwayType;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectPathway,
  activePathway
}) => {
  return (
    <div className="space-y-28 pb-24 text-[#EDE8DE]">
      
      {/* SECTION 1: Grand Architectural Editorial Hero */}
      <section className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-8 mt-6 rounded-2xl bg-[#111413] border border-white/10 shadow-2xl">
        
        {/* Subtle Architectural Bridge Grid Motif Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bridge-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 80 M 0 0 L 80 80" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
                <path d="M 0 40 L 80 40 M 40 0 L 40 80" fill="none" stroke="#C5A880" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bridge-grid)" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative z-10">
          
          {/* Left: Oversized Luxury Editorial Typography */}
          <div className="lg:col-span-7 p-8 sm:p-14 lg:p-20 flex flex-col justify-between">
            <div className="space-y-8 max-w-2xl">
              
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                <span>EUROBRIDGE AI</span>
                <span aria-hidden="true" className="text-white/30">/</span>
                <span>Signature Intelligence Suite</span>
                <span aria-hidden="true" className="text-white/30">/</span>
                <span>Aufenthaltsgesetz</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-serif-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.04] text-[#FAF6F0] text-balance">
                  Your bridge to Germany, <span className="italic font-cormorant font-normal text-[#C5A880]">rigorously verified.</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-[#C8C3B8] leading-relaxed font-light max-w-xl">
                An authoritative immigration and academic intelligence atelier guiding Indian applicants through German public universities, dual vocational Ausbildung, and skilled employment under the German Skilled Immigration Act.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono-numbers text-[#9C968A]">
                <span>§ 16b / 16a / 20a AufenthG</span>
                <span aria-hidden="true" className="text-white/20">/</span>
                <span>KMK Anabin Equivalence</span>
                <span aria-hidden="true" className="text-white/20">/</span>
                <span>APS New Delhi Verification</span>
              </div>
            </div>

            <div className="pt-10 mt-12 grid grid-cols-3 gap-6 border-t border-white/[0.08]">
              <div>
                <p className="font-mono-numbers text-xl sm:text-2xl font-medium text-[#FAF6F0]">KMK Anabin</p>
                <p className="text-xs text-[#9C968A] mt-1">Official Institutional Classification</p>
              </div>
              <div>
                <p className="font-mono-numbers text-xl sm:text-2xl font-medium text-[#FAF6F0]">DIN 5008</p>
                <p className="text-xs text-[#9C968A] mt-1">Standardized German CV Standard</p>
              </div>
              <div>
                <p className="font-mono-numbers text-xl sm:text-2xl font-medium text-[#FAF6F0]">Bavarian Rule</p>
                <p className="text-xs text-[#9C968A] mt-1">1.0 – 4.0 Converted Scale</p>
              </div>
            </div>
          </div>

          {/* Right: Architectural European Photography */}
          <div className="lg:col-span-5 relative min-h-[420px] lg:min-h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-white/[0.08]">
            <img
              src={berlinArchImg}
              alt="Architectural view of Berlin Spree and Museum Island"
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111413] via-[#111413]/40 to-transparent" />
            
            <div className="absolute bottom-8 right-8 left-8 lg:left-auto lg:max-w-xs bg-[#0B0D0C]/85 backdrop-blur-md p-5 rounded-xl border border-white/10 text-xs text-[#EDE8DE] shadow-2xl">
              <span className="text-[#C5A880] font-medium block mb-1 font-mono-numbers uppercase text-[10px] tracking-wider">
                Regulatory Grounding • Berlin, Germany
              </span>
              <p className="text-[11px] text-[#9C968A] leading-relaxed">
                KMK Central Office for Foreign Education (ZAB) classification standards and German Federal Academic Evaluation protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Three Strategic Pathways */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div>
            <p className="text-xs uppercase font-mono-numbers tracking-widest text-[#C5A880] mb-2 font-medium">
              01 • Strategic Legal Pathways
            </p>
            <h2 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight">
              Select Your Target Pathway in Germany
            </h2>
            <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-2xl font-light">
              Each pathway activates specific statutory rules, documentary evidence standards, and consular requirements under German immigration law.
            </p>
          </div>
          
          <div className="text-xs font-mono-numbers text-[#9C968A] tracking-wider">
            Residence Act • AufenthG § 16b / 16a / 20a
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pathway 1: Higher Education */}
          <div 
            onClick={() => onSelectPathway('HIGHER_EDUCATION')}
            className={`group relative bg-[#131615] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#C5A880]/60 flex flex-col justify-between ${
              activePathway === 'HIGHER_EDUCATION' 
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-xl' 
                : 'border-white/10'
            }`}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={munichLibraryImg}
                alt="Munich University historical reading room"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131615] via-[#131615]/30 to-transparent" />
              
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-mono-numbers uppercase tracking-widest px-2.5 py-1 rounded bg-[#0B0D0C]/80 backdrop-blur-sm text-[#C5A880] border border-white/10">
                  § 16b AufenthG
                </span>
              </div>
            </div>

            <div className="p-7 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-numbers text-[#9C968A] mb-1.5">
                  <span>Public Universities</span>
                  <span>TU9 / U15</span>
                </div>
                <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                  Higher Education
                </h3>
                <p className="text-xs text-[#9C968A] leading-relaxed mt-2">
                  Direct master's or bachelor's admission at tuition-free German state universities. Mandatory APS certificate, Bavarian converted CGPA, and blocked account.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono-numbers text-[#9C968A]">Zero Tuition Fees</span>
                <span className="text-[#C5A880] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Select Pathway</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Pathway 2: Dual Ausbildung */}
          <div 
            onClick={() => onSelectPathway('AUSBILDUNG')}
            className={`group relative bg-[#131615] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#C5A880]/60 flex flex-col justify-between ${
              activePathway === 'AUSBILDUNG' 
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-xl' 
                : 'border-white/10'
            }`}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={ausbildungImg}
                alt="Technical precision laboratory in Germany"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131615] via-[#131615]/30 to-transparent" />
              
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-mono-numbers uppercase tracking-widest px-2.5 py-1 rounded bg-[#0B0D0C]/80 backdrop-blur-sm text-[#C5A880] border border-white/10">
                  § 16a AufenthG
                </span>
              </div>
            </div>

            <div className="p-7 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-numbers text-[#9C968A] mb-1.5">
                  <span>Duale Ausbildung</span>
                  <span>B1 / B2 German</span>
                </div>
                <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                  Duale Ausbildung
                </h3>
                <p className="text-xs text-[#9C968A] leading-relaxed mt-2">
                  Paid 3-year dual vocational training contract with German corporate employers. Earn monthly stipend (€950 - €1,400) without blocked account requirement.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono-numbers text-[#9C968A]">Monthly Stipend Paid</span>
                <span className="text-[#C5A880] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Select Pathway</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Pathway 3: Skilled Employment */}
          <div 
            onClick={() => onSelectPathway('EMPLOYMENT')}
            className={`group relative bg-[#131615] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#C5A880]/60 flex flex-col justify-between ${
              activePathway === 'EMPLOYMENT' 
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-xl' 
                : 'border-white/10'
            }`}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={employmentImg}
                alt="Technology innovation campus in Berlin"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131615] via-[#131615]/30 to-transparent" />
              
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-mono-numbers uppercase tracking-widest px-2.5 py-1 rounded bg-[#0B0D0C]/80 backdrop-blur-sm text-[#C5A880] border border-white/10">
                  § 20a AufenthG
                </span>
              </div>
            </div>

            <div className="p-7 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-numbers text-[#9C968A] mb-1.5">
                  <span>Chancenkarte</span>
                  <span>Points-Based / EU Blue Card</span>
                </div>
                <h3 className="font-serif-display text-2xl text-[#FAF6F0] font-normal group-hover:text-[#C5A880] transition-colors">
                  Skilled Employment
                </h3>
                <p className="text-xs text-[#9C968A] leading-relaxed mt-2">
                  Opportunity Card points scoring system (minimum 6 points required) or direct EU Blue Card skilled worker visa for tech and engineering professionals.
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono-numbers text-[#9C968A]">Direct Work Permit</span>
                <span className="text-[#C5A880] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Select Pathway</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: The Intelligence Suite Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-white/[0.08] pb-8">
          <p className="text-xs uppercase font-mono-numbers tracking-widest text-[#C5A880] mb-2 font-medium">
            02 • Signature Intelligence Suite
          </p>
          <h2 className="font-serif-display text-3xl sm:text-5xl text-[#FAF6F0] font-normal tracking-tight">
            Four Interconnected AI Modules
          </h2>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-2 max-w-2xl font-light">
            EUROBRIDGE AI moves beyond applicant management to active applicant growth: simulate futures, rehearse interviews, plan finances, and bridge qualification gaps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#131615] border border-white/10 rounded-xl space-y-3">
            <span className="font-mono-numbers text-xs text-[#C5A880]">01 / FUTURETWIN</span>
            <h4 className="font-serif-display text-lg text-[#FAF6F0]">Scenario Twin</h4>
            <p className="text-xs text-[#9C968A] leading-relaxed">
              Explore how hypothetical improvements in German level, experience, or funds change your admission readiness.
            </p>
          </div>

          <div className="p-6 bg-[#131615] border border-white/10 rounded-xl space-y-3">
            <span className="font-mono-numbers text-xs text-[#C5A880]">02 / INTERVIEWMIRROR</span>
            <h4 className="font-serif-display text-lg text-[#FAF6F0]">AI Interview Coach</h4>
            <p className="text-xs text-[#9C968A] leading-relaxed">
              Realistic, adaptive interviews in Text, Voice, or Video mode with live camera preview and evidence-based reports.
            </p>
          </div>

          <div className="p-6 bg-[#131615] border border-white/10 rounded-xl space-y-3">
            <span className="font-mono-numbers text-xs text-[#C5A880]">03 / LIFELENS</span>
            <h4 className="font-serif-display text-lg text-[#FAF6F0]">Relocation Finance</h4>
            <p className="text-xs text-[#9C968A] leading-relaxed">
              Compare 10 German cities with sourced DAAD cost data, student budgets, and EUR/INR conversion.
            </p>
          </div>

          <div className="p-6 bg-[#131615] border border-white/10 rounded-xl space-y-3">
            <span className="font-mono-numbers text-xs text-[#C5A880]">04 / GAP2GROWTH</span>
            <h4 className="font-serif-display text-lg text-[#FAF6F0]">Skill Intelligence</h4>
            <p className="text-xs text-[#9C968A] leading-relaxed">
              Detect qualification gaps and discover real courses from Goethe-Institut, DAAD, and RWTH Aachen to bridge them.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
