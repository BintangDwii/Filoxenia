const PageGuide = ({ icon = 'ph-compass', title, description, steps = [] }) => (
  <section className="rounded-xl border border-[#44A6F1]/30 bg-[#F3FAFE] p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2B7DBA] shadow-sm">
        <i className={`ph-fill ${icon} text-xl`}></i>
      </span>
      <div>
        <h2 className="text-base font-semibold text-[#2D2D2D]">{title}</h2>
        {description && (
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>

    {steps.length > 0 && (
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-lg border border-white bg-white/80 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D5F5F9] text-xs font-bold text-[#2B7DBA]">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-[#2D2D2D]">{step.title}</p>
            </div>
            {step.description && (
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                {step.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
);

export default PageGuide;
