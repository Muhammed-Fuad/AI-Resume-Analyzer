"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─── Job Roles ─────────────────────────────────────────────────────────── */
const JOB_ROLES = [
  "Fresher / Entry Level",
  // Tech
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Mobile Developer (iOS)", "Mobile Developer (Android)",
  "React Native Developer", "Flutter Developer", "DevOps Engineer",
  "Site Reliability Engineer (SRE)", "Cloud Engineer", "Platform Engineer",
  "Data Scientist", "Data Analyst", "Data Engineer", "ML Engineer",
  "AI/LLM Engineer", "Computer Vision Engineer", "NLP Engineer",
  "Cybersecurity Analyst", "Penetration Tester", "Security Engineer",
  "Blockchain Developer", "Embedded Systems Engineer", "QA Engineer",
  "SDET", "Game Developer", "AR/VR Developer",
  "Solutions Architect", "Enterprise Architect", "IT Support Specialist",
  "Systems Administrator", "Network Engineer", "Database Administrator",
  "Salesforce Developer", "SAP Consultant", "ERP Consultant",
  // Design
  "UI/UX Designer", "Product Designer", "Graphic Designer",
  "Motion Designer", "Brand Designer", "Web Designer",
  "Design Systems Designer", "Interaction Designer",
  // Product & Management
  "Product Manager", "Technical Product Manager", "Program Manager",
  "Scrum Master", "Agile Coach", "Project Manager",
  "Engineering Manager", "CTO", "VP of Engineering",
  // Business & Operations
  "Business Analyst", "Operations Manager", "Strategy Consultant",
  "Management Consultant", "Business Development Manager",
  "Account Manager", "Customer Success Manager", "Sales Manager",
  "Sales Representative", "Pre-Sales Engineer",
  // Marketing & Content
  "Digital Marketing Manager", "SEO Specialist", "SEM / PPC Specialist",
  "Content Writer", "Copywriter", "Social Media Manager",
  "Growth Hacker", "Brand Manager", "Email Marketing Specialist",
  "Marketing Analyst", "Performance Marketer",
  // Finance & Legal
  "Financial Analyst", "Investment Banker", "Chartered Accountant",
  "Tax Consultant", "Auditor", "Risk Analyst",
  "Compliance Officer", "Legal Counsel", "Paralegal",
  // HR & Recruiting
  "HR Manager", "Talent Acquisition Specialist", "Recruiter",
  "HR Business Partner", "Compensation & Benefits Analyst",
  "Learning & Development Specialist",
  // Healthcare & Science
  "Clinical Data Manager", "Biomedical Engineer", "Pharmacist",
  "Research Scientist", "Lab Technician", "Healthcare Administrator",
  "Nurse Practitioner", "Medical Coder",
  // Other
  "Supply Chain Manager", "Logistics Coordinator", "Procurement Specialist",
  "Real Estate Analyst", "Civil Engineer", "Mechanical Engineer",
  "Electrical Engineer", "Chemical Engineer", "Environmental Engineer",
  "Teacher / Educator", "Academic Researcher", "Journalist",
];

const ANALYZE_STEPS = [
  { id: "resume",   label: "Analyzing resume"       },
  { id: "role",     label: "Analyzing job role"     },
  { id: "ats",      label: "Calculating ATS score"  },
  { id: "result",   label: "Fetching result"        },
];

const WEBHOOK_URL = "/api/analyze";

