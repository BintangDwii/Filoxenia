import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo';

/* ─── Styles: bg image at natural ratio + glassmorphism card on the RIGHT ─── */
const LOGIN_CSS = `
  /* ── Outer page: viewport wrapper, bg color for the sides ── */
  .lp-page {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 24px;
    box-sizing: border-box;
    background: #D2F3F8;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Stage: container dengan aspect-ratio gambar, tidak terlalu besar ── */
  .lp-root {
    position: relative;
    /* width = min(1400px, 100% of page, height-limited by viewport) */
    width: min(1400px, 100%, calc((100svh - 48px) * 16 / 9));
    aspect-ratio: 16 / 9;                 /* ⬅️ sesuaikan dengan rasio gambar Anda */
    background: #D2F3F8 url('/Login-page-new.png') no-repeat center center / contain;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 30px 90px rgba(26,62,92,.22);
  }

  /* tint overlay — di dalam stage, ikut rounded corners */
  .lp-root::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(120% 90% at 50% 50%, rgba(26,62,92,0) 40%, rgba(26,62,92,.14) 100%),
      linear-gradient(135deg, rgba(26,62,92,.04), rgba(26,62,92,.10));
  }

  /* ── Glass card: absolute di kanan, di dalam stage ── */
  .lp-shell {
    position: absolute;
    top: 50%;
    right: clamp(20px, 4.5%, 80px);
    transform: translateY(-50%);
    z-index: 1;
    width: min(480px, calc(100% - 40px));
    max-height: calc(100% - 32px);
    overflow-y: auto;
    padding: clamp(28px, 3.4vw, 44px) clamp(24px, 3.4vw, 40px);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.52);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow:
      0 24px 60px rgba(26,62,92,.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    scrollbar-width: thin;
  }

  .lp-corner-flower {
    position: absolute;
    top: 18px;
    right: 22px;
    color: #E86A33;
    font-size: 30px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    filter: drop-shadow(0 2px 3px rgba(232,106,51,.25));
  }

  .lp-form-panel { position: relative; width: 100%; }
  .lp-form-content { width: 100%; }

  .lp-form-heading {
    margin: 0 0 8px;
    color: #1A3E5C;
    font-size: clamp(28px, 2.4vw, 38px);
    font-weight: 760;
    letter-spacing: -1.4px;
    line-height: 1.12;
  }
  .lp-form-desc {
    margin: 0 0 24px;
    color: #4A6784;
    font-size: 14.5px;
    line-height: 1.6;
  }

  .lp-field-group { margin-bottom: 14px; }
  .lp-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 56px;
    border: 1.5px solid rgba(216,231,239,.85);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.65);
    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
  }
  .lp-input-wrap:focus-within {
    border-color: #1A3E5C;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 4px rgba(26,62,92,.09);
  }
  .lp-field-icon {
    flex: 0 0 auto;
    width: 19px;
    height: 19px;
    margin-left: 18px;
    color: #6F8BA3;
  }
  .lp-input-wrap input {
    width: 100%;
    min-width: 0;
    height: 54px;
    padding: 0 14px;
    border: 0;
    outline: 0;
    background: transparent;
    color: #1A3E5C;
    font-size: 15px;
    font-family: inherit;
  }
  .lp-input-wrap input::placeholder { color: #8AA2B8; opacity: 1; }
  .lp-pw-toggle {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    margin-right: 6px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #6F8BA3;
    cursor: pointer;
    font: inherit;
    transition: background .15s;
  }
  .lp-pw-toggle:hover { background: rgba(244,250,252,.8); }
  .lp-pw-toggle svg { width: 18px; height: 18px; }

  .lp-form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 16px 0 20px;
    font-size: 13px;
  }
  .lp-remember {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1A3E5C;
    cursor: pointer;
    user-select: none;
  }
  .lp-remember input[type="checkbox"] {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #1A3E5C;
    cursor: pointer;
  }
  .lp-link { color: #E86A33; text-decoration: none; transition: opacity .2s ease; font-weight: 600; }
  .lp-link:hover { opacity: .76; }

  .lp-submit-btn {
    width: 100%;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: 0;
    border-radius: 15px;
    background: #1A3E5C;
    color: #fff;
    font-size: 15px;
    font-weight: 650;
    font-family: inherit;
    cursor: pointer;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
    box-shadow: 0 12px 24px rgba(26,62,92,.24);
  }
  .lp-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #244F70;
    box-shadow: 0 15px 28px rgba(26,62,92,.3);
  }
  .lp-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .lp-submit-btn svg { width: 18px; height: 18px; }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 22px 0 16px;
    color: #4A6784;
    font-size: 12.5px;
    white-space: nowrap;
  }
  .lp-divider::before, .lp-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(26,62,92,.18);
  }
  .lp-social-row { display: flex; justify-content: center; gap: 14px; }
  .lp-social-btn {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 1.5px solid rgba(26,62,92,.16);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.55);
    color: #1A3E5C;
    cursor: pointer;
    font: inherit;
    transition: border-color .2s ease, transform .2s ease, background .2s ease;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .lp-social-btn:hover {
    transform: translateY(-2px);
    border-color: #1A3E5C;
    background: rgba(255, 255, 255, 0.85);
  }
  .lp-social-btn svg { width: 19px; height: 19px; }

  .lp-signup-copy {
    margin: 20px 0 0;
    color: #4A6784;
    text-align: center;
    font-size: 13px;
  }
  .lp-signup-copy .lp-link { margin-left: 5px; font-weight: 650; }

  .lp-error-msg {
    margin: 12px 0 0;
    padding: 10px 12px;
    border: 1px solid rgba(232,106,51,.35);
    border-radius: 12px;
    background: rgba(254,245,241,.85);
    color: #C0420F;
    font-size: 12.5px;
    line-height: 1.5;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spin { animation: lp-spin 0.8s linear infinite; display: inline-block; }

  /* ── Tablet: card di tengah stage ── */
  @media (max-width: 1024px) {
    .lp-shell {
      right: 50%;
      transform: translate(50%, -50%);
      width: min(440px, calc(100% - 32px));
    }
  }

  /* ── Mobile: image jadi cover full screen, card di tengah ── */
  @media (max-width: 760px) {
    .lp-page { padding: 0; display: block; }
    .lp-root {
      width: 100%;
      max-width: none;
      min-height: 100svh;
      aspect-ratio: auto;
      border-radius: 0;
      box-shadow: none;
      background-size: cover;
      background-position: center center;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .lp-shell {
      position: relative;
      top: auto;
      right: auto;
      transform: none;
      width: 100%;
      max-width: 480px;
      max-height: none;
      overflow-y: visible;
      padding: 32px 22px 26px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.6);
    }
    .lp-corner-flower { top: 12px; right: 16px; font-size: 24px; }
    .lp-form-heading { font-size: 28px; }
    .lp-form-desc { margin-bottom: 20px; font-size: 13px; }
    .lp-input-wrap { min-height: 54px; }
    .lp-input-wrap input { height: 52px; font-size: 14.5px; }
    .lp-form-options { font-size: 12.5px; }
  }
  @media (max-width: 380px) {
    .lp-shell { padding-inline: 18px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
  }
`;

