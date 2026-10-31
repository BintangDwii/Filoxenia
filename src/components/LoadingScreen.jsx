const LoadingScreen = ({ message = 'Memuat data...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D5F5F9]">
        <i className="ph ph-waves text-3xl text-[#44A6F1]"></i>
        <i className="ph ph-circle-notch absolute -bottom-1 -right-1 animate-spin rounded-full bg-white text-lg text-[#D15B2D]"></i>
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  </div>
);

export default LoadingScreen;
