import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, X } from 'lucide-react';
import { formatIstTimestamp } from '../../utils/dateUtils';

export interface FocusPanelProps {
  message: string;
  requestedAt?: string;
  documentType?: string;
  originalDocumentName?: string;
  isSent?: boolean;
  uploadedFileName?: string;
  onSendDocument: (file: File) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
}

export const FocusPanel: React.FC<FocusPanelProps> = ({
  message,
  requestedAt,
  documentType = 'College ID',
  originalDocumentName,
  isSent = false,
  uploadedFileName,
  onSendDocument,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isLocallySent, setIsLocallySent] = useState(false);
  const [locallySentFileName, setLocallySentFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 5 MB limit. Please select a smaller file.');
      return;
    }

    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.(pdf|jpe?g|png|webp)$/i);
    if (!isValidType) {
      setError('Unsupported file type. Please upload a PDF or an image (JPG, PNG, WebP).');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 5 MB limit. Please select a smaller file.');
      return;
    }

    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.(pdf|jpe?g|png|webp)$/i);
    if (!isValidType) {
      setError('Unsupported file type. Please upload a PDF or an image (JPG, PNG, WebP).');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const fileNameToKeep = selectedFile.name;
      const res = await onSendDocument(selectedFile);
      if (!res.ok) {
        setError(res.error || 'Failed to send document to administrator. Please try again.');
      } else {
        setLocallySentFileName(fileNameToKeep);
        setSelectedFile(null);
        setIsReplacing(false);
        setIsLocallySent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formattedTime = requestedAt ? formatIstTimestamp(requestedAt) : 'Recently';

  // Determine if showing the "Sent" state
  const showSentState = (isSent || isLocallySent) && !isReplacing;
  const displayFileName = locallySentFileName || uploadedFileName || originalDocumentName;

  return (
    <div
      className={`w-full bg-[#FAFAFA] rounded-[12px] p-5 sm:p-6 flex flex-col gap-4 text-left ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <h2 className="text-sm font-semibold text-[#0A0A0A] tracking-tight">
          Message from administrator
        </h2>
        <span className="text-xs text-[#6B7280]">
          {formattedTime}
        </span>
      </div>

      {/* Message Text and Metadata */}
      <div className="flex flex-col gap-2">
        <div className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] leading-relaxed">
          <p className="font-normal italic">
            "{message || 'Please provide an updated institutional verification document.'}"
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280] pt-0.5">
          <span>Requested document type:</span>
          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-medium text-[#0A0A0A]">
            {documentType}
          </span>
          {displayFileName && (
            <span className="text-[#6B7280]">
              · File: <span className="font-mono text-[#0A0A0A]">{displayFileName}</span>
            </span>
          )}
        </div>
      </div>

      {/* State A: Already Sent */}
      {showSentState ? (
        <div className="mt-2 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0A0A0A]">
                Sent. Waiting for the administrator
              </span>
              {displayFileName && (
                <span className="text-xs text-[#6B7280]">
                  Attached: <span className="font-medium text-[#0A0A0A]">{displayFileName}</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsReplacing(true);
              setIsLocallySent(false);
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-[#0A0A0A] hover:bg-[#FFFFFF] border border-[#6B7280] rounded-lg transition-colors inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
          >
            Replace document
          </button>
        </div>
      ) : (
        /* State B: Upload Form */
        <form onSubmit={handleSubmit} className="mt-2 pt-3 border-t border-[#E5E7EB] flex flex-col gap-3">
          {isReplacing && (
            <div className="flex items-center justify-between text-xs text-[#6B7280] pb-1">
              <span>Replacing previously submitted document</span>
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false);
                  setSelectedFile(null);
                  setError(null);
                }}
                className="text-[#0A0A0A] hover:underline font-medium min-h-[44px] flex items-center"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="focus-panel-doc-upload"
          />

          {/* Drag & Drop Upload Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-[#D1D5DB] hover:border-[#0A0A0A] rounded-lg bg-[#FFFFFF] text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[110px]"
            >
              <Upload className="w-5 h-5 text-[#6B7280]" />
              <div className="text-xs text-[#0A0A0A] font-medium">
                Click to browse or drag and drop your file here
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Accepts PDF, JPG, PNG or WebP · Maximum size 5 MB
              </div>
            </div>
          ) : (
            /* Selected File Card */
            <div className="p-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[#0A0A0A] truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 text-[#6B7280] hover:text-[#0A0A0A] rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending to administrator...</span>
                </>
              ) : (
                <>
                  <span>Send to administrator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
