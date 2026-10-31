const EmptyState = ({ icon = 'ph-inbox', title, description, action }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
      <i className={`ph ${icon} text-3xl`}></i>
    </span>
    <h3 className="mt-4 text-base font-semibold text-[#2D2D2D]">{title}</h3>
    {description && (
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{description}</p>
    )}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
