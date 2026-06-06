"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../FirebaseConfig";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const canvasRef = useRef(null);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const page = canvas.parentElement;
    let particles = [], mouse = { x: -999, y: -999 };
    let raf, t = 0, W, H;

    function resize() {
      W = canvas.width = page.offsetWidth;
      H = canvas.height = page.offsetHeight;
    }
    function makeParticles() {
      particles = [];
      const count = Math.floor((W * H) / 9000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.1 + 0.3,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          a: Math.random() * 0.45 + 0.12,
        });
      }
    }
    function drawOrbs() {
      t += 0.005;
      const orbs = [
        { x: W * 0.15 + Math.sin(t * 0.7) * 50, y: H * 0.2 + Math.cos(t * 0.5) * 35, r: 220, a: 0.05 },
        { x: W * 0.85 + Math.cos(t * 0.6) * 40, y: H * 0.78 + Math.sin(t * 0.8) * 30, r: 180, a: 0.04 },
        { x: W * 0.5 + Math.sin(t * 0.4) * 25, y: H * 0.5 + Math.cos(t * 0.6) * 18, r: 150, a: 0.022 },
      ];
      for (const o of orbs) {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(255,255,255,${o.a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);
      drawOrbs();
      const maxDist = 100;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bright = dist < 100 ? p.a + (1 - dist / 100) * 0.38 : p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${bright})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < maxDist) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.065 * (1 - d2 / maxDist)})`;
            ctx.lineWidth = 0.4; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    const onMouseMove = (e) => { const r = page.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onTouchMove = (e) => { const r = page.getBoundingClientRect(); mouse.x = e.touches[0].clientX - r.left; mouse.y = e.touches[0].clientY - r.top; };
    const onResize = () => { cancelAnimationFrame(raf); resize(); makeParticles(); draw(); };
    page.addEventListener("mousemove", onMouseMove);
    page.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);
    resize(); makeParticles(); draw();
    return () => {
      cancelAnimationFrame(raf);
      page.removeEventListener("mousemove", onMouseMove);
      page.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const getFriendlyError = (code) => {
    switch (code) {
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/wrong-password": return "Incorrect password. Please try again.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/invalid-credential": return "Incorrect email or password.";
      case "auth/too-many-requests": return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user": return "Sign-in popup was closed.";
      default: return "Something went wrong. Please try again.";
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/resume-Analyzer");
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/resume-Analyzer");
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Outfit:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          min-height: 100dvh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
          padding: 5rem 1.5rem 3rem;
        }

        .bg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }

        .corner-tl, .corner-br {
          position: absolute; z-index: 5;
          border-color: rgba(255,255,255,0.1); border-style: solid;
          width: 28px; height: 28px;
        }
        .corner-tl { top: 1.2rem; left: 1.2rem; border-width: 1px 0 0 1px; }
        .corner-br { bottom: 1.2rem; right: 1.2rem; border-width: 0 1px 1px 0; }

        .brand-tag {
          position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%);
          z-index: 10; font-size: 0.62rem; font-weight: 300; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.22); white-space: nowrap;
          animation: fadeUp 0.8s ease 0s both;
        }

        .form-wrap {
          position: relative; z-index: 10; width: 100%; max-width: 360px;
          display: flex; flex-direction: column; align-items: center;
          flex: 1; justify-content: center;
        }

        .eyebrow {
          font-size: 0.6rem; font-weight: 300; letter-spacing: 0.28em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 1rem; animation: fadeUp 0.8s ease 0.1s both; text-align: center;
        }

        .headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.9rem, 9vw, 2.8rem); font-weight: 900;
          line-height: 1; color: #ffffff; letter-spacing: -0.02em;
          margin-bottom: 0.3rem; animation: fadeUp 0.8s ease 0.2s both; text-align: center;
        }

        .headline-italic {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.9rem, 9vw, 2.8rem); font-weight: 400; font-style: italic;
          line-height: 1; color: transparent; -webkit-text-stroke: 1.2px rgba(255,255,255,0.5);
          display: block; letter-spacing: -0.01em; margin-bottom: 1.6rem;
          animation: fadeUp 0.8s ease 0.3s both; text-align: center;
        }

        .form-card {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 1.6rem 1.4rem; animation: fadeUp 0.8s ease 0.4s both;
        }

        .google-btn {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 0.65rem; padding: 0.8rem;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 4px; font-family: 'Outfit', sans-serif;
          font-size: 0.8rem; font-weight: 400; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.75); cursor: pointer;
          transition: background 0.2s, border-color 0.2s; margin-bottom: 1.3rem;
          -webkit-tap-highlight-color: transparent;
        }
        .google-btn:hover, .google-btn:active {
          background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25);
        }
        .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.3rem; }
        .div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .div-text {
          font-size: 0.62rem; font-weight: 300; letter-spacing: 0.16em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
        }

        .field { margin-bottom: 1rem; }
        .field-label {
          display: block; font-size: 0.62rem; font-weight: 400; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 0.45rem;
        }
        .field-wrap { position: relative; }
        .field-input {
          width: 100%; padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 4px; font-family: 'Outfit', sans-serif;
          font-size: 0.88rem; font-weight: 300; color: #ffffff; outline: none;
          transition: border-color 0.2s; -webkit-appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus { border-color: rgba(255,255,255,0.4); }
        .field-input.has-eye { padding-right: 2.8rem; }

        .eye-btn {
          position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3);
          display: flex; align-items: center; padding: 4px; transition: color 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.6); }

        .forgot-row { display: flex; justify-content: flex-end; margin-top: -0.5rem; margin-bottom: 1.4rem; }
        .forgot-link {
          font-size: 0.72rem; font-weight: 300; color: rgba(255,255,255,0.35);
          text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s;
        }
        .forgot-link:hover { color: rgba(255,255,255,0.65); }

        .error-box {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 0.9rem;
          background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.3);
          border-radius: 4px; font-size: 0.78rem; font-weight: 300;
          color: #f09595; margin-bottom: 1rem; animation: fadeUp 0.3s ease both;
        }

        .submit-btn {
          position: relative; width: 100%; padding: 0.95rem;
          background: #ffffff; color: #0a0a0a; border: none; border-radius: 4px;
          font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          overflow: hidden; transition: color 0.4s ease;
          -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        }
        .submit-btn::before {
          content: ''; position: absolute; inset: 0;
          background: #1a1a1a; border: 1px solid rgba(255,255,255,0.2);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1); z-index: 0;
        }
        .submit-btn:hover::before, .submit-btn:active::before { transform: scaleX(1); }
        .submit-btn:hover, .submit-btn:active { color: #ffffff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
        }
        .btn-arrow { transition: transform 0.3s ease; }
        .submit-btn:hover .btn-arrow { transform: translateX(4px); }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2); border-top-color: #0a0a0a;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        .submit-btn:hover .spinner, .submit-btn:active .spinner {
          border-color: rgba(255,255,255,0.25); border-top-color: #fff;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .signup-row {
          text-align: center; margin-top: 1.1rem;
          font-size: 0.75rem; font-weight: 300;
          color: rgba(255,255,255,0.28); letter-spacing: 0.02em;
        }
        .signup-link {
          color: rgba(255,255,255,0.55); text-decoration: none;
          margin-left: 4px; transition: color 0.2s;
        }
        .signup-link:hover { color: #fff; }

        .bottom-strip {
          position: relative; z-index: 10;
          display: flex; justify-content: center; align-items: center;
          gap: 2rem; width: 100%;
          animation: fadeUp 0.8s ease 0.7s both; padding-top: 2rem;
        }
        .stat-item { text-align: center; }
        .stat-num {
          font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700;
          color: #ffffff; display: block; line-height: 1;
        }
        .stat-label {
          font-size: 0.6rem; font-weight: 300; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.28);
          display: block; margin-top: 0.28rem;
        }
        .stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page">
        <canvas className="bg-canvas" ref={canvasRef} />
        <div className="corner-tl" />
        <div className="corner-br" />
        <span className="brand-tag">ResumeAnalyzer · AI</span>

        <div className="form-wrap">
          <p className="eyebrow">Welcome back</p>
          <h1 className="headline">Sign In</h1>
          <span className="headline-italic">to your account</span>

          <div className="form-card">
            <button
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <div className="spinner" style={{ borderTopColor: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }} />
              ) : (
                <svg width="17" height="17" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>

            <div className="divider">
              <div className="div-line" />
              <span className="div-text">or</span>
              <div className="div-line" />
            </div>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin}>
              <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <div className="field-wrap">
                  <input
                    className="field-input" id="email" type="email"
                    placeholder="you@example.com" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="field-wrap">
                  <input
                    className="field-input has-eye" id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••" autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} required
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="forgot-row">
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="submit-btn" disabled={loading || googleLoading}>
                <span className="btn-inner">
                  {loading ? <div className="spinner" /> : <>Sign in <span className="btn-arrow">→</span></>}
                </span>
              </button>
            </form>

            <div className="signup-row">
              No account?<a href="/signup" className="signup-link">Create one →</a>
            </div>
          </div>
        </div>

        <div className="bottom-strip">
          <div className="stat-item"><span className="stat-num">94%</span><span className="stat-label">Accuracy</span></div>
          <div className="stat-sep" />
          <div className="stat-item"><span className="stat-num">2×</span><span className="stat-label">More callbacks</span></div>
          <div className="stat-sep" />
          <div className="stat-item"><span className="stat-num">50k+</span><span className="stat-label">Resumes</span></div>
        </div>
      </div>
    </>
  );
}