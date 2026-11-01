const TOAST_STYLES = {
  success: {
    border: 'border-[#44A6F1]',
    icon: 'ph-check-circle',
    iconClassName: 'text-[#44A6F1]',
  },
  error: {
    border: 'border-[#D15B2D]',
    icon: 'ph-x-circle',
    iconClassName: 'text-[#D15B2D]',
  },
  info: {
    border: 'border-[#2B7DBA]',
    icon: 'ph-info',
    iconClassName: 'text-[#2B7DBA]',
  },
};

const Toast = ({ toast }) => {
  if (!toast) return null;

  const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.success;

  return (
    <div
      role="status"
      className={`fixed top-5 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded border bg-white px-6 py-3 text-[#2D2D2D] shadow-md transition-all ${style.border}`}
    >
      <i className={`ph-fill ${style.icon} text-xl ${style.iconClassName}`}></i>
      {toast.message}
    </div>
  );
};

export default Toast;