export default function ResumeAnalyzer() {
  const canvasRef   = useRef(null);
  const dropRef     = useRef(null);
  const router      = useRouter();

  const [file,        setFile]        = useState(null);
  const [role,        setRole]        = useState(JOB_ROLES[0]);
  const [jd,          setJd]          = useState("");
  const [dragging,    setDragging]    = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [stepIndex,   setStepIndex]   = useState(-1);
  const [doneSteps,   setDoneSteps]   = useState([]);
  const [error,       setError]       = useState("");

  /* ── Canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const page   = canvas.parentElement;
    let particles = [], mouse = { x: -999, y: -999 };
    let raf, t = 0, W, H;

    function resize() { W = canvas.width = page.offsetWidth; H = canvas.height = page.offsetHeight; }
    function makeParticles() {
      particles = [];
      const count = Math.floor((W * H) / 9000);
      for (let i = 0; i < count; i++) particles.push({
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
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      }
    }
    function draw() {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,W,H);
      drawOrbs();
      const maxDist=100;
      for (let i=0;i<particles.length;i++) {
        const p=particles[i];
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const dx=p.x-mouse.x, dy=p.y-mouse.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const bright=dist<100?p.a+(1-dist/100)*0.38:p.a;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${bright})`; ctx.fill();
        for(let j=i+1;j<particles.length;j++){
          const q=particles[j];
          const dx2=p.x-q.x,dy2=p.y-q.y,d2=Math.sqrt(dx2*dx2+dy2*dy2);
          if(d2<maxDist){
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`rgba(255,255,255,${0.065*(1-d2/maxDist)})`;
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
    return ()=>{ cancelAnimationFrame(raf); page.removeEventListener("mousemove",onMM); page.removeEventListener("touchmove",onTM); window.removeEventListener("resize",onR); };
  },[]);

  /* ── File helpers ── */
  const acceptFile = (f) => {
    if (!f) return;
    const ok = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type);
    if (!ok) { setError("Only PDF or DOC/DOCX files are accepted."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError(""); setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);

  /* ── Helpers ── */
  const toBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]); // strip data:… prefix
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const runSteps = async () => {
    // Longer durations so the animation feels thorough
    const durations = [3500, 3000, 3200, 2800];
    for (let i = 0; i < ANALYZE_STEPS.length; i++) {
      setStepIndex(i);
      await new Promise(r => setTimeout(r, durations[i]));
      setDoneSteps(prev => [...prev, ANALYZE_STEPS[i].id]);
    }
  };

  /* ── Analyze + Webhook ── */
  const handleAnalyze = async (e) => {
  e.preventDefault();
  if (!file) { setError("Please upload your resume."); return; }
  setError(""); setAnalyzing(true); setDoneSteps([]); setStepIndex(0);

  let payload; // ← MOVE declaration here, outside all try/catch blocks

  try {
    const fileBase64 = await toBase64(file);

    const webhookPromise = fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName:       file.name,
        fileType:       file.type,
        fileSize:       file.size,
        fileBase64,
        jobRole:        role,
        jobDescription: jd,
      }),
    });

    const [res] = await Promise.all([webhookPromise, runSteps()]);

    if (!res.ok) throw new Error(`Webhook responded with status ${res.status}`);

    const rawText = await res.text();

    try {
      const stripped = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      let parsed = JSON.parse(stripped);

      // unwrap array
      payload = Array.isArray(parsed) ? parsed[0] : parsed;

      // unwrap nested keys
      if (payload?.data && typeof payload.data === "object") payload = payload.data;
      if (payload?.output && typeof payload.output === "object") payload = payload.output;

    } catch (parseErr) {
      console.error("Could not parse n8n response:", rawText);
      throw new Error("Could not read the analysis result. Please try again.");
    }

    // Now payload is accessible here ✓
    payload.job_role  = role;
    payload.file_name = file.name;

    sessionStorage.setItem("atsResult", JSON.stringify(payload));
    router.push("/result");

  } catch (err) {
    console.error("Webhook error:", err);
    setError(err.message || "Something went wrong. Please try again.");
    setAnalyzing(false);
    setStepIndex(-1);
    setDoneSteps([]);
  }
};

  const handleReset = () => {
    setFile(null); setRole(JOB_ROLES[0]); setJd(""); setError("");
    setAnalyzing(false); setStepIndex(-1); setDoneSteps([]);
  };

  const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Outfit:wght@200;300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .page{
          min-height:100vh; min-height:100dvh;
          background:#0a0a0a;
          display:flex; flex-direction:column; align-items:center;
          justify-content:space-between;
          position:relative; overflow:hidden;
          font-family:'Outfit',sans-serif;
          padding:5rem 1.5rem 3rem;
        }
        .bg-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;}

        .corner-tl,.corner-br{
          position:absolute;z-index:5;
          border-color:rgba(255,255,255,0.1);border-style:solid;
          width:28px;height:28px;
        }
        .corner-tl{top:1.2rem;left:1.2rem;border-width:1px 0 0 1px;}
        .corner-br{bottom:1.2rem;right:1.2rem;border-width:0 1px 1px 0;}

        .brand-tag{
          position:absolute;top:1.5rem;left:50%;transform:translateX(-50%);
          z-index:10;font-size:0.62rem;font-weight:300;letter-spacing:0.22em;
          text-transform:uppercase;color:rgba(255,255,255,0.22);white-space:nowrap;
          animation:fadeUp 0.8s ease 0s both;
        }

        .form-wrap{
          position:relative;z-index:10;width:100%;max-width:400px;
          display:flex;flex-direction:column;align-items:center;
          flex:1;justify-content:center;
        }

        .eyebrow{
          font-size:0.6rem;font-weight:300;letter-spacing:0.28em;
          text-transform:uppercase;color:rgba(255,255,255,0.35);
          margin-bottom:1rem;animation:fadeUp 0.8s ease 0.1s both;text-align:center;
        }
        .headline{
          font-family:'Playfair Display',serif;
          font-size:clamp(1.9rem,9vw,2.8rem);font-weight:900;
          line-height:1;color:#fff;letter-spacing:-0.02em;
          margin-bottom:0.3rem;animation:fadeUp 0.8s ease 0.2s both;text-align:center;
        }
        .headline-italic{
          font-family:'Playfair Display',serif;
          font-size:clamp(1.9rem,9vw,2.8rem);font-weight:400;font-style:italic;
          line-height:1;color:transparent;-webkit-text-stroke:1.2px rgba(255,255,255,0.5);
          display:block;letter-spacing:-0.01em;margin-bottom:1.6rem;
          animation:fadeUp 0.8s ease 0.3s both;text-align:center;
        }

        .form-card{
          width:100%;background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          padding:1.6rem 1.4rem;animation:fadeUp 0.8s ease 0.4s both;
        }

        .field{margin-bottom:1rem;}
        .field-label{
          display:flex;align-items:center;gap:0.4rem;
          font-size:0.62rem;font-weight:400;letter-spacing:0.14em;
          text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:0.45rem;
        }
        .badge-opt{
          font-size:0.55rem;letter-spacing:0.1em;padding:1px 6px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:20px;color:rgba(255,255,255,0.3);text-transform:uppercase;
        }
        .badge-req{
          font-size:0.55rem;letter-spacing:0.1em;padding:1px 6px;
          background:rgba(226,75,74,0.1);border:1px solid rgba(226,75,74,0.25);
          border-radius:20px;color:rgba(226,130,130,0.8);text-transform:uppercase;
        }

        .drop-zone{
          width:100%;min-height:120px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.6rem;
          border:1.5px dashed rgba(255,255,255,0.15);border-radius:8px;
          background:rgba(255,255,255,0.03);
          cursor:pointer;transition:border-color 0.25s,background 0.25s;
          padding:1.4rem 1rem;text-align:center;position:relative;
          -webkit-tap-highlight-color:transparent;
        }
        .drop-zone.drag-over{
          border-color:rgba(255,255,255,0.45);background:rgba(255,255,255,0.06);
        }
        .drop-zone.has-file{
          border-style:solid;border-color:rgba(255,255,255,0.25);
          background:rgba(255,255,255,0.05);
        }
        .drop-zone input[type=file]{
          position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;
        }
        .drop-icon{color:rgba(255,255,255,0.25);}
        .drop-title{
          font-size:0.82rem;font-weight:400;color:rgba(255,255,255,0.55);
          letter-spacing:0.02em;
        }
        .drop-sub{
          font-size:0.68rem;font-weight:300;color:rgba(255,255,255,0.25);
          letter-spacing:0.04em;
        }
        .file-pill{
          display:flex;align-items:center;gap:0.6rem;width:100%;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          border-radius:6px;padding:0.55rem 0.75rem;
        }
        .file-pill-name{
          flex:1;font-size:0.78rem;font-weight:300;color:rgba(255,255,255,0.7);
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        .file-pill-size{font-size:0.68rem;color:rgba(255,255,255,0.3);white-space:nowrap;}
        .file-pill-remove{
          background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);
          display:flex;align-items:center;padding:2px;transition:color 0.2s;
          flex-shrink:0;
        }
        .file-pill-remove:hover{color:rgba(226,75,74,0.8);}

        .field-select{
          width:100%;padding:0.8rem 2.4rem 0.8rem 1rem;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
          border-radius:4px;font-family:'Outfit',sans-serif;
          font-size:0.88rem;font-weight:300;color:#fff;outline:none;
          -webkit-appearance:none;appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
          background-repeat:no-repeat;background-position:right 0.85rem center;
          transition:border-color 0.2s;cursor:pointer;
        }
        .field-select:focus{border-color:rgba(255,255,255,0.4);}
        .field-select option{background:#1a1a1a;color:#fff;}

        .field-textarea{
          width:100%;padding:0.8rem 1rem;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
          border-radius:4px;font-family:'Outfit',sans-serif;
          font-size:0.85rem;font-weight:300;color:#fff;outline:none;resize:vertical;
          min-height:100px;transition:border-color 0.2s;-webkit-appearance:none;
          line-height:1.6;
        }
        .field-textarea::placeholder{color:rgba(255,255,255,0.2);}
        .field-textarea:focus{border-color:rgba(255,255,255,0.4);}
        .char-count{
          text-align:right;font-size:0.6rem;color:rgba(255,255,255,0.2);
          margin-top:0.3rem;letter-spacing:0.06em;
        }

        .error-box{
          display:flex;align-items:center;gap:0.5rem;
          padding:0.65rem 0.9rem;
          background:rgba(226,75,74,0.12);border:1px solid rgba(226,75,74,0.3);
          border-radius:4px;font-size:0.78rem;font-weight:300;
          color:#f09595;margin-bottom:1rem;animation:fadeUp 0.3s ease both;
        }

        .btn-row{display:flex;gap:0.75rem;margin-top:0.4rem;}

        .submit-btn{
          position:relative;flex:1;padding:0.95rem;
          background:#fff;color:#0a0a0a;border:none;border-radius:4px;
          font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:500;
          letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;
          overflow:hidden;transition:color 0.4s ease;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
        }
        .submit-btn::before{
          content:'';position:absolute;inset:0;
          background:#1a1a1a;border:1px solid rgba(255,255,255,0.2);
          transform:scaleX(0);transform-origin:left;
          transition:transform 0.4s cubic-bezier(0.76,0,0.24,1);z-index:0;
        }
        .submit-btn:hover::before,.submit-btn:active::before{transform:scaleX(1);}
        .submit-btn:hover,.submit-btn:active{color:#fff;}
        .submit-btn:disabled{opacity:0.45;cursor:not-allowed;}

        .reset-btn{
          position:relative;padding:0.95rem 1.2rem;
          background:transparent;color:rgba(255,255,255,0.45);
          border:1px solid rgba(255,255,255,0.15);border-radius:4px;
          font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:400;
          letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;
          transition:background 0.2s,border-color 0.2s,color 0.2s;
          -webkit-tap-highlight-color:transparent;
        }
        .reset-btn:hover,.reset-btn:active{
          background:rgba(255,255,255,0.06);
          border-color:rgba(255,255,255,0.3);color:rgba(255,255,255,0.75);
        }

        .btn-inner{
          position:relative;z-index:1;
          display:flex;align-items:center;justify-content:center;gap:0.55rem;
        }
        .btn-arrow{transition:transform 0.3s ease;}
        .submit-btn:hover .btn-arrow{transform:translateX(4px);}

        .spinner{
          width:14px;height:14px;
          border:2px solid rgba(0,0,0,0.2);border-top-color:#0a0a0a;
          border-radius:50%;animation:spin 0.7s linear infinite;
        }
        .submit-btn:hover .spinner,.submit-btn:active .spinner{
          border-color:rgba(255,255,255,0.25);border-top-color:#fff;
        }
        @keyframes spin{to{transform:rotate(360deg);}}

        .overlay{
          position:fixed;inset:0;z-index:100;
          background:rgba(10,10,10,0.92);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:2rem;animation:fadeIn 0.4s ease both;
          backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
        }
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}

        .overlay-title{
          font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;
          color:#fff;margin-bottom:2.2rem;text-align:center;letter-spacing:-0.01em;
        }

        .steps-list{display:flex;flex-direction:column;gap:1rem;width:100%;max-width:300px;}

        .step-row{
          display:flex;align-items:center;gap:0.9rem;
          animation:fadeUp 0.4s ease both;
        }

        .step-icon{
          width:32px;height:32px;min-width:32px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:1px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.04);
          transition:all 0.35s ease;
          position:relative;
        }
        .step-icon.active{
          border-color:rgba(255,255,255,0.5);
          background:rgba(255,255,255,0.08);
        }
        .step-icon.done{
          border-color:rgba(74,226,122,0.6);
          background:rgba(74,226,122,0.1);
        }

        .step-dot{
          width:6px;height:6px;border-radius:50%;
          background:rgba(255,255,255,0.25);
        }
        .step-dot.active{
          background:rgba(255,255,255,0.8);
          box-shadow:0 0 8px rgba(255,255,255,0.5);
          animation:pulse 1s ease-in-out infinite;
        }
        @keyframes pulse{
          0%,100%{transform:scale(1);opacity:1;}
          50%{transform:scale(1.4);opacity:0.6;}
        }

        .step-label{
          font-size:0.82rem;font-weight:300;letter-spacing:0.06em;
          color:rgba(255,255,255,0.3);transition:color 0.3s ease;
        }
        .step-label.active{color:rgba(255,255,255,0.85);}
        .step-label.done{color:rgba(74,226,122,0.8);}

        .step-ring{
          width:14px;height:14px;
          border:2px solid rgba(255,255,255,0.15);
          border-top-color:rgba(255,255,255,0.7);
          border-radius:50%;animation:spin 0.8s linear infinite;
        }

        .check-svg{color:rgba(74,226,122,0.9);}

        .progress-track{
          width:100%;max-width:300px;height:2px;
          background:rgba(255,255,255,0.08);border-radius:1px;
          margin-bottom:2rem;overflow:hidden;
        }
        .progress-fill{
          height:100%;background:rgba(255,255,255,0.5);border-radius:1px;
          transition:width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        .bottom-strip{
          position:relative;z-index:10;
          display:flex;justify-content:center;align-items:center;
          gap:2rem;width:100%;
          animation:fadeUp 0.8s ease 0.7s both;padding-top:2rem;
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
      `}</style>

      <div className="page">
        <canvas className="bg-canvas" ref={canvasRef} />
        <div className="corner-tl" />
        <div className="corner-br" />
        <span className="brand-tag">ResumeAnalyzer · AI</span>

        <div className="form-wrap">
          <p className="eyebrow">AI-Powered</p>
          <h1 className="headline">Analyze</h1>
          <span className="headline-italic">your résumé</span>

          <div className="form-card">
            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleAnalyze}>

              {/* ── 1. Upload ── */}
              <div className="field">
                <label className="field-label">
                  Resume
                  <span className="badge-req">Required</span>
                </label>

                {file ? (
                  <div className="file-pill">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="file-pill-name">{file.name}</span>
                    <span className="file-pill-size">{fmtSize(file.size)}</span>
                    <button
                      type="button"
                      className="file-pill-remove"
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    ref={dropRef}
                    className={`drop-zone${dragging ? " drag-over" : ""}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => acceptFile(e.target.files[0])}
                    />
                    <svg className="drop-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="drop-title">
                      {dragging ? "Drop it here" : "Tap or drag to upload"}
                    </span>
                    <span className="drop-sub">PDF · DOC · DOCX &nbsp;·&nbsp; Max 5 MB</span>
                  </div>
                )}
              </div>

              {/* ── 2. Job Role ── */}
              <div className="field">
                <label className="field-label" htmlFor="role">
                  Job Role
                  <span className="badge-req">Required</span>
                </label>
                <select
                  id="role"
                  className="field-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* ── 3. Job Description ── */}
              <div className="field">
                <label className="field-label" htmlFor="jd">
                  Job Description
                  <span className="badge-opt">Optional</span>
                </label>
                <textarea
                  id="jd"
                  className="field-textarea"
                  placeholder="Paste the job description here to get a more accurate ATS match score…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value.slice(0, 2000))}
                  rows={4}
                />
                <div className="char-count">{jd.length} / 2000</div>
              </div>

              {/* ── Buttons ── */}
              <div className="btn-row">
                <button type="submit" className="submit-btn" disabled={analyzing}>
                  <span className="btn-inner">
                    {analyzing
                      ? <div className="spinner" />
                      : <> Get Score <span className="btn-arrow">→</span> </>
                    }
                  </span>
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={analyzing}
                >
                  Reset
                </button>
              </div>
            </form>
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

      {/* ── Analyzing overlay ── */}
      {analyzing && (
        <div className="overlay">
          <div className="overlay-title">Scanning your résumé…</div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(doneSteps.length / ANALYZE_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="steps-list">
            {ANALYZE_STEPS.map((step, i) => {
              const isDone   = doneSteps.includes(step.id);
              const isActive = stepIndex === i && !isDone;
              return (
                <div
                  className="step-row"
                  key={step.id}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className={`step-icon${isDone ? " done" : isActive ? " active" : ""}`}>
                    {isDone ? (
                      <svg className="check-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : isActive ? (
                      <div className="step-ring" />
                    ) : (
                      <div className="step-dot" />
                    )}
                  </div>
                  <span className={`step-label${isDone ? " done" : isActive ? " active" : ""}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}