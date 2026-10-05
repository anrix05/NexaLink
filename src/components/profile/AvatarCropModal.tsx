import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { getCroppedImg } from '../../lib/avatarUpload';

export interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => Promise<void>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  triggerRef,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setErrorMessage(null);
      setPreviewUrl(null);
    }
  }, [isOpen, imageSrc]);

  // Clean up preview object URL on unmount or close
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [previewUrl]);

  // Update live preview when crop changes (debounced ~100ms)
  const updateLivePreview = useCallback(
    async (currentCropPixels: Area, currentRotation: number) => {
      try {
        const blob = await getCroppedImg(imageSrc, currentCropPixels, currentRotation, 160);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
          }
          return url;
        });
      } catch {
        // ignore preview generation errors
      }
    },
    [imageSrc]
  );

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateLivePreview(croppedPixels, rotation);
      }, 100);
    },
    [updateLivePreview, rotation]
  );

  // Keyboard navigation & accessibility controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        e.preventDefault();
        onClose();
        return;
      }

      // Keyboard crop nudging with arrow keys
      const step = e.shiftKey ? 1 : 10;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Prevent page scrolling
        e.preventDefault();
        setCrop((prev) => {
          switch (e.key) {
            case 'ArrowUp':
              return { ...prev, y: prev.y - step };
            case 'ArrowDown':
              return { ...prev, y: prev.y + step };
            case 'ArrowLeft':
              return { ...prev, x: prev.x - step };
            case 'ArrowRight':
              return { ...prev, x: prev.x + step };
            default:
              return prev;
          }
        });
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Focus trap & return focus to trigger on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        sliderRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      triggerRef?.current?.focus();
    }
  }, [isOpen, triggerRef]);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate90 = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (croppedAreaPixels) {
      updateLivePreview(croppedAreaPixels, nextRot);
    }
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, 512);
      await onSave(croppedBlob);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Couldn't upload. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        {/* Backdrop with slight blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSaving && onClose()}
          className="fixed inset-0 bg-[#0A0A0A]/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container: Bottom sheet on mobile, Centered dialog on desktop */}
        <motion.div
          ref={modalRef}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: window.innerWidth < 640 ? '100%' : 20, scale: window.innerWidth < 640 ? 1 : 0.96 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: window.innerWidth < 640 ? '100%' : 20, scale: window.innerWidth < 640 ? 1 : 0.96 }
          }
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:max-w-[480px] bg-white rounded-t-3xl sm:rounded-2xl border border-[#E5E7EB] shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#E5E7EB] bg-white shrink-0">
            <div>
              <h2 id="crop-modal-title" className="text-base sm:text-lg font-bold text-[#0A0A0A] tracking-tight">
                Adjust your photo
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Drag to reposition. Use the slider to zoom.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close dialog"
              className="p-1.5 -mr-1 rounded-lg text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Inline Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="text-xs font-bold text-rose-800 hover:underline shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Cropper Box: 320px square with round mask & 55% dimmed background */}
            <div className="relative w-full h-[260px] sm:h-[320px] bg-[#0A0A0A] rounded-xl overflow-hidden shadow-inner select-none">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                minZoom={1}
                maxZoom={3}
                style={{
                  containerStyle: {
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0A0A0A',
                  },
                  cropAreaStyle: {
                    border: '2px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 0 9999em rgba(10, 10, 10, 0.55)',
                  },
                }}
              />
            </div>

            {/* Controls: Zoom slider + Rotate + Reset */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
                  aria-label="Zoom out"
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    ref={sliderRef}
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label="Zoom level"
                    aria-valuetext={`Zoom ${Math.round(zoom * 100)}%`}
                    className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
                  aria-label="Zoom in"
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRotate90}
                  aria-label="Rotate 90 degrees clockwise"
                  title="Rotate 90°"
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#0A0A0A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Live Preview Row (3 small circles: 80px Profile, 40px Header, 32px Lists) */}
            <div className="pt-2 border-t border-[#E5E7EB]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                Live Previews
              </p>
              <div className="flex items-center justify-around bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E7EB]">
                {/* 80px Profile */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-20 h-20 rounded-full border border-[#E5E7EB] overflow-hidden bg-[#E5E7EB]/50 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#E5E7EB] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#6B7280]">Profile (80px)</span>
                </div>

                {/* 40px Header */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border border-[#E5E7EB] overflow-hidden bg-[#E5E7EB]/50 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Header preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#E5E7EB] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#6B7280]">Header (40px)</span>
                </div>

                {/* 32px Lists */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full border border-[#E5E7EB] overflow-hidden bg-[#E5E7EB]/50 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="List preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#E5E7EB] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#6B7280]">Lists (32px)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-white flex items-center justify-end gap-3 shrink-0 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg transition-colors min-h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 rounded-lg transition-all shadow-sm min-h-[44px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save photo'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvatarCropModal;
