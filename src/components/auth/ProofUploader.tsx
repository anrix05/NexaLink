import React, { useState, useRef } from 'react';
import { Camera, Upload, FileText, CheckCircle2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { AnimatedCheckIcon } from '../common/UIComponents';

export interface ProofUploaderProps {
  label?: string;
  hint?: string;
  role?: 'student' | 'alumni' | 'faculty';
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadedFileName?: string;
  error?: string | null;
  className?: string;
  disabled?: boolean;
}

export const ProofUploader: React.FC<ProofUploaderProps> = ({
  label,
  hint,
  role = 'student',
  onFileSelect,
  onFileRemove,
  isUploading = false,
  uploadProgress = 0,
  uploadedFileName,
  error = null,
  className = '',
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Role-based document guidance
  const defaultLabel =
    label ||
    (role === 'student'
      ? 'College ID or fee receipt'
      : role === 'faculty'
      ? 'Institutional employee ID'
      : 'Degree certificate or convocation document');

  const defaultHint =
    hint ||
    (role === 'student'
      ? 'Upload your current student ID card or recent semester fee receipt (PDF or clear image, max 5MB).'
      : role === 'faculty'
      ? 'Upload your staff identity card or appointment verification (PDF or clear image, max 5MB).'
      : 'Upload your graduation degree, provisional certificate, or transcript (PDF or clear image, max 5MB).');

  const validateAndHandleFile = (file: File) => {
    setValidationError(null);

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    // Type check: image or pdf
    const isValidType =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isValidType) {
      setValidationError('Unsupported format. Please upload a PDF or an image (JPG, PNG).');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onFileRemove?.();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeFileName = selectedFile?.name || uploadedFileName;

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {/* Title & guidance */}
      <div className="flex flex-col gap-0.5">
        <label className="text-sm font-medium text-[#0A0A0A] flex items-center justify-between">
          <span>{defaultLabel}</span>
          <span className="text-xs text-[#6B7280] font-normal">Max 5MB</span>
        </label>
        <p className="text-xs text-[#6B7280] leading-relaxed">{defaultHint}</p>
      </div>

      {/* Hidden native inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) validateAndHandleFile(e.target.files[0]);
        }}
        disabled={disabled || isUploading}
      />
      {/* Mobile camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) validateAndHandleFile(e.target.files[0]);
        }}
        disabled={disabled || isUploading}
      />

      {/* File row container (not boxy dropzone) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full min-h-[64px] p-3 rounded-lg border transition-colors flex items-center justify-between gap-3
          ${
            dragOver
              ? 'border-[#0A0A0A] bg-[#FAFAFA]'
              : activeFileName
              ? 'border-[#E5E7EB] bg-[#FAFAFA]'
              : 'border-[#6B7280] bg-[#FFFFFF] hover:border-[#0A0A0A]'
          }
        `}
      >
        {activeFileName ? (
          // File Attached / Uploaded Row
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Document thumbnail"
                  className="w-10 h-10 object-cover rounded border border-[#E5E7EB] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center shrink-0 text-[#6B7280]">
                  <FileText className="w-5 h-5" />
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#0A0A0A] truncate">
                  {activeFileName}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {selectedFile ? formatFileSize(selectedFile.size) : 'Document attached'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isUploading ? (
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="text-xs text-[#0A0A0A] hover:underline font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled}
                    aria-label="Remove document"
                    className="p-1 text-[#6B7280] hover:text-[#DC2626] rounded focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Empty State Actions
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Upload className="w-4 h-4 text-[#6B7280] shrink-0 hidden sm:inline" />
              <span>Drag & drop your document here, or</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Choose File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="flex-1 sm:flex-initial h-10 px-3.5 rounded-lg border border-[#0A0A0A] bg-[#FFFFFF] text-[#0A0A0A] text-xs font-medium hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 transition-colors whitespace-nowrap"
              >
                Choose file
              </button>

              {/* Mobile "Take a photo" Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="sm:hidden flex-1 h-10 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-[#0A0A0A] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] transition-colors whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar when uploading */}
      {isUploading && (
        <div className="w-full h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A0A0A] transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error display */}
      {(validationError || error) && (
        <div className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{validationError || error}</span>
        </div>
      )}
    </div>
  );
};
