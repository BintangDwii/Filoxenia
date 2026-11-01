import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SIZE_CLASSES = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

const Modal = ({
  open,
  title,
  description,
  size = 'md',
  onClose,
  children,
  footer,
  isBusy = false,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, isBusy]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (!isBusy) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8"
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        className={`w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} rounded-xl bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[#2D2D2D]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleBackdrop}
            disabled={isBusy}
            aria-label="Tutup"
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
