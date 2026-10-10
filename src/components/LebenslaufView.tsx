import React, { useState, useEffect } from 'react';
import { ApplicantProfile } from '../types/index.ts';
import { Printer, Download } from 'lucide-react';

interface LebenslaufViewProps {
  profile: ApplicantProfile;
}

export const LebenslaufView: React.FC<LebenslaufViewProps> = ({ profile }) => {
  const [cvData, setCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profiles/${profile.id}/lebenslauf`)
      .then(res => res.json())
      .then(data => {
        setCvData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Lebenslauf:', err);
        setLoading(false);
      });
  }, [profile.id, profile.updatedAt]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    if (!cvData) return;
    const textContent = `
LEBENSLAUF (DIN 5008)
=========================================
PERSÖNLICHE DATEN
Name: ${cvData.personalDetails.fullName}
E-Mail: ${cvData.personalDetails.email}
Telefon: ${cvData.personalDetails.phone}
Wohnort: ${cvData.personalDetails.location}
Zielrichtung: ${cvData.personalDetails.targetPathway}

BERUFLICHER WERDEGANG
${cvData.experience?.map((exp: any) => `
${exp.period} | ${exp.role} (${exp.domain})
${exp.highlights.map((h: string) => ` - ${h}`).join('\n')}
`).join('\n') || 'Keine signifikante Berufserfahrung'}

AKADEMISCHE AUSBILDUNG
${cvData.education?.map((edu: any) => `
${edu.period} | ${edu.degree}
Hochschule: ${edu.institution}
${edu.grade}
${edu.anabinStatus}
`).join('\n')}

SPRACHKENNTNISSE
${cvData.languages?.map((lang: any) => `
- ${lang.language}: ${lang.level} (${lang.details || ''})
`).join('\n')}

ZERTIFIKATE & BESONDERE KENNTNISSE
${cvData.certifications?.map((c: string) => `- ${c}`).join('\n')}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lebenslauf_${profile.fullName.replace(/\s+/g, '_')}_DIN5008.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-[#9C968A]">
        Generating German DIN 5008 Lebenslauf structure...
      </div>
    );
  }

  if (!cvData) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-[#EDE8DE]">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            German Application Document
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl text-[#FAF6F0] font-normal mt-0.5">
            DIN 5008 Tabellarischer Lebenslauf
          </h2>
          <p className="text-xs text-[#9C968A] mt-1 font-light">
            Compliant with German employer, clinic, and university academic evaluation standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportText}
            className="px-3.5 py-2 bg-[#161A18] hover:bg-[#1D2220] border border-white/10 text-xs font-medium text-[#FAF6F0] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Export Text</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#D8C3A5] text-[#0B0D0C] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print DIN 5008</span>
          </button>
        </div>
      </div>

      {/* DIN 5008 Printable Document Sheet */}
      <div className="bg-[#111413] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl text-[#EDE8DE] space-y-8">
        
        {/* Document Header */}
        <div className="border-b border-white/[0.08] pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl font-normal text-[#FAF6F0] tracking-tight">
              {cvData.personalDetails.fullName}
            </h1>
            <p className="text-xs font-mono-numbers text-[#C5A880] mt-1 uppercase tracking-wider">
              Curriculum Vitae • {cvData.personalDetails.targetPathway}
            </p>
          </div>
          <div className="text-right text-xs font-mono-numbers text-[#9C968A] space-y-0.5">
            <p>{cvData.personalDetails.email}</p>
            <p>{cvData.personalDetails.phone}</p>
            <p>{cvData.personalDetails.location}</p>
          </div>
        </div>

        {/* Section: Academic Education */}
        <div className="space-y-4">
          <h3 className="font-serif-display text-lg text-[#FAF6F0] border-b border-white/[0.08] pb-2">
            Akademische Ausbildung
          </h3>
          <div className="space-y-4">
            {cvData.education?.map((edu: any, i: number) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                <div className="md:col-span-3 font-mono-numbers text-[#9C968A]">
                  {edu.period}
                </div>
                <div className="md:col-span-9 space-y-1">
                  <h4 className="font-semibold text-[#FAF6F0] text-sm">{edu.degree}</h4>
                  <p className="text-[#EDE8DE]">{edu.institution}</p>
                  <p className="font-mono-numbers text-[11px] text-[#C5A880]">{edu.grade}</p>
                  <p className="font-mono-numbers text-[10px] text-[#9C968A]">{edu.anabinStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Professional Experience */}
        {cvData.experience && cvData.experience.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-serif-display text-lg text-[#FAF6F0] border-b border-white/[0.08] pb-2">
              Beruflicher Werdegang
            </h3>
            <div className="space-y-4">
              {cvData.experience.map((exp: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-3 font-mono-numbers text-[#9C968A]">
                    {exp.period}
                  </div>
                  <div className="md:col-span-9 space-y-1">
                    <h4 className="font-semibold text-[#FAF6F0] text-sm">{exp.role}</h4>
                    <p className="text-[11px] text-[#C5A880]">{exp.domain}</p>
                    <ul className="list-disc pl-4 text-[#9C968A] text-[11px] space-y-1 mt-1">
                      {exp.highlights?.map((h: string, j: number) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Language Skills */}
        <div className="space-y-4">
          <h3 className="font-serif-display text-lg text-[#FAF6F0] border-b border-white/[0.08] pb-2">
            Sprachkenntnisse
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {cvData.languages?.map((lang: any, i: number) => (
              <div key={i} className="p-3 bg-[#161A18] border border-white/10 rounded-xl space-y-0.5">
                <span className="font-semibold text-[#FAF6F0]">{lang.language}</span>
                <p className="text-[#C5A880] font-mono-numbers text-[11px]">{lang.level}</p>
                {lang.details && <p className="text-[#9C968A] text-[10px]">{lang.details}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* DIN 5008 Compliance Footnote */}
        <div className="pt-8 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono-numbers text-[#9C968A]">
          <span>Geprüft nach DIN 5008 Richtlinien</span>
          <span>Ort / Datum: {cvData.personalDetails.location}, {new Date().toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};