const LoginPage = () => {
  const { login, error: sessionError } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="lp-page">
      <style>{LOGIN_CSS}</style>

      <div className="lp-root">
        <main className="lp-shell">
          <span className="lp-corner-flower" aria-hidden="true">✿</span>

          <section className="lp-form-panel" aria-labelledby="lp-login-title">
            <div className="lp-form-content">
              <h2 className="lp-form-heading" id="lp-login-title">Welcome Back!</h2>
              <p className="lp-form-desc">
                Masuk untuk mengelola pesanan &amp; inventori Filoxenia.
              </p>

              {displayedError && (
                <div className="lp-error-msg" role="alert">
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Zm-1-7h2v2h-2v-2Zm0-8h2v6h-2V7Z" />
                  </svg>
                  <span>{displayedError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ marginTop: displayedError ? 18 : 0 }}>
                <div className="lp-field-group">
                  <label className="lp-input-wrap" htmlFor="lp-username">
                    <svg className="lp-field-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.7 0-8.5 2.4-8.5 5.4V22h17v-2.6c0-3-3.8-5.4-8.5-5.4Z" />
                    </svg>
                    <input
                      id="lp-username"
                      name="username"
                      type="text"
                      placeholder="Username admin"
                      autoComplete="username"
                      required
                      autoFocus
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="lp-field-group">
                  <div className="lp-input-wrap">
                    <svg className="lp-field-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM10 6a2 2 0 1 1 4 0v2h-4V6Zm2 11.7a2 2 0 1 1 1-3.7 2 2 0 0 1-1 3.7Z" />
                    </svg>
                    <input
                      id="lp-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="lp-pw-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      aria-pressed={showPassword}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {showPassword ? (
                          <>
                            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                            <path d="m3 3 18 18" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="lp-form-options">
                  <label className="lp-remember" htmlFor="lp-remember">
                    <input id="lp-remember" type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot-password" className="lp-link">
                    Lupa password?
                  </a>
                </div>

                <button type="submit" className="lp-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <svg className="lp-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Memproses...' : 'Login'}</span>
                </button>

                <div className="lp-divider"><span>or continue with</span></div>

                <div className="lp-social-row" aria-label="Other sign in options">
                  <button type="button" className="lp-social-btn" aria-label="Continue with Google" title="Continue with Google">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.23c1.89-1.74 2.99-4.3 2.99-7.35Z" />
                      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.23-2.47c-.9.6-2.04.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.55A10 10 0 0 0 12 22Z" />
                      <path fill="#FBBC05" d="M6.39 13.94a6 6 0 0 1 0-3.88V7.51H3.05a10 10 0 0 0 0 8.98l3.34-2.55Z" />
                      <path fill="#EA4335" d="M12 5.93c1.47 0 2.79.51 3.83 1.52l2.87-2.87C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.95 5.51l3.34 2.55C7.18 7.69 9.39 5.93 12 5.93Z" />
                    </svg>
                  </button>
                  <button type="button" className="lp-social-btn" aria-label="Continue with GitHub" title="Continue with GitHub">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08V22c0 .29.2.63.76.53A11.1 11.1 0 0 0 12 .9Z" />
                    </svg>
                  </button>
                </div>

                <p className="lp-signup-copy">
                  Hanya admin yang dapat mengakses sistem.
                </p>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
