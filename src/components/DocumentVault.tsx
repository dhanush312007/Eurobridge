import React, { useState } from 'react';
import { UploadedDocument, DocumentType } from '../types/index.ts';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface DocumentVaultProps {
  documents: UploadedDocument[];
  onUploadDocument: (docData: {
    type: DocumentType;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    base64Data?: string;
    rawText?: string;
  }) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  onUploadDocument,
  onDeleteDocument
}) => {
  const [selectedType, setSelectedType] = useState<DocumentType>('APS_CERTIFICATE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(documents[0] || null);
  const [dragActive, setDragActive] = useState(false);

  React.useEffect(() => {
    if (documents.length > 0) {
      if (!selectedDoc || !documents.some(d => d.id === selectedDoc.id)) {
        setSelectedDoc(documents[0]);
      } else {
        const updated = documents.find(d => d.id === selectedDoc.id);
        if (updated) setSelectedDoc(updated);
      }
    } else {
      setSelectedDoc(null);
    }
  }, [documents]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await onUploadDocument({
          type: selectedType,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/pdf',
          base64Data: base64
        });
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#EDE8DE]">
      
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
            <span>EUROBRIDGE ATELIER</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>Multimodal Ingestion Engine</span>
            <span aria-hidden="true" className="text-white/20">/</span>
            <span>APS & KMK Standards</span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl text-[#FAF6F0] font-normal tracking-tight mt-1">
            Credential Vault & Evidence Registry
          </h1>
          <p className="text-xs sm:text-sm text-[#9C968A] mt-1.5 max-w-2xl font-light">
            Upload genuine Indian marksheets, university degree certificates, language certifications, and digital APS verification tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono-numbers text-[#9C968A]">
            {documents.length} Ingested Documents
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-7 sm:p-8 bg-[#111413] border border-white/10 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-xs font-mono-numbers uppercase tracking-widest text-[#C5A880]">
              Ingestion Channel
            </span>
            <h3 className="font-serif-display text-xl text-[#FAF6F0] mt-0.5">
              Select Document Classification
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              aria-label="Document Classification"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="bg-[#161A18] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#FAF6F0] focus:outline-none focus:border-[#C5A880]"
            >
              <option value="APS_CERTIFICATE">APS Digital Certificate (New Delhi)</option>
              <option value="ACADEMIC_TRANSCRIPT">Consolidated University Transcript</option>
              <option value="BACHELOR_DEGREE">Degree / Provisional Certificate</option>
              <option value="GERMAN_CERTIFICATE">Goethe / telc / TestDaF Certificate</option>
              <option value="ENGLISH_CERTIFICATE">IELTS / TOEFL Scorecard</option>
              <option value="EXPERIENCE_LETTER">Employment & Experience Certificate</option>
              <option value="PASSPORT">Passport Biometrics Page</option>
              <option value="SCHOOL_LEAVING_CERT">Class 10/12 School Leaving Certificate</option>
            </select>
          </div>
        </div>

        {/* Drop Zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors ${
            dragActive 
              ? 'border-[#C5A880] bg-[#C5A880]/5' 
              : 'border-white/15 hover:border-[#C5A880]/60 bg-[#161A18]/50'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-[#161A18] border border-white/10 flex items-center justify-center text-[#C5A880]">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#FAF6F0]">
              {isProcessing ? 'Analyzing Document with Multimodal OCR...' : 'Click or drag file to ingest'}
            </p>
            <p className="text-xs text-[#9C968A]">
              PDF, JPEG, or PNG up to 25MB • Automated Bavarian formula extraction
            </p>
          </div>
        </label>
      </div>

      {/* Documents Grid / Table */}
      <div className="space-y-4">
        <h3 className="font-serif-display text-2xl text-[#FAF6F0]">
          Verified Dossier Credentials
        </h3>

        {documents.length === 0 ? (
          <div className="p-12 bg-[#111413] border border-white/10 rounded-2xl text-center space-y-3">
            <FileText className="w-10 h-10 mx-auto text-[#9C968A] opacity-60" />
            <p className="text-sm font-medium text-[#FAF6F0]">No credentials ingested yet</p>
            <p className="text-xs text-[#9C968A] max-w-sm mx-auto">
              Upload your Indian academic transcripts, degree certificates, or APS tokens above to initiate verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-5 bg-[#111413] border rounded-2xl cursor-pointer transition-all space-y-4 ${
                  selectedDoc?.id === doc.id
                    ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-lg'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                      {doc.type.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-medium text-xs text-[#FAF6F0] line-clamp-1">
                      {doc.fileName}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded ${
                    doc.status === 'VERIFIED'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/20'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                {doc.flaggedIssues && doc.flaggedIssues.length > 0 && (
                  <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-lg text-[11px] text-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flagged Issue</span>
                    </div>
                    <p>{doc.flaggedIssues[0]}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#9C968A]">
                  <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Document Detail Card */}
      {selectedDoc && (
        <div className="p-7 sm:p-8 bg-[#111413] border border-white/10 rounded-2xl space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#C5A880]">
                Extraction Audit
              </span>
              <h3 className="font-serif-display text-2xl text-[#FAF6F0]">
                {selectedDoc.fileName}
              </h3>
            </div>
            <span className="text-xs font-mono-numbers text-[#9C968A]">
              Classification: {selectedDoc.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
                Extracted Metadata
              </span>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-[#9C968A]">Status</span>
                  <span className="font-semibold text-[#FAF6F0]">{selectedDoc.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-[#9C968A]">Uploaded Date</span>
                  <span className="font-mono-numbers text-[#FAF6F0]">{new Date(selectedDoc.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-[#9C968A]">Size</span>
                  <span className="font-mono-numbers text-[#FAF6F0]">{(selectedDoc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                {selectedDoc.extractedFields && Object.entries(selectedDoc.extractedFields).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-white/[0.06]">
                    <span className="text-[#9C968A]">{k}</span>
                    <span className="font-medium text-[#FAF6F0]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-[#161A18] border border-white/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-[#9C968A]">
                Verification Evidence & Snippets
              </span>
              {selectedDoc.evidences && selectedDoc.evidences.length > 0 ? (
                <div className="space-y-2">
                  {selectedDoc.evidences.map((ev, idx) => (
                    <div key={idx} className="p-2.5 bg-[#111413] rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-[#FAF6F0]">{ev.field}</span>
                        <span className="text-[#C5A880] font-mono-numbers">{Math.round(ev.confidence * 100)}% Conf.</span>
                      </div>
                      <p className="text-[11px] text-[#9C968A] italic">"{ev.snippet}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#EDE8DE] leading-relaxed">
                  Extracted through autonomous document intelligence engine and matched against KMK classification rules.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
