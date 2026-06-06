"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const canvasRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let particles = [], mouse = { x: -999, y: -999 };
    let raf, t = 0, W, H;

    function resize() {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
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

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.065 * (1 - d2 / maxDist)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const onMouseMove = (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onTouchMove = (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - r.left;
      mouse.y = e.touches[0].clientY - r.top;
    };
    const onResize = () => {
      cancelAnimationFrame(raf); resize(); makeParticles(); draw();
    };

    hero.addEventListener("mousemove", onMouseMove);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);
    resize(); makeParticles(); draw();

    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Outfit:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hero {
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

        .bg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 10;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          justify-content: center;
          width: 100%;
        }

        .eyebrow {
          font-size: 0.6rem;
          font-weight: 300;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 1.4rem;
          animation: fadeUp 1s ease 0.2s both;
        }

        .headline-wrap {
          animation: fadeUp 1s ease 0.4s both;
          margin-bottom: 1rem;
        }

        .headline-top, .headline-bot {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 10vw, 3.2rem);
          font-weight: 900;
          line-height: 1;
          color: #ffffff;
          display: block;
          letter-spacing: -0.02em;
        }

        .headline-mid {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 10vw, 3.2rem);
          font-weight: 400;
          font-style: italic;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.2px rgba(255,255,255,0.55);
          display: block;
          letter-spacing: -0.01em;
        }

        .score-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.9rem;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 100px;
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 2.5rem;
          background: rgba(255,255,255,0.04);
          animation: fadeUp 1s ease 0.6s both;
        }

        .score-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #fff;
          animation: pulse 2s ease infinite;
          flex-shrink: 0;
        }

        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.4;transform:scale(.7)}
        }

        .login-btn {
          position: relative;
          padding: 0.95rem 2.8rem;
          background: #ffffff;
          color: #0a0a0a;
          border: none;
          border-radius: 4px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          overflow: hidden;
          animation: fadeUp 1s ease 0.8s both;
          transition: color 0.4s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.2);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.76,0,0.24,1);
          z-index: 0;
        }

        .login-btn:hover::before,
        .login-btn:active::before { transform: scaleX(1); }
        .login-btn:hover, .login-btn:active { color: #ffffff; }

        .btn-text {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .btn-arrow { transition: transform 0.3s ease; }
        .login-btn:hover .btn-arrow { transform: translateX(4px); }

        .bottom-strip {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          width: 100%;
          animation: fadeUp 1s ease 1s both;
          padding-top: 2rem;
        }

        .stat-item { text-align: center; }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffffff;
          display: block;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.6rem;
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
          display: block;
          margin-top: 0.28rem;
        }

        .stat-sep {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.1);
        }

        .corner-tl, .corner-br {
          position: absolute;
          z-index: 5;
          border-color: rgba(255,255,255,0.1);
          border-style: solid;
          width: 28px; height: 28px;
        }
        .corner-tl { top: 1.2rem; left: 1.2rem; border-width: 1px 0 0 1px; }
        .corner-br { bottom: 1.2rem; right: 1.2rem; border-width: 0 1px 1px 0; }

        .brand-tag {
          position: absolute;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          font-size: 0.62rem;
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          white-space: nowrap;
          animation: fadeUp 1s ease 0s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="hero">
        <canvas className="bg-canvas" ref={canvasRef} />
        <div className="corner-tl" />
        <div className="corner-br" />
        <span className="brand-tag">ResumeAnalyzer · AI</span>

        <div className="content">
          <p className="eyebrow">AI-powered career intelligence</p>

          <div className="headline-wrap">
            <span className="headline-top">Check Your</span>
            <span className="headline-mid">ATS Score</span>
            <span className="headline-bot">Instantly</span>
          </div>

          <div className="score-badge">
            <span className="score-dot" />
            Real-time · 30 sec · Free
          </div>

          <button
            className="login-btn"
            onClick={() => router.push("/login")}
          >
            <span className="btn-text">
              Get Started <span className="btn-arrow">→</span>
            </span>
          </button>
        </div>

        <div className="bottom-strip">
          <div className="stat-item">
            <span className="stat-num">94%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item">
            <span className="stat-num">2×</span>
            <span className="stat-label">More callbacks</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-item">
            <span className="stat-num">50k+</span>
            <span className="stat-label">Resumes</span>
          </div>
        </div>
      </div>
    </>
  );
}