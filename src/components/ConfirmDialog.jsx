import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onCancel();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel, isSubmitting]);

  if (!open) return null;

  const handleCancel = () => {
    if (!isSubmitting) onCancel();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE9DF] text-[#D15B2D]">
            <i className="ph-fill ph-warning text-xl"></i>
          </span>
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[#2D2D2D]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded bg-[#D15B2D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting && <i className="ph ph-circle-notch animate-spin"></i>}
            {isSubmitting ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
