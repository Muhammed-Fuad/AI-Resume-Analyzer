"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../FirebaseConfig";

const auth = getAuth(app);

/* ─────────────────────────────────────────────────────────────────────────
   STATUS MAP  –  keyed by ats_score.rating (case-insensitive)
───────────────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  excellent: {
    label: "Excellent",
    color: "#4ae27a",
    bg: "rgba(74,226,122,0.08)",
    border: "rgba(74,226,122,0.25)",
    desc: "Your résumé is highly optimised for ATS.",
  },
  good: {
    label: "Good",
    color: "#e2c94a",
    bg: "rgba(226,201,74,0.08)",
    border: "rgba(226,201,74,0.25)",
    desc: "A few tweaks will significantly boost your score.",
  },
  average: {
    label: "Average",
    color: "#e2914a",
    bg: "rgba(226,145,74,0.08)",
    border: "rgba(226,145,74,0.25)",
    desc: "Several key areas need attention to pass ATS filters.",
  },
  poor: {
    label: "Needs Work",
    color: "#e24b4a",
    bg: "rgba(226,75,74,0.08)",
    border: "rgba(226,75,74,0.25)",
    desc: "Your résumé requires significant improvements.",
  },
};

function resolveStatus(rating, score) {
  if (rating) {
    const key = rating.toLowerCase().trim();
    if (STATUS_MAP[key]) return key;
    if (key.includes("excel")) return "excellent";
    if (key.includes("good"))  return "good";
    if (key.includes("avg") || key.includes("average")) return "average";
    if (key.includes("poor") || key.includes("needs")) return "poor";
  }
  // fallback to score
  if (score >= 85) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "average";
  return "poor";
}

/* ─────────────────────────────────────────────────────────────────────────
   FALLBACK shown while data loads / if fetch fails
───────────────────────────────────────────────────────────────────────── */
const EMPTY_RESULT = {
  score: 0,
  rating: "average",
  strengths: [],
  missingKeywords: [],
  improvements: [],
  resumeIssues: "",
  keywordMissing: [],
  verdict: "",
  role: "",
  filename: "",
};

