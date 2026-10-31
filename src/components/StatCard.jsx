const StatCard = ({ icon, label, value, hint, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-[#D5F5F9] text-[#2B7DBA]',
    orange: 'bg-[#FCE9DF] text-[#D15B2D]',
    green: 'bg-[#E8F7EC] text-[#2F8A4B]',
    purple: 'bg-[#F1ECFA] text-[#7C4DC4]',
    sand: 'bg-[#F5EFE8] text-[#A6805E]',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-bold text-[#2D2D2D]">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            tones[tone] ?? tones.blue
          }`}
        >
          <i className={`${icon} text-xl`}></i>
        </span>
      </div>
    </div>
  );
};

export default StatCard;
