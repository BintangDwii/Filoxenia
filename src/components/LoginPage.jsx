import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo';

/* ─── Styles: faithfully ported from filoxenia-login.html ─── */
const LOGIN_CSS = `
  .lp-root {
    margin: 0;
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 28px;
    color: #1A3E5C;
    background: #F4FAFC;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .lp-shell {
    position: relative;
    width: min(1460px, 100%);
    min-height: min(860px, calc(100vh - 56px));
    display: grid;
    grid-template-columns: 1.04fr .96fr;
    overflow: hidden;
    border-radius: 30px;
    background: #fff;
    box-shadow: 0 28px 80px rgba(26,62,92,.12);
  }

  /* LEFT — illustration */
  .lp-visual {
    position: relative;
    min-height: 760px;
    display: grid;
    place-items: center;
    overflow: hidden;
    isolation: isolate;
    background: #D2F3F8;
  }
  .lp-visual::after {
    content: "";
    position: absolute;
    z-index: -1;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.10), transparent 48%, rgba(26,62,92,.035));
  }
  .lp-visual-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: -2;
  }
    inset: 0;
    z-index: -2;
    width: 100%;
    height: 100%;
  }
  .lp-brand-content {
    width: 100%;
    max-width: 650px;
    padding: 40px 28px;
    margin-top: -85px;
    text-align: center;
  }
  .lp-brand-title {
    margin: 0;
    color: #1A3E5C;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(54px, 5.6vw, 88px);
    font-weight: 700;
    letter-spacing: -4.5px;
    line-height: 1;
    white-space: nowrap;
  }
  .lp-flower-mark {
    display: inline-block;
    margin-left: 5px;
    color: #E86A33;
    font-family: sans-serif;
    font-size: .36em;
    vertical-align: top;
    transform: translateY(5px) rotate(12deg);
  }
  .lp-brand-x-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: min(390px, 80%);
    margin: 12px auto 0;
  }
  .lp-brand-x-row::before, .lp-brand-x-row::after {
    content: "";
    height: 1.5px;
    flex: 1;
    background: #1A3E5C;
    opacity: .56;
  }
  .lp-brand-x {
    color: #E86A33;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(43px, 4.1vw, 65px);
    font-weight: 700;
    line-height: 1;
  }
  .lp-brand-moana {
    margin: 2px 0 0;
    color: #1A3E5C;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(55px, 5.2vw, 82px);
    font-weight: 700;
    letter-spacing: -3.5px;
    line-height: 1;
  }
  .lp-wave-o {
    display: inline-block;
    position: relative;
    color: #1A3E5C;
    font-size: .92em;
    text-shadow: 1px 1px 0 #5CBAD0;
  }

  /* RIGHT — form */
  .lp-form-panel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 76px clamp(42px, 6vw, 100px);
    background: #fff;
  }
  .lp-corner-flower {
    position: absolute;
    top: 42px;
    right: 44px;
    color: #E86A33;
    font-size: 42px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .lp-form-content { width: 100%; max-width: 540px; }
  .lp-form-heading {
    margin: 0 0 13px;
    color: #1A3E5C;
    font-size: clamp(34px, 3.2vw, 48px);
    font-weight: 760;
    letter-spacing: -1.9px;
    line-height: 1.12;
  }
  .lp-form-desc {
    margin: 0 0 42px;
    color: #6F8BA3;
    font-size: 16px;
    line-height: 1.65;
  }
  .lp-field-group { margin-bottom: 18px; }
  .lp-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 62px;
    border: 1.5px solid #D8E7EF;
    border-radius: 17px;
    background: #fff;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .lp-input-wrap:focus-within {
    border-color: #1A3E5C;
    box-shadow: 0 0 0 4px rgba(26,62,92,.07);
  }
  .lp-field-icon {
    flex: 0 0 auto;
    width: 21px;
    height: 21px;
    margin-left: 22px;
    color: #6F8BA3;
  }
  .lp-input-wrap input {
    width: 100%;
    min-width: 0;
    height: 60px;
    padding: 0 18px;
    border: 0;
    outline: 0;
    background: transparent;
    color: #1A3E5C;
    font-size: 16px;
    font-family: inherit;
  }
  .lp-input-wrap input::placeholder { color: #8AA2B8; opacity: 1; }
  .lp-pw-toggle {
    display: grid;
    place-items: center;
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    margin-right: 7px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #6F8BA3;
    cursor: pointer;
    font: inherit;
    transition: background .15s;
  }
  .lp-pw-toggle:hover { background: #F4FAFC; }
  .lp-pw-toggle svg { width: 20px; height: 20px; }

  .lp-form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin: 23px 0 28px;
    font-size: 14px;
  }
  .lp-remember {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #1A3E5C;
    cursor: pointer;
    user-select: none;
  }
  .lp-remember input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #1A3E5C;
    cursor: pointer;
  }
  .lp-link { color: #E86A33; text-decoration: none; transition: opacity .2s ease; }
  .lp-link:hover { opacity: .76; }

  .lp-submit-btn {
    width: 100%;
    min-height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border: 0;
    border-radius: 17px;
    background: #1A3E5C;
    color: #fff;
    font-size: 17px;
    font-weight: 650;
    font-family: inherit;
    cursor: pointer;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .lp-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #244F70;
    box-shadow: 0 9px 22px rgba(26,62,92,.16);
  }
  .lp-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .lp-submit-btn svg { width: 20px; height: 20px; }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 17px;
    margin: 34px 0 22px;
    color: #6F8BA3;
    font-size: 14px;
    white-space: nowrap;
  }
  .lp-divider::before, .lp-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #D8E7EF;
  }
  .lp-social-row { display: flex; justify-content: center; gap: 16px; }
  .lp-social-btn {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border: 1.5px solid #D8E7EF;
    border-radius: 50%;
    background: #F4FAFC;
    color: #1A3E5C;
    cursor: pointer;
    font: inherit;
    transition: border-color .2s ease, transform .2s ease, background .2s ease;
  }
  .lp-social-btn:hover {
    transform: translateY(-2px);
    border-color: #1A3E5C;
    background: #fff;
  }
  .lp-social-btn svg { width: 22px; height: 22px; }

  .lp-signup-copy {
    margin: 28px 0 0;
    color: #6F8BA3;
    text-align: center;
    font-size: 15px;
  }
  .lp-signup-copy .lp-link { margin-left: 5px; font-weight: 650; }

  .lp-error-msg {
    margin: 16px 0 0;
    padding: 12px 14px;
    border: 1px solid rgba(232,106,51,.25);
    border-radius: 12px;
    background: #FEF5F1;
    color: #C0420F;
    font-size: 13px;
    line-height: 1.5;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  /* spin for loading */
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spin { animation: lp-spin 0.8s linear infinite; display: inline-block; }

  /* Responsive */
  @media (max-width: 1080px) {
    .lp-root { padding: 20px; }
    .lp-shell { min-height: 720px; }
    .lp-visual { min-height: 720px; }
    .lp-form-panel { padding-inline: 42px; }
    .lp-brand-title { letter-spacing: -3px; }
  }
  @media (max-width: 760px) {
    .lp-root { display: block; padding: 14px; }
    .lp-shell {
      width: 100%;
      min-height: auto;
      grid-template-columns: 1fr;
      border-radius: 24px;
    }
    .lp-visual { min-height: 390px; }
    .lp-brand-content { margin-top: -35px; padding-inline: 15px; }
    .lp-brand-title { font-size: clamp(50px, 12vw, 72px); letter-spacing: -3px; }
    .lp-brand-x-row { width: min(320px, 76%); margin-top: 8px; }
    .lp-brand-x { font-size: 48px; }
    .lp-brand-moana { font-size: clamp(50px, 11vw, 68px); }
    .lp-form-panel { padding: 64px 26px 42px; }
    .lp-corner-flower { top: 19px; right: 25px; font-size: 31px; }
    .lp-form-heading { font-size: 33px; }
    .lp-form-desc { margin-bottom: 29px; font-size: 14px; }
    .lp-input-wrap { min-height: 58px; }
    .lp-input-wrap input { height: 56px; font-size: 15px; }
    .lp-form-options { font-size: 13px; }
  }
  @media (max-width: 380px) {
    .lp-form-panel { padding-inline: 19px; }
    .lp-form-options { gap: 8px; }
    .lp-brand-title { font-size: 48px; }
    .lp-brand-moana { font-size: 48px; }
    .lp-brand-x { font-size: 42px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
  }
`;

