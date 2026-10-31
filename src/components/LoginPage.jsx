import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const { login, error: sessionError } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await login(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = error || sessionError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D5F5F9] via-[#f8fafc] to-[#FCE9DF] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#44A6F1]/20">
            <i className="ph ph-waves text-3xl text-[#44A6F1]"></i>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#2D2D2D]">Filoxenia Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk untuk mengelola pre-order tropical.</p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D5F5F9] text-[#2B7DBA]">
              <i className="ph-fill ph-lock-key text-xl"></i>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#2D2D2D]">Login Admin</h2>
              <p className="mt-1 text-sm text-gray-500">
                Hanya admin yang dapat mengakses data pesanan.
              </p>
            </div>
          </div>

          {displayedError && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-[#D15B2D]/30 bg-[#FCE9DF] px-3 py-2.5 text-sm text-[#A8431F]">
              <i className="ph ph-warning-circle mt-0.5 text-base"></i>
              <span>{displayedError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Username Admin</label>
              <div className="relative">
                <i className="ph ph-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  required
                  autoFocus
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="Masukkan username"
                  className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <i className="ph ph-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-11 text-[#2D2D2D] outline-none transition-all placeholder:text-gray-400 focus:border-[#44A6F1] focus:bg-white focus:ring-1 focus:ring-[#44A6F1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <i className={`ph ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#D15B2D] py-2.5 font-medium text-white transition-all hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              <i
                className={`ph ${
                  isSubmitting ? 'ph-circle-notch animate-spin' : 'ph-sign-in'
                } text-lg`}
              ></i>
              {isSubmitting ? 'Memproses...' : 'Masuk sebagai Admin'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <i className="ph ph-database text-sm text-[#2B7DBA]"></i>
            Data pesanan tersimpan aman di database.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
