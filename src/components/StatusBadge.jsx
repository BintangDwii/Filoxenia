const STATUS_STYLES = {
  Pending: 'bg-[#C4A283]/10 text-[#A6805E] border-[#C4A283]/50 hover:bg-[#C4A283]/20',
  Proses: 'bg-[#44A6F1]/10 text-[#2B7DBA] border-[#44A6F1]/50 hover:bg-[#44A6F1]/20',
  Selesai: 'bg-[#2D2D2D]/5 text-[#2D2D2D] border-[#2D2D2D]/30 hover:bg-[#2D2D2D]/10',
};

const StatusBadge = ({ status, onClick, isUpdating = false }) => (
  <button
    onClick={onClick}
    disabled={isUpdating}
    aria-busy={isUpdating}
    title="Klik untuk mengubah status"
    className={`inline-flex items-center gap-1 text-xs px-4 py-1.5 rounded-full font-medium transition-all duration-200 border disabled:cursor-wait disabled:opacity-60 ${
      STATUS_STYLES[status] ?? ''
    }`}
  >
    {isUpdating && <i className="ph ph-circle-notch animate-spin"></i>}
    {status}
  </button>
);

export default StatusBadge;