export default function ResultPage() {
  const canvasRef = useRef(null);
  const router    = useRouter();

  const [result,       setResult]       = useState(EMPTY_RESULT);
  const [loading,      setLoading]      = useState(true);
  const [displayScore, setDisplayScore] = useState(0);
  const [revealed,     setRevealed]     = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);

  /* ── Load result from sessionStorage (set by ResumeAnalyzer after webhook) ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("atsResult");
      if (raw) {
        const json = JSON.parse(raw);
        /*
          Expected shape from n8n "Respond to Webhook" node:
          {
            ats_score: { overall_score: 73, rating: "Good" },
            strengths: ["...", "..."],
            missing_keywords: ["TypeScript", ...],        ← or [{keyword:"TypeScript"}, ...]
            improvement_recommendations: ["...", "..."],
            resume_issues: "..." or ["...", "..."],
            keyword_coverage: { missing_keywords: [...] },
            final_verdict: { summary: "..." },
            job_role: "Frontend Developer",   ← optional, passed from frontend
            file_name: "resume.pdf",          ← optional, passed from frontend
          }
        */
        const score    = json?.ats_score?.overall_score ?? 0;
        const rating   = json?.ats_score?.rating ?? "";

        // missing_keywords can be string[] OR {keyword:string}[]
        const normKw = (arr) =>
          (arr || []).map((k) => (typeof k === "string" ? k : k?.keyword ?? k?.name ?? String(k)));

        // resume_issues can be string or string[]
        const normIssues = (val) => {
          if (!val) return "";
          if (Array.isArray(val)) return val.join(" · ");
          return String(val);
        };

        setResult({
          score,
          rating,
          strengths:       json?.strengths               ?? [],
          missingKeywords: normKw(json?.missing_keywords),
          improvements:    json?.improvement_recommendations ?? [],
          resumeIssues:    normIssues(json?.resume_issues),
          keywordMissing:  normKw(json?.keyword_coverage?.missing_keywords),
          verdict:         json?.final_verdict?.summary  ?? "",
          role:            json?.job_role                ?? "",
          filename:        json?.file_name               ?? "",
        });
      }
    } catch (e) {
      console.error("Failed to parse atsResult from sessionStorage", e);
    }
    setLoading(false);
  }, []);

  /* ── Animate score counter once data is ready ── */
  useEffect(() => {
    if (loading || result.score === 0) return;
    const duration = 1600;
    const start    = performance.now();
    const tick     = (now) => {
      const p    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(ease * result.score));
      if (p < 1) requestAnimationFrame(tick);
      else setRevealed(true);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 400);
    return () => clearTimeout(id);
  }, [loading, result.score]);

  /* ── Canvas background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const page   = canvas.parentElement;
    let particles = [], mouse = { x: -999, y: -999 };
    let raf, t = 0, W, H;

    function resize() { W = canvas.width = page.offsetWidth; H = canvas.height = page.offsetHeight; }
    function makeParticles() {
      particles = [];
      const n = Math.floor((W * H) / 9000);
      for (let i = 0; i < n; i++) particles.push({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.1+0.3,
        vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.25,
        a: Math.random()*0.45+0.12,
      });
    }
    function drawOrbs() {
      t += 0.005;
      const orbs = [
        { x: W*0.15+Math.sin(t*0.7)*50, y: H*0.2+Math.cos(t*0.5)*35, r:220, a:0.05 },
        { x: W*0.85+Math.cos(t*0.6)*40, y: H*0.78+Math.sin(t*0.8)*30, r:180, a:0.04 },
        { x: W*0.5+Math.sin(t*0.4)*25,  y: H*0.5+Math.cos(t*0.6)*18,  r:150, a:0.022 },
      ];
      for (const o of orbs) {
        const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
        g.addColorStop(0,`rgba(255,255,255,${o.a})`);
        g.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      }
    }
    function draw() {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,W,H);
      drawOrbs();
      for (let i=0;i<particles.length;i++) {
        const p=particles[i];
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const dx=p.x-mouse.x, dy=p.y-mouse.y, dist=Math.sqrt(dx*dx+dy*dy);
        const bright=dist<100?p.a+(1-dist/100)*0.38:p.a;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${bright})`; ctx.fill();
        for(let j=i+1;j<particles.length;j++){
          const q=particles[j], dx2=p.x-q.x, dy2=p.y-q.y, d2=Math.sqrt(dx2*dx2+dy2*dy2);
          if(d2<100){
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`rgba(255,255,255,${0.065*(1-d2/100)})`;
            ctx.lineWidth=0.4; ctx.stroke();
          }
        }
      }
      raf=requestAnimationFrame(draw);
    }
    const onMM=(e)=>{ const r=page.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; };
    const onTM=(e)=>{ const r=page.getBoundingClientRect(); mouse.x=e.touches[0].clientX-r.left; mouse.y=e.touches[0].clientY-r.top; };
    const onR=()=>{ cancelAnimationFrame(raf); resize(); makeParticles(); draw(); };
    page.addEventListener("mousemove",onMM);
    page.addEventListener("touchmove",onTM,{passive:true});
    window.addEventListener("resize",onR);
    resize(); makeParticles(); draw();
    return()=>{ cancelAnimationFrame(raf); page.removeEventListener("mousemove",onMM); page.removeEventListener("touchmove",onTM); window.removeEventListener("resize",onR); };
  },[]);

  /* ── LOGOUT ── */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      sessionStorage.clear();
      router.push("/");
    } catch (err) {
      console.error("Sign-out error:", err);
      setLoggingOut(false);
    }
  };

  /* ── Derived ── */
  const status     = resolveStatus(result.rating, result.score);
  const statusInfo = STATUS_MAP[status];

  /* ── SVG arc ── */
  const R     = 54;
  const CX    = 64;
  const CY    = 64;
  const CIRC  = 2 * Math.PI * R;
  const pct   = displayScore / 100;
  const dash  = pct * CIRC;
  const gap   = CIRC - dash;

  // merge both missing keyword sources, deduplicate
  const allMissingKw = [...new Set([...result.missingKeywords, ...result.keywordMissing])];

  // Canvas always renders — no early return — so canvasRef.current is never null


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Outfit:wght@200;300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .page{
          min-height:100vh;min-height:100dvh;
          background:#0a0a0a;
          display:flex;flex-direction:column;align-items:center;
          position:relative;overflow-x:hidden;overflow-y:auto;
          font-family:'Outfit',sans-serif;
          padding:5rem 1.5rem 4rem;
          gap:0;
        }
        .bg-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;}
        .corner-tl,.corner-br{
          position:fixed;z-index:5;
          border-color:rgba(255,255,255,0.1);border-style:solid;width:28px;height:28px;
        }
        .corner-tl{top:1.2rem;left:1.2rem;border-width:1px 0 0 1px;}
        .corner-br{bottom:1.2rem;right:1.2rem;border-width:0 1px 1px 0;}
        .brand-tag{
          position:fixed;top:1.5rem;left:50%;transform:translateX(-50%);
          z-index:10;font-size:0.62rem;font-weight:300;letter-spacing:0.22em;
          text-transform:uppercase;color:rgba(255,255,255,0.22);white-space:nowrap;
        }

        .content{
          position:relative;z-index:10;width:100%;max-width:400px;
          display:flex;flex-direction:column;gap:1rem;
        }

        .page-header{
          display:flex;flex-direction:column;align-items:center;
          padding-bottom:0.5rem;
          animation:fadeUp 0.7s ease 0.1s both;
        }
        .eyebrow{
          font-size:0.6rem;font-weight:300;letter-spacing:0.28em;
          text-transform:uppercase;color:rgba(255,255,255,0.35);
          margin-bottom:0.7rem;text-align:center;
        }
        .headline{
          font-family:'Playfair Display',serif;
          font-size:clamp(1.7rem,8vw,2.4rem);font-weight:900;
          line-height:1;color:#fff;letter-spacing:-0.02em;text-align:center;
          margin-bottom:0.28rem;
        }
        .headline-italic{
          font-family:'Playfair Display',serif;
          font-size:clamp(1.7rem,8vw,2.4rem);font-weight:400;font-style:italic;
          line-height:1;color:transparent;-webkit-text-stroke:1.1px rgba(255,255,255,0.45);
          display:block;letter-spacing:-0.01em;text-align:center;
        }

        .card{
          width:100%;background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          padding:1.5rem 1.4rem;
          animation:fadeUp 0.7s ease both;
        }
        .card-title{
          font-size:0.6rem;font-weight:400;letter-spacing:0.2em;
          text-transform:uppercase;color:rgba(255,255,255,0.3);
          margin-bottom:1.2rem;display:flex;align-items:center;gap:0.55rem;
        }
        .card-title-line{flex:1;height:1px;background:rgba(255,255,255,0.08);}

        /* Score */
        .score-wrap{display:flex;align-items:center;gap:1.4rem;}
        .arc-wrap{position:relative;width:128px;height:128px;flex-shrink:0;}
        .arc-svg{transform:rotate(-90deg);}
        .arc-track{fill:none;stroke:rgba(255,255,255,0.07);stroke-width:7;}
        .arc-fill{fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dasharray 0.05s linear;}
        .arc-score{
          position:absolute;inset:0;display:flex;flex-direction:column;
          align-items:center;justify-content:center;
        }
        .arc-num{
          font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;
          color:#fff;line-height:1;
        }
        .arc-denom{
          font-size:0.62rem;font-weight:300;letter-spacing:0.12em;
          color:rgba(255,255,255,0.3);margin-top:2px;
        }
        .score-meta{flex:1;display:flex;flex-direction:column;gap:0.65rem;}
        .score-role{
          font-size:0.72rem;font-weight:300;color:rgba(255,255,255,0.45);
          letter-spacing:0.04em;line-height:1.4;
        }
        .score-role strong{color:rgba(255,255,255,0.75);font-weight:400;}
        .score-file{
          display:flex;align-items:center;gap:0.4rem;
          font-size:0.68rem;font-weight:300;color:rgba(255,255,255,0.3);overflow:hidden;
        }
        .score-file span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .status-badge{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.45rem 0.9rem;border-radius:50px;
          font-size:0.72rem;font-weight:500;letter-spacing:0.08em;
          text-transform:uppercase;align-self:flex-start;
        }
        .status-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .status-desc{
          font-size:0.76rem;font-weight:300;line-height:1.55;
          color:rgba(255,255,255,0.45);margin-top:0.75rem;letter-spacing:0.02em;
        }

        /* arc fill colours */
        .arc-fill-excellent{stroke:#4ae27a;}
        .arc-fill-good     {stroke:#e2c94a;}
        .arc-fill-average  {stroke:#e2914a;}
        .arc-fill-poor     {stroke:#e24b4a;}

        /* Strengths */
        .strength-list{display:flex;flex-direction:column;gap:0.65rem;}
        .strength-item{
          display:flex;align-items:flex-start;gap:0.7rem;
          animation:fadeUp 0.5s ease both;
        }
        .strength-icon{
          min-width:20px;height:20px;border-radius:50%;
          background:rgba(74,226,122,0.1);border:1px solid rgba(74,226,122,0.3);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;
        }
        .strength-text{
          font-size:0.8rem;font-weight:300;color:rgba(255,255,255,0.6);
          line-height:1.6;letter-spacing:0.02em;
        }

        /* Improvements */
        .improvement-list{display:flex;flex-direction:column;gap:0.75rem;}
        .improvement-item{
          display:flex;align-items:flex-start;gap:0.75rem;
          animation:fadeUp 0.5s ease both;
        }
        .imp-num{
          min-width:22px;height:22px;border-radius:50%;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          font-size:0.6rem;font-weight:500;color:rgba(255,255,255,0.4);
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;margin-top:1px;letter-spacing:0;
        }
        .imp-text{
          font-size:0.8rem;font-weight:300;color:rgba(255,255,255,0.6);
          line-height:1.6;letter-spacing:0.02em;
        }

        /* Issues */
        .issues-text{
          font-size:0.8rem;font-weight:300;color:rgba(255,255,255,0.55);
          line-height:1.7;letter-spacing:0.02em;
        }

        /* Verdict */
        .verdict-text{
          font-size:0.85rem;font-weight:300;color:rgba(255,255,255,0.6);
          line-height:1.75;letter-spacing:0.02em;font-style:italic;
        }

        /* Keywords */
        .keyword-cloud{display:flex;flex-wrap:wrap;gap:0.5rem;}
        .keyword-pill{
          padding:0.35rem 0.75rem;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
          border-radius:20px;font-size:0.72rem;font-weight:300;
          color:rgba(255,255,255,0.55);letter-spacing:0.04em;
          animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          transition:background 0.2s,border-color 0.2s,color 0.2s;
        }
        .keyword-pill:hover{
          background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.3);
          color:rgba(255,255,255,0.85);
        }
        @keyframes popIn{
          from{opacity:0;transform:scale(0.75);}
          to{opacity:1;transform:scale(1);}
        }

        /* Action buttons */
        .action-row{
          display:flex;gap:0.75rem;
          animation:fadeUp 0.7s ease 0.8s both;
        }
        .btn-primary{
          position:relative;flex:1;padding:0.95rem;
          background:#fff;color:#0a0a0a;border:none;border-radius:4px;
          font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:500;
          letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;
          overflow:hidden;transition:color 0.4s ease;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
        }
        .btn-primary::before{
          content:'';position:absolute;inset:0;
          background:#1a1a1a;border:1px solid rgba(255,255,255,0.2);
          transform:scaleX(0);transform-origin:left;
          transition:transform 0.4s cubic-bezier(0.76,0,0.24,1);z-index:0;
        }
        .btn-primary:hover::before,.btn-primary:active::before{transform:scaleX(1);}
        .btn-primary:hover,.btn-primary:active{color:#fff;}
        .btn-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:0.5rem;}
        .btn-arrow{transition:transform 0.3s ease;}
        .btn-primary:hover .btn-arrow{transform:translateX(4px);}
        .btn-ghost{
          padding:0.95rem 1.1rem;
          background:transparent;color:rgba(255,255,255,0.45);
          border:1px solid rgba(255,255,255,0.15);border-radius:4px;
          font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:400;
          letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;
          transition:background 0.2s,border-color 0.2s,color 0.2s;
          -webkit-tap-highlight-color:transparent;
        }
        .btn-ghost:hover,.btn-ghost:active{
          background:rgba(255,255,255,0.06);
          border-color:rgba(255,255,255,0.3);color:rgba(255,255,255,0.75);
        }
        .btn-ghost:disabled{opacity:0.5;cursor:not-allowed;}

        /* Bottom strip */
        .bottom-strip{
          position:relative;z-index:10;
          display:flex;justify-content:center;align-items:center;
          gap:2rem;width:100%;padding-top:2rem;
          animation:fadeUp 0.8s ease 1s both;
        }
        .stat-item{text-align:center;}
        .stat-num{
          font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;
          color:#fff;display:block;line-height:1;
        }
        .stat-label{
          font-size:0.6rem;font-weight:300;letter-spacing:0.12em;
          text-transform:uppercase;color:rgba(255,255,255,0.28);
          display:block;margin-top:0.28rem;
        }
        .stat-sep{width:1px;height:32px;background:rgba(255,255,255,0.1);}

        @keyframes fadeUp{
          from{opacity:0;transform:translateY(18px);}
          to{opacity:1;transform:translateY(0);}
        }

        /* empty state */
        .empty-note{
          font-size:0.75rem;font-weight:300;color:rgba(255,255,255,0.2);
          text-align:center;padding:1rem 0;letter-spacing:0.04em;font-style:italic;
        }
      `}</style>

      <div className="page">
        <canvas className="bg-canvas" ref={canvasRef} />
        <div className="corner-tl" />
        <div className="corner-br" />
        <span className="brand-tag">ResumeAnalyzer · AI</span>

        {/* ── Loading overlay (canvas still mounted so ref is never null) ── */}
        {loading && (
          <div style={{
            position:"fixed", inset:0, zIndex:50,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(10,10,10,0.85)", backdropFilter:"blur(6px)",
          }}>
            <span style={{
              color:"rgba(255,255,255,0.4)", fontFamily:"'Outfit',sans-serif",
              fontSize:"0.82rem", letterSpacing:"0.14em", textTransform:"uppercase",
            }}>
              Loading results…
            </span>
          </div>
        )}

        <div className="content">

          {/* ── Header ── */}
          <div className="page-header">
            <p className="eyebrow">Analysis complete</p>
            <h1 className="headline">Your results</h1>
            <span className="headline-italic">are ready</span>
          </div>

          {/* ── 1. ATS Score ── */}
          <div className="card" style={{ animationDelay: "0.2s" }}>
            <div className="card-title">
              ATS Score <div className="card-title-line" />
            </div>
            <div className="score-wrap">
              <div className="arc-wrap">
                <svg className="arc-svg" width="128" height="128" viewBox="0 0 128 128">
                  <circle className="arc-track" cx={CX} cy={CY} r={R} />
                  <circle
                    className={`arc-fill arc-fill-${status}`}
                    cx={CX} cy={CY} r={R}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="arc-score">
                  <span className="arc-num" style={{ color: statusInfo.color }}>{displayScore}</span>
                  <span className="arc-denom">/ 100</span>
                </div>
              </div>

              <div className="score-meta">
                {result.role && (
                  <div className="score-role">Role: <strong>{result.role}</strong></div>
                )}
                {result.filename && (
                  <div className="score-file">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{result.filename}</span>
                  </div>
                )}
                <div
                  className="status-badge"
                  style={{
                    color: statusInfo.color,
                    background: statusInfo.bg,
                    border: `1px solid ${statusInfo.border}`,
                  }}
                >
                  <span
                    className="status-dot"
                    style={{ background: statusInfo.color, boxShadow: `0 0 6px ${statusInfo.color}` }}
                  />
                  {statusInfo.label}
                </div>
              </div>
            </div>
            <p className="status-desc">{statusInfo.desc}</p>
          </div>

          {/* ── 2. Final Verdict ── */}
          {result.verdict ? (
            <div className="card" style={{ animationDelay: "0.28s" }}>
              <div className="card-title">Final Verdict <div className="card-title-line" /></div>
              <p className="verdict-text">"{result.verdict}"</p>
            </div>
          ) : null}

          {/* ── 3. Strengths ── */}
          {result.strengths.length > 0 && (
            <div className="card" style={{ animationDelay: "0.35s" }}>
              <div className="card-title">Strengths <div className="card-title-line" /></div>
              <div className="strength-list">
                {result.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="strength-item"
                    style={{ animationDelay: `${0.35 + i * 0.06}s` }}
                  >
                    <span className="strength-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ae27a" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <p className="strength-text">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Recommended Improvements ── */}
          {result.improvements.length > 0 && (
            <div className="card" style={{ animationDelay: "0.45s" }}>
              <div className="card-title">Recommended Improvements <div className="card-title-line" /></div>
              <div className="improvement-list">
                {result.improvements.map((tip, i) => (
                  <div
                    key={i}
                    className="improvement-item"
                    style={{ animationDelay: `${0.45 + i * 0.07}s` }}
                  >
                    <span className="imp-num">{String(i + 1).padStart(2, "0")}</span>
                    <p className="imp-text">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Resume Issues ── */}
          {result.resumeIssues && (
            <div className="card" style={{ animationDelay: "0.52s" }}>
              <div className="card-title">Resume Issues <div className="card-title-line" /></div>
              <p className="issues-text">{result.resumeIssues}</p>
            </div>
          )}

          {/* ── 6. Missing Keywords ── */}
          {allMissingKw.length > 0 && (
            <div className="card" style={{ animationDelay: "0.6s" }}>
              <div className="card-title">Missing Keywords <div className="card-title-line" /></div>
              <p style={{
                fontSize:"0.74rem", fontWeight:300,
                color:"rgba(255,255,255,0.35)", marginBottom:"1rem",
                lineHeight:1.55, letterSpacing:"0.02em",
              }}>
                Add these terms to your résumé to improve ATS keyword matching:
              </p>
              <div className="keyword-cloud">
                {allMissingKw.map((kw, i) => (
                  <span
                    key={kw}
                    className="keyword-pill"
                    style={{ animationDelay: `${0.6 + i * 0.04}s` }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="action-row">
            <button className="btn-primary" onClick={() => router.push("/resume-Analyzer")}>
              <span className="btn-inner">
                Re-analyze <span className="btn-arrow">→</span>
              </span>
            </button>
            <button
              className="btn-ghost"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Signing out…" : "Log Out"}
            </button>
          </div>

        </div>

        {/* ── Bottom strip ── */}
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