/* ─── Tropical SVG scene (all SVG attrs in camelCase) ─── */
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
    <div className="lp-root">
      {/* Scoped CSS injected into <head> */}
      <style>{LOGIN_CSS}</style>

      <main className="lp-shell">

        {/* ── LEFT: Illustration ── */}
        <section className="lp-visual" aria-label="Filoxenia login background">
          <img src="/login%20page%20image.png" className="lp-visual-image" alt="Filoxenia login background" />
          <div className="lp-brand-content" style={{ display: 'none' }}>
            <Logo width={40} height={40} />
            <h1 className="lp-brand-title">
              Filoxenia<span className="lp-flower-mark" aria-hidden="true">✿</span>
            </h1>
            <div className="lp-brand-x-row" aria-label="times">
              <span className="lp-brand-x">X</span>
            </div>
            <p className="lp-brand-moana">
              M<span className="lp-wave-o">◎</span>ana
            </p>
          </div>
        </section>

        {/* ── RIGHT: Form ── */}
        <section className="lp-form-panel" aria-labelledby="lp-login-title">
          <span className="lp-corner-flower" aria-hidden="true">✿</span>

          <div className="lp-form-content">
            <h2 className="lp-form-heading" id="lp-login-title">Welcome Back!</h2>
            <p className="lp-form-desc">
              Masuk untuk mengelola pesanan &amp; inventori Filoxenia.
            </p>

            {/* Error */}
            {displayedError && (
              <div className="lp-error-msg" role="alert">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                  <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Zm-1-7h2v2h-2v-2Zm0-8h2v6h-2V7Z" />
                </svg>
                <span>{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: displayedError ? 22 : 0 }}>

              {/* Username */}
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

              {/* Password */}
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

              {/* Options row */}
              <div className="lp-form-options">
                <label className="lp-remember" htmlFor="lp-remember">
                  <input id="lp-remember" type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot-password" className="lp-link">
                  Lupa password?
                </a>
              </div>

              {/* Submit */}
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

              {/* Divider */}
              <div className="lp-divider"><span>or continue with</span></div>

              {/* Social */}
              <div className="lp-social-row" aria-label="Other sign in options">
                {/* Google */}
                <button type="button" className="lp-social-btn" aria-label="Continue with Google" title="Continue with Google">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.23c1.89-1.74 2.99-4.3 2.99-7.35Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.23-2.47c-.9.6-2.04.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.55A10 10 0 0 0 12 22Z" />
                    <path fill="#FBBC05" d="M6.39 13.94a6 6 0 0 1 0-3.88V7.51H3.05a10 10 0 0 0 0 8.98l3.34-2.55Z" />
                    <path fill="#EA4335" d="M12 5.93c1.47 0 2.79.51 3.83 1.52l2.87-2.87C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.95 5.51l3.34 2.55C7.18 7.69 9.39 5.93 12 5.93Z" />
                  </svg>
                </button>
                {/* GitHub */}
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
  );
};

export default LoginPage;