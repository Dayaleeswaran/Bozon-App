import { useState, useEffect, useRef, useCallback } from "react";

import { databases, DB_ID, Query, ID } from "./appwrite";

// ─── Appwrite Database Helpers ───────────────────────────────────────────────
const db = {
  get: async (table, queries = []) => {
    try {
      const response = await databases.listDocuments(DB_ID, table, queries);
      return response.documents;
    } catch (err) {
      console.error(`[db.get] ${table} → Error:`, err);
      return [];
    }
  },
  post: async (table, body) => {
    try {
      await databases.createDocument(DB_ID, table, ID.unique(), body);
      return true;
    } catch (err) {
      console.error(`[db.post] ${table} → Error:`, err);
      return false;
    }
  },
};

const getEmbedUrl = (url, autoplay = true) => {
  if (!url) return "";
  let embed = url;
  if (url.includes("youtube.com/watch?v=")) {
    embed = `https://www.youtube.com/embed/${url.split("v=")[1].split("&")[0]}`;
  } else if (url.includes("youtu.be/")) {
    embed = `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
  } else if (url.includes("vimeo.com/")) {
    embed = `https://player.vimeo.com/video/${url.split("vimeo.com/")[1].split("?")[0]}`;
  }
  if (autoplay && (embed.includes("youtube.com") || embed.includes("vimeo.com"))) {
    const sep = embed.includes("?") ? "&" : "?";
    if (embed.includes("youtube.com")) embed += `${sep}autoplay=1&mute=0&rel=0&modestbranding=1`;
    else embed += `${sep}autoplay=1&muted=0`;
  }
  return embed;
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#E84B2B";
const BRAND_DARK = "#C23A1F";
const BG = "#0A0A0A";
const SURFACE = "#111111";
const SURFACE2 = "#1A1A1A";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.45)";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 20, radius = 6, style: x = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: `linear-gradient(90deg, ${SURFACE2} 25%, #2a2a2a 50%, ${SURFACE2} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...x
    }} />
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "", style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style
    }}>{children}</div>
  );
}

// ─── SPLIT TEXT REVEAL ────────────────────────────────────────────────────────
function SplitText({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div ref={ref} style={{ overflow: "hidden", ...style }}>
      <div style={{
        transform: visible ? "translateY(0)" : "translateY(110%)",
        transition: `transform 0.85s cubic-bezier(0.2, 1, 0.3, 1) ${delay}s`,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── MAGNETIC MINI ────────────────────────────────────────────────────────────
function Magnetic({ children, strength = 15 }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * (strength / (width / 2));
    const y = (clientY - (top + height / 2)) * (strength / (height / 2));
    setPos({ x, y });
  };

  const onLeave = () => setPos({ x: 0, y: 0 });

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        display: "inline-block"
      }}>
      {children}
    </div>
  );
}

const Logo = ({ size = 24 }) => (
  <div style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: size, fontWeight: 900, color: TEXT, display: "flex", alignItems: "center", gap: size * 0.4,
    letterSpacing: "-1px", userSelect: "none"
  }}>
    <div style={{
      width: size * 1.1, height: size * 1.1, background: BRAND, borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <span style={{ color: "#fff", fontSize: size * 0.75, fontWeight: 900, transform: "rotate(-5deg)", marginLeft: 1 }}>B</span>
    </div>
    <span>BOZON</span>
  </div>
);

// ─── TILT CARD ───────────────────────────────────────────────────────────────
function TiltCard({ children, style = {}, className = "" }) {
  const ref = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const onMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    // Calculate rotation (-10 to 10 degrees)
    const rx = (y - 0.5) * -20;
    const ry = (x - 0.5) * 20;

    setRotate({ x: rx, y: ry });
    setGlow({ x: x * 100, y: y * 100, opacity: 1 });
  };

  const onLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlow(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}
      style={{
        position: "relative",
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.1s ease-out",
        transformStyle: "preserve-3d",
        ...style
      }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(232,75,43,0.15), transparent 80%)`,
        opacity: glow.opacity, transition: "opacity 0.3s ease",
        borderRadius: "inherit"
      }} />
      <div style={{ transform: "translateZ(20px)", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

// ─── ANIMATED DIVIDER ────────────────────────────────────────────────────────
function AnimatedDivider({ style = {} }) {
  const [ref, visible] = useInView(0.5);
  return (
    <div ref={ref} style={{
      width: "100%", height: "1px", background: BORDER, position: "relative", overflow: "hidden",
      margin: "0 auto", maxWidth: 1280, ...style
    }}>
      <div style={{
        position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)`,
        transform: visible ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 1.2s cubic-bezier(0.65, 0, 0.35, 1)",
      }} />
    </div>
  );
}

function ParticleBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const count = 100; // Fixed higher count

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1, // Larger particles
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3 // More opaque
      });
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse Parallax
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = Math.max(0, (250 - dist) / 250); // Larger interaction area

        const renderX = p.x - dx * force * 0.1;
        const renderY = p.y - dy * force * 0.1;

        // Draw
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 75, 43, ${p.opacity + force * 0.4})`; // Brighter on hover
        ctx.fill();

        // Lines
        particles.forEach(p2 => {
          const ldx = p.x - p2.x;
          const ldy = p.y - p2.y;
          const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
          if (ldist < 120) {
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(232, 75, 43, ${(1 - ldist / 120) * 0.15})`; // Slightly more visible lines
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.8, pointerEvents: "none" }} />;
}

const GrainOverlay = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.04, mixBlendMode: "overlay", backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`, filter: "contrast(150%) brightness(1000%)" }} />
);

function TransitionPanels({ active }) {
  const panels = [BRAND_DARK, BRAND, BG];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 11000, pointerEvents: "none",
      display: "flex", flexWrap: "nowrap"
    }}>
      {/* Background Panels Sweeping */}
      {panels.map((c, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0, background: c,
          transform: active ? "translateX(0)" : "translateX(-100%)",
          transition: `transform 0.8s cubic-bezier(0.77, 0, 0.175, 1) ${i * 100}ms`
        }} />
      ))}

      {/* Foreground Logo Sweep - Stays on top */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10, opacity: active ? 1 : 0,
        transform: active ? "scale(1.5)" : "scale(1)",
        transition: active ? "all 0.4s ease 0.6s" : "all 0.3s ease"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
          padding: "20px 40px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
        }}>
          <Logo size={48} />
        </div>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = ["Home", "About", "Services", "Portfolio", "Blog", "Contact"];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(10,10,10,0.94)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${BORDER}` : "none",
      transition: "all 0.4s ease", padding: "0 40px"
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <Magnetic strength={12}>
          <button onClick={() => { setPage("Home"); setMenuOpen(false); window.scrollTo(0, 0); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Logo size={26} />
          </button>
        </Magnetic>
        <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
          {links.map(l => (
            <button key={l} onClick={() => { setPage(l); window.scrollTo(0, 0); setMenuOpen(false); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                letterSpacing: "0.5px", textTransform: "uppercase",
                color: page === l ? BRAND : MUTED, transition: "color 0.2s",
                borderBottom: page === l ? `2px solid ${BRAND}` : "2px solid transparent", paddingBottom: 2
              }}>{l}</button>
          ))}
          <Magnetic strength={20}>
            <button onClick={() => { setPage("Contact"); window.scrollTo(0, 0); }}
              style={{
                background: BRAND, color: "#fff", border: "none", borderRadius: 6,
                padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = BRAND_DARK}
              onMouseLeave={e => e.target.style.background = BRAND}>
              Get Started
            </button>
          </Magnetic>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", flexDirection: "column", gap: 5 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 24, height: 2, background: TEXT, display: "block" }} />)}
        </button>
      </div>
      {menuOpen && (
        <div style={{ background: SURFACE, padding: "24px 40px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {links.map(l => (
            <button key={l} onClick={() => { setPage(l); window.scrollTo(0, 0); setMenuOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 500, color: page === l ? BRAND : TEXT, textAlign: "left" }}>{l}</button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeRise { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes splashOut { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0;pointer-events:none} }
        @keyframes galleryFade { from{opacity:0;transform:scale(0.95) translateX(20px)} to{opacity:1;transform:scale(1) translateX(0)} }
        @keyframes infiniteSlide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes slideLTR { from { transform: translateX(-66.66%); } to { transform: translateX(-33.33%); } }
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .hamburger{display:flex!important}
          .mobile-stack{grid-template-columns:1fr!important; gap:40px!important}
          .mobile-padding{padding:60px 24px!important}
          .mobile-hide{display:none!important}
        }
        *{box-sizing:border-box;margin:0;padding:0;cursor:none!important}
        html{scroll-behavior:smooth}
        body{background:${BG};color:${TEXT};font-family:'DM Sans',sans-serif}
        ::selection{background:${BRAND};color:#fff}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${BRAND};border-radius:3px}
      `}</style>
    </nav>
  );
}

// ─── INTERACTIVE CUSTOM CURSOR ───────────────────────────────────────────────
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 1024px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      if (dotRef.current) dotRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  if (isMobile) return null;

  return (
    <>
      <div ref={dotRef} style={{
        position: "fixed", top: 0, left: 0, width: 8, height: 8, background: BRAND,
        borderRadius: "50%", pointerEvents: "none", zIndex: 99999,
        transition: "transform 0.08s ease-out",
        transform: "translate(-100px, -100px)",
        marginLeft: -4, marginTop: -4
      }} />
      <div ref={ringRef} style={{
        position: "fixed", top: 0, left: 0, width: 32, height: 32,
        borderRadius: "50%", border: `1px solid rgba(255,255,255,0.3)`,
        background: "transparent",
        pointerEvents: "none", zIndex: 99998,
        transition: "transform 0.15s ease-out",
        transform: "translate(-100px, -100px)",
        marginLeft: -16, marginTop: -16
      }} />
    </>
  );
}

// ─── TESTIMONIALS CAROUSEL ────────────────────────────────────────────────────
function TestimonialsCarousel({ items }) {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const paused = useRef(false);

  const goTo = useCallback((idx) => {
    setActive(idx);
    setAnimKey(k => k + 1);
  }, []);

  const next = useCallback(() => {
    setActive(a => (a + 1) % items.length);
    setAnimKey(k => k + 1);
  }, [items.length]);

  const prev = useCallback(() => {
    setActive(a => (a - 1 + items.length) % items.length);
    setAnimKey(k => k + 1);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      if (!paused.current) next();
    }, 3000);
    return () => clearInterval(id);
  }, [items.length, next]);

  const t = items[active];
  if (!t) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}>

      <div style={{ position: "relative", width: "100%", maxWidth: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: -60, background: "none", border: `1px solid ${BORDER}`, borderRadius: "50%", width: 44, height: 44, color: TEXT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s", zIndex: 10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = `rgba(232,75,43,0.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "none"; }} aria-label="Previous testimonial">←</button>
            <button onClick={next} style={{ position: "absolute", right: -60, background: "none", border: `1px solid ${BORDER}`, borderRadius: "50%", width: 44, height: 44, color: TEXT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s", zIndex: 10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = `rgba(232,75,43,0.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "none"; }} aria-label="Next testimonial">→</button>
          </>
        )}

        {/* Card */}
        <div key={animKey} style={{ maxWidth: 640, width: "100%", background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "56px 48px", textAlign: "center", animation: "tCarousel 0.45s cubic-bezier(0.22,1,0.36,1) both", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
          {/* Author photo */}
          <div style={{ marginBottom: 24 }}>
            {t.photo_url
              ? <img src={t.photo_url} alt={t.author} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${BORDER}`, display: "block", margin: "0 auto" }} />
              : <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff", margin: "0 auto" }}>{t.author?.charAt(0)}</div>
            }
          </div>
          {/* Rating */}
          <div style={{ color: "#FBBF24", fontSize: 18, marginBottom: 16 }}>{"★".repeat(t.rating || 5)}</div>
          {/* Quote */}
          <p style={{ color: TEXT, fontSize: 16, lineHeight: 1.8, marginBottom: 24, fontWeight: 500 }}>"{t.quote}"</p>
          {/* Name + company */}
          <div style={{ color: MUTED, fontSize: 14 }}>
            <strong style={{ color: TEXT, display: "block", marginBottom: 4 }}>{t.author}</strong>
            {t.role}{t.company ? ` @ ${t.company}` : ""}
          </div>
        </div>
      </div>

      {/* Dot nav */}
      {items.length > 1 && (
        <div style={{ display: "flex", gap: 10 }}>
          {items.map((t, i) => (
            <button key={t.$id || i} onClick={() => goTo(i)}
              style={{ width: i === active ? 28 : 8, height: 8, borderRadius: 4, background: i === active ? BRAND : BORDER, border: "none", cursor: "pointer", transition: "all 0.3s ease" }}
              aria-label={`Go to testimonial ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CLIENTS INFINITE TAPE ────────────────────────────────────────────────────
function ClientsCarousel({ items }) {
  if (items.length === 0) return null;
  // Double items for seamless loop
  const list = [...items, ...items, ...items];

  return (
    <div style={{
      overflow: "hidden", padding: "40px 0", cursor: "default",
      maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
    }}>
      <div className="infinite-roll" style={{
        display: "flex", alignItems: "center", gap: 80, width: "max-content",
        animation: "infiniteRoll 60s linear infinite"
      }}>
        {list.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.6, transition: "opacity 0.3s ease"
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
            {item.logo_url ? (
              <img src={item.logo_url} alt={item.name} style={{
                height: 38, maxWidth: 160, objectFit: "contain", filter: "grayscale(1) brightness(2)"
              }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, letterSpacing: "2px", textTransform: "uppercase" }}>{item.name}</span>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes infiniteRoll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showreelUrl, setShowreelUrl] = useState("");
  const [clients, setClients] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  
  const [videoVisible, setVideoVisible] = useState(true);
  const videoRef = useRef(null);
  const nativeVideoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const videoElement = nativeVideoRef.current;
    if (!videoElement) return;

    let isIntersecting = true;

    const ob = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      setVideoVisible(isIntersecting);
      
      if (isIntersecting) {
        videoElement.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        videoElement.pause();
      }
    }, { threshold: 0.1 });

    if (videoRef.current) ob.observe(videoRef.current);
    
    // Also pause if the entire window loses focus to save resources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoElement.pause();
      } else if (isIntersecting) {
        videoElement.play().catch(e => console.log("Autoplay prevented:", e));
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ob.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showreelUrl]);

  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [statsRef, statsVisible] = useInView(0.3);

  useEffect(() => {
    db.get("services", [Query.equal("visible", true), Query.orderAsc("sort_order"), Query.limit(100)])
      .then(data => { setServices(data || []); setLoadingServices(false); })
      .catch(() => setLoadingServices(false));
    db.get("settings", [Query.equal("key", "showreel_url")])
      .then(data => { if (data?.[0]?.value) setShowreelUrl(data[0].value); })
      .catch(() => { });
    db.get("clients", [Query.orderAsc("sort_order"), Query.limit(100)])
      .then(data => setClients((data || []).filter(c => c.visible !== false)))
      .catch(e => console.error("clients fetch:", e));
    db.get("testimonials", [Query.orderAsc("sort_order"), Query.limit(100)])
      .then(data => setTestimonials((data || []).filter(t => t.visible !== false)))
      .catch(e => console.error("testimonials fetch:", e));
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const animate = (setter, target, duration) => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        setter(Math.round(progress * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    animate(setCount1, 50, 1500);
    animate(setCount2, 98, 1800);
    animate(setCount3, 5, 1000);
  }, [statsVisible]);

  return (
    <div style={{ background: BG }}>
      {/* Hero */}
      <section style={{ padding: "120px 20px 80px", textAlign: "center", position: "relative", overflow: "hidden", minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ParticleBackground />
        <GrainOverlay />

        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <Reveal>
            <div style={{ display: "inline-block", background: "rgba(232,75,43,0.1)", color: BRAND, padding: "8px 20px", borderRadius: 100, fontSize: 13, fontWeight: 700, letterSpacing: "1px", marginBottom: 32, border: `1px solid rgba(232,75,43,0.2)` }}>
              WE ARE BOZON.DEV
            </div>
          </Reveal>
          <SplitText>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(48px, 8vw, 100px)", lineHeight: 1.05, fontWeight: 400, letterSpacing: "-2px", marginBottom: 32, color: TEXT }}>
              We craft digital<br />
              <em style={{ color: BRAND, fontStyle: "italic" }}>experiences</em> that<br />
              drive growth
            </h1>
          </SplitText>
          <Reveal delay={0.2}>
            <p style={{ fontSize: 18, color: MUTED, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
              All the solutions for the digital era — branding, web development, and digital marketing to make your goals a reality.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
              <Magnetic strength={25}>
                <button onClick={() => { setPage("Contact"); window.scrollTo(0, 0); }}
                  style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "16px 40px", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.background = BRAND_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.transform = "translateY(0)"; }}>
                  Get Started →
                </button>
              </Magnetic>
              <Magnetic strength={20}>
                <button onClick={() => { setPage("Portfolio"); window.scrollTo(0, 0); }}
                  style={{ background: "transparent", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 40px", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                  View Our Work
                </button>
              </Magnetic>
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.25, pointerEvents: "none" }}>
              <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase", fontWeight: 500, paddingLeft: 5 }}>Scroll</span>
              <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)` }} />
            </div>
          </Reveal>
        </div>
      </section>

      <AnimatedDivider />

      {/* Stats */}
      <section ref={statsRef} style={{ padding: "80px 40px", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, textAlign: "center" }}>
          {[{ num: count1, suffix: "+", label: "Projects Delivered" }, { num: count2, suffix: "%", label: "Client Satisfaction" }, { num: count3, suffix: "+", label: "Years Experience" }].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: BRAND, lineHeight: 1, marginBottom: 8 }}>{s.num}{s.suffix}</div>
              <div style={{ color: MUTED, fontSize: 14, letterSpacing: "1px", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <AnimatedDivider />

      {/* About summary */}
      <section style={{ padding: "120px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <Reveal>
            <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>About Bozon</span>
            <SplitText>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 1.15 }}>
                Building brands that <em style={{ color: BRAND, fontStyle: "italic" }}>stand out</em>
              </h2>
            </SplitText>
          </Reveal>
          <Reveal delay={0.15}>
            <p style={{ color: MUTED, fontSize: 17, lineHeight: 1.8, marginBottom: 24 }}>
              Bozon is a full-service digital agency dedicated to transforming businesses through strategic branding, cutting-edge web development, and data-driven digital marketing.
            </p>
            <p style={{ color: MUTED, fontSize: 17, lineHeight: 1.8, marginBottom: 32 }}>
              Our team combines creativity with technical expertise to deliver solutions that not only look exceptional but also drive measurable results.
            </p>
            <button onClick={() => { setPage("About"); window.scrollTo(0, 0); }}
              style={{ background: "none", border: "none", color: BRAND, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Learn more about us →
            </button>
          </Reveal>
        </div>
      </section>

      <AnimatedDivider />

      {/* Services — LIVE from Supabase */}
      <section style={{ padding: "80px 40px 120px", background: SURFACE }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>What We Do</span>
            <SplitText>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 4vw, 56px)", marginBottom: showreelUrl ? 40 : 64 }}>Our Services</h2>
            </SplitText>
          </Reveal>

          {/* 2025 Showreel */}
          {showreelUrl && (
            <Reveal>
              <div ref={videoRef} style={{ marginBottom: 64, borderRadius: 16, overflow: "hidden", position: "relative", paddingTop: "56.25%", background: "#000" }}>
                {(showreelUrl.toLowerCase().endsWith(".mp4") || showreelUrl.includes("cloud.appwrite.io/v1/storage")) ? (
                  <video
                    src={showreelUrl}
                    ref={nativeVideoRef}
                    autoPlay
                    loop
                    controls
                    playsInline
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={getEmbedUrl(showreelUrl, videoVisible)}
                    title="Bozon 2025 Showreel"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", zIndex: 1 }}
                  />
                )}
              </div>
            </Reveal>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {loadingServices
              ? Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32 }}>
                  <Skeleton w={52} h={52} radius={10} style={{ marginBottom: 20 }} />
                  <Skeleton w="60%" h={18} style={{ marginBottom: 12 }} />
                  <Skeleton h={14} style={{ marginBottom: 8 }} />
                  <Skeleton w="80%" h={14} />
                </div>
              ))
              : services.length > 0
                ? services.map((s, i) => (
                  <Reveal key={s.$id || i} delay={0.1 + (i % 3) * 0.1}>
                    <TiltCard style={{ borderRadius: 12 }}>
                      <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, cursor: "pointer", transition: "all 0.3s", height: "100%" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,75,43,0.4)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
                        onClick={() => { setPage("Services", s); window.scrollTo(0, 0); }}>
                        <div style={{ fontSize: 28, marginBottom: 20, width: 52, height: 52, background: `rgba(232,75,43,0.12)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">{s.icon}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: TEXT }}>{s.title}</h3>
                        <p style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>{s.subtitle}</p>
                        {s.description && <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>{s.description}</p>}
                        <span style={{ color: BRAND, fontSize: 13, fontWeight: 600 }}>Learn More →</span>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))
                : null
            }
          </div>
        </div>
      </section>

      <AnimatedDivider />

      {/* Clients / Logos Carousel — always visible */}
      <section style={{ padding: "80px 40px", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }} aria-label="Our clients">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <p style={{ textAlign: "center", color: MUTED, fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 48 }}>Trusted by great companies</p>
          </Reveal>

          <ClientsCarousel items={clients} />
        </div>
      </section>

      <AnimatedDivider />

      {/* Testimonials — auto-scrolling carousel */}
      <style>{`
        @keyframes tCarousel { 0%{opacity:0;transform:translateX(40px)} 100%{opacity:1;transform:translateX(0)} }
      `}</style>
      <section style={{ padding: "120px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", border: `1px solid ${BORDER}`, borderRadius: 999, padding: "6px 20px", fontSize: 13, color: MUTED, marginBottom: 40 }}>Testimonials</span>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 4vw, 56px)" }}>What our clients say</h2>
            </div>
          </Reveal>
          {testimonials.length > 0 ? (
            <TestimonialsCarousel items={testimonials} />
          ) : (
            /* Skeleton placeholder when no data */
            <div style={{ maxWidth: 600, margin: "0 auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "64px 48px", textAlign: "center" }}>
              <Skeleton w={96} h={96} radius="50%" style={{ margin: "0 auto 24px" }} />
              <Skeleton w="60%" h={18} style={{ margin: "0 auto 16px" }} />
              <Skeleton w="80%" h={14} style={{ margin: "0 auto 8px" }} />
              <Skeleton w="70%" h={14} style={{ margin: "0 auto 24px" }} />
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>{"★★★★★".split("").map((s, j) => <span key={j} style={{ color: "rgba(251,191,36,0.2)", fontSize: 22 }}>{s}</span>)}</div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "120px 40px", background: SURFACE }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, borderRadius: 16, padding: "80px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} aria-hidden="true" />
              <div style={{ position: "absolute", bottom: -60, left: -20, width: 280, height: 280, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} aria-hidden="true" />
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 4vw, 52px)", marginBottom: 20, color: "#fff", position: "relative", zIndex: 1 }}>Ready to grow your business?</h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 40, position: "relative", zIndex: 1 }}>Let's build something great together.</p>
              <button onClick={() => { setPage("Contact"); window.scrollTo(0, 0); }}
                style={{ background: "#fff", color: BRAND, border: "none", borderRadius: 8, padding: "16px 48px", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", position: "relative", zIndex: 1 }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                aria-label="Start a project with Bozon">
                Start a Project
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

// ─── ABOUT SHOWREEL EMBED ─────────────────────────────────────────────────────
function AboutShowreel() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    db.get("settings", [Query.equal("key", "showreel_url")])
      .then(data => { if (data?.[0]?.value) setUrl(data[0].value); })
      .catch(() => { });
  }, []);
  if (!url) return null;
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", paddingTop: "56.25%", background: "#000", marginTop: 8 }}>
      {url.toLowerCase().endsWith(".mp4") ? (
        <video src={url} autoPlay muted loop playsInline style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <iframe src={getEmbedUrl(url, true)} title="Bozon Company Showreel"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
      )}
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.get("team_members", [Query.equal("visible", true), Query.orderAsc("sort_order"), Query.limit(100)])
      .then(data => { setTeam(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: BG, paddingTop: 72 }}>
      <section style={{ padding: "100px 40px 80px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>About Bozon</span>
            <SplitText>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1.05, maxWidth: 800 }}>
                Building the future of <em style={{ color: BRAND, fontStyle: "italic" }}>digital</em>
              </h1>
            </SplitText>
          </Reveal>
        </div>
      </section>

      <AnimatedDivider />

      <section style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, alignItems: "start" }}>
          <Reveal><SplitText><h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, position: "sticky", top: 120 }}>Our Story</h2></SplitText></Reveal>
          <Reveal delay={0.1}>
            <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.9, marginBottom: 24 }}>bozon.dev is a full-service technology and digital solutions brand specializing in software development, business systems, and digital marketing services.</p>
            <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.9, marginBottom: 24 }}>We help businesses grow by combining technology, creativity, and strategic marketing to build a strong digital presence and efficient operational systems.</p>
            <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.9, marginBottom: 40 }}>Our approach is modern, corporate-grade, and performance-optimized, ensuring every solution is scalable and results-driven.</p>
            <AboutShowreel />
          </Reveal>
        </div>
      </section>

      <AnimatedDivider />

      <section style={{ padding: "80px 40px", background: SURFACE }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {[
            { label: "Our Mission", text: "To deliver innovative, scalable, and results-driven solutions tailored to each client's unique business goals. We aim to provide end-to-end digital solutions under one roof with a professional and reliable approach." },
            { label: "Our Vision", text: "To transform the digital landscape for businesses through premium, clean, and powerful technology. We strive to increase brand visibility and drive measurable success through customized strategies and reliable technical support." },
          ].map((mv, i) => (
            <Reveal key={i} delay={0.1 + i * 0.1}>
              <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 48 }}>
                <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 20 }}>{mv.label}</span>
                <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.8 }}>{mv.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <AnimatedDivider />

      {/* Team — LIVE from Supabase */}
      <section style={{ padding: "100px 40px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Our Team</span>
            <SplitText>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, marginBottom: 64 }}>The Team</h2>
            </SplitText>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 32 }}>
            {loading
              ? [1, 2, 3].map(i => (
                <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
                  <Skeleton w={100} h={100} radius="50%" style={{ margin: "0 auto 24px" }} />
                  <Skeleton w="60%" h={18} style={{ margin: "0 auto 10px" }} />
                  <Skeleton w="40%" h={13} style={{ margin: "0 auto" }} />
                </div>
              ))
              : team.length > 0
                ? team.map((t, i) => (
                  <Reveal key={t.$id} delay={0.1 + (i % 4) * 0.1}>
                    <TiltCard style={{ borderRadius: 16 }}>
                      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", transition: "all 0.3s ease", overflow: "hidden", height: "100%" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>

                        {/* Rectangular Image */}
                        <div style={{ width: "100%", aspectRatio: "4/5", overflow: "hidden", borderRadius: 14, marginBottom: 24 }}>
                          {t.image_url ? (
                            <img src={t.image_url} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 40, color: "#fff" }}>
                              {t.initials || t.name?.slice(0, 2)?.toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content aligned to left */}
                        <div style={{ padding: "0 12px 12px", textAlign: "left" }}>
                          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, color: TEXT }}>{t.name}</div>
                          <div style={{ color: BRAND, fontSize: 13, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>{t.role}</div>
                          {t.bio && <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{t.bio}</p>}
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))
                : null
            }
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── SERVICES PAGE ────────────────────────────────────────────────────────────
function ServicesPage({ services, loading, previewData }) {
  const [showreel, setShowreel] = useState({ url: "", title: "2025 Showreel", subtitle: "Coming Soon" });
  const [videoOpen, setVideoOpen] = useState(false);
  const [active, setActive] = useState(previewData || null);

  useEffect(() => {
    if (previewData) setActive(previewData);
  }, [previewData]);

  useEffect(() => {
    db.get("settings", [Query.equal("key", ["showreel_url", "showreel_title", "showreel_subtitle"])])
      .then(data => {
        if (data && data.length > 0) {
          const map = Object.fromEntries(data.map(r => [r.key, r.value]));
          setShowreel({
            url: map.showreel_url || "",
            title: map.showreel_title || "2025 Showreel",
            subtitle: map.showreel_subtitle || "Coming Soon",
          });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (active) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const embedUrl = getEmbedUrl(showreel.url, true);
  const isDirectVideo = showreel.url && (showreel.url.toLowerCase().endsWith(".mp4") || showreel.url.includes("cloud.appwrite.io/v1/storage"));
  const hasVideo = !!showreel.url;
  const list = services;

  return (
    <div style={{ background: BG, paddingTop: 72, position: "relative", minHeight: "100vh" }}>
      {/* Page Content */}
      {active ? (
        <div style={{
          position: "relative", zIndex: 10, background: BG,
          animation: "fadeUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both"
        }}>
          <ServiceDetailPage service={active} onBack={() => setActive(null)} />
        </div>
      ) : (
        /* List View */
        <div style={{
          animation: "fadeIn 0.5s ease"
        }}>
          {/* Showreel */}
          <section style={{ position: "relative", height: "55vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(232,75,43,0.18) 0%, transparent 70%)`, pointerEvents: "none", zIndex: 2 }} />
            
            {hasVideo && (
              isDirectVideo ? (
                /* Removed pointerEvents="none" and opacity constraints since the user wants to access the video */
                <video src={showreel.url} autoPlay loop controls playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }} />
              ) : (
                <iframe src={embedUrl} title="Showreel" allow="autoplay; fullscreen" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1 }} />
              )
            )}

            {!hasVideo && (
              <div style={{ textAlign: "center", position: "relative", zIndex: 3, pointerEvents: "none" }}>
                <p style={{ color: MUTED, fontSize: 11, marginTop: 8, opacity: 0.6 }}>Set the video URL in Admin → Settings</p>
              </div>
            )}
          </section>

          <AnimatedDivider style={{ maxWidth: "none" }} />

          <section style={{ padding: "100px 40px 120px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <Reveal>
                <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>What We Do</span>
                <SplitText>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 64 }}>Our Services</h1>
                </SplitText>
              </Reveal>

              {loading
                ? Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 2, padding: "28px 32px" }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <Skeleton w={32} h={32} radius={6} />
                      <Skeleton w="35%" h={18} />
                    </div>
                  </div>
                ))
                : list.map((s, i) => (
                  <Reveal key={s.$id} delay={0.1 + i * 0.05}>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: "transparent", transition: "all 0.3s", overflow: "hidden", marginBottom: 2 }}>
                      <button onClick={() => setActive(s)}
                        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: TEXT, padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, transition: "background 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = `rgba(232,75,43,0.3)`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = BORDER; }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20, textAlign: "left" }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: BRAND, letterSpacing: "1px", textTransform: "uppercase" }}>{s.subtitle}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 14, color: BRAND, fontWeight: 700, letterSpacing: "1px" }}>VIEW DETAILS →</span>
                      </button>
                    </div>
                  </Reveal>
                ))
              }
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─── SERVICE DETAIL PAGE ─────────────────────────────────────────────────────
function ServiceDetailPage({ service, onBack }) {
  if (!service) return null;

  // Clone gallery items to create seamless loop
  const galleryItems = service.gallery && service.gallery.length > 0
    ? [...service.gallery, ...service.gallery, ...service.gallery]
    : [];

  const itemWidth = 600;
  const gap = 30;
  const totalWidth = galleryItems.length * (itemWidth + gap);

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: "120px 0 100px", animation: "fadeIn 0.6s ease" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>

        {/* Back Button */}
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: BRAND, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 60, textTransform: "uppercase", letterSpacing: "1px", transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}>
          <span style={{ fontSize: 18 }}>←</span> Back to Services
        </button>

        {/* 2. Infinite Sliding Gallery (Left to Right) */}
        {galleryItems.length > 0 ? (
          <div style={{
            width: "calc(100% + 80px)", margin: "0 -40px 60px", overflow: "hidden", position: "relative",
            maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
          }}>
            <div style={{
              display: "flex", gap: `${gap}px`, width: `${totalWidth}px`,
              animation: `slideLTR ${service.gallery.length * 12}s linear infinite`,
              // To move left-to-right, we start at -66.66% and go to -33.33% for 3 copies
              transform: "translateX(-33.33%)"
            }}>
              {galleryItems.map((img, i) => (
                <div key={i} style={{
                  width: itemWidth, height: 450, flexShrink: 0, borderRadius: 32, overflow: "hidden",
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)"
                }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px, 6vw, 80px)", alignItems: "start" }}>
          <div>
            {/* 1. Title under the gallery */}
            <div style={{ marginBottom: 40 }}>
              <span style={{ color: BRAND, fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", display: "block", marginBottom: 16, fontWeight: 700 }}>Service Specialist</span>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 72px)", marginBottom: 20, lineHeight: 1.1 }}>{service.title}</h1>
              <div style={{ fontSize: 16, color: MUTED, letterSpacing: "1px" }}>{service.subtitle}</div>
            </div>

            {/* 3. Other details */}
            {service.description && (
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 20, lineHeight: 1.8, marginBottom: 0 }}>
                {service.description}
              </p>
            )}
          </div>

          <div style={{ paddingTop: 20 }}>
            {service.items && service.items.length > 0 && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 40 }}>
                <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "2px", color: BRAND, marginBottom: 32, fontWeight: 800 }}>Core Expertise</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(Array.isArray(service.items) ? service.items : service.items.split(",").map(x => x.trim())).map((it, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${BORDER}`, paddingBottom: 16 }}>
                      <span style={{ color: BRAND, fontSize: 18 }}>◈</span>
                      <span style={{ fontSize: 16, fontWeight: 500, color: TEXT }}>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────
function PortfolioPage({ previewData, onActiveChange }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (previewData) {
      setCases([previewData]);
      setActive(previewData.id || "preview");
      setLoading(false);
    } else {
      db.get("portfolio", [Query.equal("visible", true), Query.orderDesc("$createdAt"), Query.limit(100)])
        .then(data => { setCases(data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [previewData]);

  useEffect(() => {
    if (active) window.scrollTo({ top: 0, behavior: "smooth" });
    const item = cases.find(c => c.$id === active);
    onActiveChange?.(item ? item.title : null);
  }, [active, cases, onActiveChange]);

  const list = cases;
  const item = active ? list.find(c => c.$id === active) : null;

  return (
    <div style={{ background: BG, paddingTop: 72, position: "relative", minHeight: "100vh" }}>
      {item ? (
        /* Detail View */
        <div style={{
          position: "relative", zIndex: 10, background: BG,
          animation: "fadeUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both"
        }}>
          <section style={{ padding: "80px 40px 120px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <button onClick={() => setActive(null)}
                style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, marginBottom: 48, display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = BRAND}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                ← Back to Portfolio
              </button>
              <Reveal delay={0.1}>
                <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>{item.category} · {item.year}</span>
                <SplitText>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 5vw, 64px)", marginBottom: 80 }}>{item.title}</h1>
                </SplitText>
              </Reveal>
              {[["The Problem", item.problem], ["Our Strategy", item.strategy], ["Execution", item.execution], ["Results", item.results]].filter(([, v]) => v).map(([label, content], i) => (
                <Reveal key={i} delay={0.2 + i * 0.1}>
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 48, marginTop: 48 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 40, alignItems: "start" }} className="mobile-stack">
                      <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", paddingTop: 4 }}>{label}</span>
                      <div style={{ color: MUTED, fontSize: 17, lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* List View */
        <section style={{
          padding: "100px 40px 120px",
          animation: "fadeIn 0.5s ease"
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <Reveal>
              <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Our Work</span>
              <SplitText>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1.05, marginBottom: 80 }}>
                  Case <em style={{ color: BRAND, fontStyle: "italic" }}>Studies</em>
                </h1>
              </SplitText>
            </Reveal>
            <AnimatedDivider style={{ marginBottom: 64, maxWidth: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40 }}>
                    <Skeleton w="40%" h={12} style={{ marginBottom: 20 }} />
                    <Skeleton w="75%" h={24} style={{ marginBottom: 14 }} />
                    <Skeleton h={14} style={{ marginBottom: 8 }} />
                    <Skeleton w="85%" h={14} />
                  </div>
                ))
                : list.map((c, i) => (
                  <Reveal key={c.$id} delay={0.1 + (i % 3) * 0.12}>
                    <TiltCard style={{ borderRadius: 12 }}>
                      <div onClick={() => setActive(c.$id)}
                        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40, cursor: "pointer", transition: "all 0.3s", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,75,43,0.4)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
                        <div>
                          <span style={{ color: BRAND, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>{c.category} · {c.year}</span>
                          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 14, lineHeight: 1.2 }}>{c.title}</h3>
                          {c.problem && <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7 }}>{c.problem.replace(/<[^>]*>/g, '').slice(0, 110)}...</p>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: BRAND, fontSize: 13, fontWeight: 600 }}>View Case Study</span>
                          <span style={{ color: BRAND, fontSize: 20 }}>→</span>
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))
              }
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── BLOG PAGE ────────────────────────────────────────────────────────────────
function BlogPage({ previewData, onActiveChange }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (previewData) {
      setPosts([previewData]);
      setActive(previewData.id || "preview");
      setLoading(false);
    } else {
      db.get("blog_posts", [Query.equal("published", true), Query.orderDesc("published_at"), Query.limit(100)])
        .then(data => { setPosts(data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [previewData]);

  useEffect(() => {
    if (active) window.scrollTo({ top: 0, behavior: "smooth" });
    const post = posts.find(p => p.$id === active);
    onActiveChange?.(post ? post.title : null);
  }, [active, posts, onActiveChange]);

  const post = active ? posts.find(p => p.$id === active) : null;

  return (
    <div style={{ background: BG, paddingTop: 72, position: "relative", minHeight: "100vh" }}>
      {post ? (
        /* Detail View */
        <div style={{
          position: "relative", zIndex: 10, background: BG,
          animation: "fadeUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both"
        }}>
          <section style={{ padding: "80px 40px 120px" }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <button onClick={() => setActive(null)}
                style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, marginBottom: 48, display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = BRAND}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                ← Back to Blog
              </button>
              <Reveal delay={0.1}>
                <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>{post.category}</span>
                <SplitText>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.15, marginBottom: 24 }}>{post.title}</h1>
                </SplitText>
                <p style={{ color: MUTED, fontSize: 14, marginBottom: 56 }}>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="blog-content" style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }} />
              </Reveal>
            </div>
          </section>
        </div>
      ) : (
        /* List View */
        <section style={{
          padding: "100px 40px 120px",
          animation: "fadeIn 0.5s ease"
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <Reveal>
              <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Insights</span>
              <SplitText>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1.05, marginBottom: 80 }}>
                  Our <em style={{ color: BRAND, fontStyle: "italic" }}>Blog</em>
                </h1>
              </SplitText>
            </Reveal>
            <AnimatedDivider style={{ marginBottom: 64, maxWidth: "none" }} />
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 36 }}>
                    <Skeleton w="30%" h={12} style={{ marginBottom: 16 }} />
                    <Skeleton w="80%" h={22} style={{ marginBottom: 12 }} />
                    <Skeleton h={14} style={{ marginBottom: 8 }} />
                    <Skeleton w="70%" h={14} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>✏️</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 12 }}>No posts yet</h3>
                <p style={{ color: MUTED }}>Check back soon for insights and updates from the bozon team.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {posts.map((p, i) => (
                  <Reveal key={p.$id} delay={0.1 + (i % 3) * 0.1}>
                    <TiltCard style={{ borderRadius: 12 }}>
                      <div onClick={() => setActive(p.$id)}
                        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 36, cursor: "pointer", transition: "all 0.3s", height: "100%" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,75,43,0.4)`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
                        <span style={{ color: BRAND, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 14 }}>{p.category}</span>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 12, lineHeight: 1.3 }}>{p.title}</h3>
                        {p.excerpt && <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{p.excerpt}</p>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: MUTED, fontSize: 12 }}>{p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}</span>
                          <span style={{ color: BRAND, fontSize: 13, fontWeight: 600 }}>Read →</span>
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── CONTACT PAGE — saves to Supabase ────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [touched, setTouched] = useState({ name: false, email: false, service: false, message: false });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }));

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    else if (!/^[A-Za-z\s]+$/.test(form.name.trim())) errors.name = "Invalid name (letters only)";

    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email address";

    if (!form.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const errors = validate();

  const submit = async () => {
    setTouched({ name: true, email: true, service: true, message: true });
    if (Object.keys(errors).length > 0) return;
    setSending(true);
    const ok = await db.post("contact_submissions", { ...form, read: false });
    setSending(false);
    setSent(true);
  };

  return (
    <div style={{ background: BG, paddingTop: 72 }}>
      <section style={{ padding: "100px 40px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 100, alignItems: "start" }}>
          <Reveal>
            <span style={{ color: BRAND, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Contact Us</span>
            <SplitText>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(40px, 5vw, 64px)", marginBottom: 40 }}>
                Let's start a <em style={{ color: BRAND, fontStyle: "italic" }}>conversation</em>
              </h1>
            </SplitText>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.8, marginBottom: 48 }}>Whether you have a project in mind or just want to explore how we can help, we'd love to hear from you.</p>
            {[
              { icon: "✉", label: "Email", value: "bozondev@gmail.com", href: "mailto:bozondev@gmail.com" },
              { icon: "📞", label: "Phone", value: "+94 740 415 234", href: "tel:+94740415234" },
              { icon: "🌐", label: "Website", value: "www.bozon.dev", href: "https://bozon.dev" },
            ].map((c, i) => (
              <a key={i} href={c.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, background: `rgba(232,75,43,0.12)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ color: MUTED, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 2 }}>{c.label}</div>
                  <div style={{ color: TEXT, fontSize: 15, fontWeight: 500 }}>{c.value}</div>
                </div>
              </a>
            ))}
          </Reveal>
          <Reveal delay={0.1}>
            {sent ? (
              <div style={{ background: SURFACE, border: `1px solid rgba(232,75,43,0.3)`, borderRadius: 12, padding: 64, textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 24 }}>✓</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, marginBottom: 16 }}>Message Sent!</h3>
                <p style={{ color: MUTED, fontSize: 16 }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 48 }}>
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 28 }}>Send us a message</h3>
                {[{ key: "name", label: "Full Name", type: "text", placeholder: "John Smith" }, { key: "email", label: "Email Address", type: "email", placeholder: "john@company.com" }].map(f => {
                  const hasError = touched[f.key] && errors[f.key];
                  const isValid = touched[f.key] && !errors[f.key];
                  return (
                    <div key={f.key} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <label style={{ fontSize: 13, color: MUTED }}>{f.label}</label>
                        {hasError && <span style={{ fontSize: 11, color: BRAND }}>{errors[f.key]}</span>}
                        {isValid && <span style={{ fontSize: 11, color: "#22c55e" }}>✓ Valid</span>}
                      </div>
                      <input type={f.type} value={form[f.key]}
                        onChange={e => handle(f.key, e.target.value)}
                        onBlur={() => touch(f.key)}
                        placeholder={f.placeholder}
                        style={{
                          width: "100%", background: SURFACE2,
                          border: `1px solid ${hasError ? BRAND : (isValid ? "rgba(34,197,94,0.3)" : BORDER)}`,
                          borderRadius: 8, padding: "14px 16px", fontSize: 15, color: TEXT,
                          fontFamily: "'DM Sans', sans-serif", outline: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s"
                        }} />
                    </div>
                  );
                })}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, color: MUTED, marginBottom: 8 }}>Service Needed</label>
                  <select value={form.service} onChange={e => handle("service", e.target.value)}
                    onBlur={() => touch("service")}
                    style={{ width: "100%", background: SURFACE2, border: `1px solid ${touched.service ? "rgba(34,197,94,0.3)" : BORDER}`, borderRadius: 8, padding: "14px 16px", fontSize: 15, color: TEXT, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                    <option value="">Select a service</option>
                    {["Website Design & Development", "Mobile App Development", "Digital Marketing", "POS System", "Social Media Marketing", "Web3", "Branding"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: MUTED }}>Message</label>
                    {touched.message && errors.message && <span style={{ fontSize: 11, color: BRAND }}>{errors.message}</span>}
                    {touched.message && !errors.message && <span style={{ fontSize: 11, color: "#22c55e" }}>✓ Valid</span>}
                  </div>
                  <textarea value={form.message}
                    onChange={e => handle("message", e.target.value)}
                    onBlur={() => touch("message")}
                    placeholder="Tell us about your project..." rows={5}
                    style={{
                      width: "100%", background: SURFACE2,
                      border: `1px solid ${touched.message && errors.message ? BRAND : (touched.message && !errors.message ? "rgba(34,197,94,0.3)" : BORDER)}`,
                      borderRadius: 8, padding: "14px 16px", fontSize: 15, color: TEXT,
                      fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical",
                      transition: "border-color 0.2s"
                    }} />
                </div>
                <button onClick={submit} disabled={sending || Object.keys(errors).length > 0}
                  style={{
                    width: "100%", background: (sending || Object.keys(errors).length > 0) ? SURFACE2 : BRAND,
                    color: "#fff", border: "none", borderRadius: 8, padding: "16px", fontSize: 16, fontWeight: 600,
                    cursor: (sending || Object.keys(errors).length > 0) ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    opacity: (sending || Object.keys(errors).length > 0) ? 0.6 : 1
                  }}
                  onMouseEnter={e => { if (!sending && Object.keys(errors).length === 0) e.currentTarget.style.background = BRAND_DARK; }}
                  onMouseLeave={e => { if (!sending && Object.keys(errors).length === 0) e.currentTarget.style.background = BRAND; }}>
                  {sending ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Sending...</> : "Send Message →"}
                </button>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage, services = [], social = {} }) {
  const serviceLinks = services.map(s => ({ label: s.title, data: s }));

  const SocialIcon = ({ href, children, label }) => {
    if (!href) return null;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
        style={{
          width: 40, height: 40, borderRadius: "50%", background: SURFACE2, border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center", color: MUTED,
          transition: "all 0.3s ease", textDecoration: "none"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = BRAND;
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.background = `rgba(232,75,43,0.1)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = BORDER;
          e.currentTarget.style.color = MUTED;
          e.currentTarget.style.background = SURFACE2;
        }}>
        {children}
      </a>
    );
  };

  return (
    <footer style={{
      position: "relative",
      marginTop: 120,
      background: "rgba(17, 17, 17, 0.4)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${BORDER}`,
      padding: "100px 40px 60px",
      overflow: "hidden"
    }} className="mobile-padding">
      {/* Subtle Gradient Glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", height: "100%", pointerEvents: "none", zIndex: -1
      }}>
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "400px", background: BRAND, opacity: 0.03, filter: "blur(120px)", borderRadius: "50%"
        }} />
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 56 }}>
          <div>
            <div style={{ marginBottom: 24 }}>
              <Logo size={24} />
            </div>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.8, maxWidth: 280, marginBottom: 32 }}>A full-service technology and digital solutions brand helping businesses grow through technology, creativity, and strategic marketing.</p>

            <div style={{ display: "flex", gap: 12 }}>
              <SocialIcon href={social.linkedin} label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </SocialIcon>
              <SocialIcon href={social.instagram} label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </SocialIcon>
              <SocialIcon href={social.x} label="X (Twitter)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialIcon>
              <SocialIcon href={social.facebook} label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </SocialIcon>
            </div>
          </div>
          {[
            { title: "Company", links: [{ label: "Home" }, { label: "About" }, { label: "Services" }, { label: "Portfolio" }, { label: "Blog" }, { label: "Contact" }] },
            { title: "Services", links: serviceLinks.length > 0 ? serviceLinks : [{ label: "Web Development" }, { label: "Mobile Apps" }, { label: "Digital Marketing" }, { label: "POS Systems" }, { label: "Web3" }] },
            { title: "Contact", links: [{ label: "bozondev@gmail.com", href: "mailto:bozondev@gmail.com" }, { label: "+94 740 415 234", href: "tel:+94740415234" }, { label: "www.bozon.dev", href: "https://bozon.dev" }] },
          ].map((col, i) => (
            <div key={col.title || i}>
              <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, color: TEXT }}>{col.title}</div>
              {col.links.map((l, j) => (
                <div key={l.label || j} style={{ marginBottom: 10 }}>
                  {l.href ? (
                    <a href={l.href} style={{ color: MUTED, fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = TEXT} onMouseLeave={e => e.target.style.color = MUTED}>{l.label}</a>
                  ) : (
                    <button onClick={() => {
                      if (col.title === "Services" && l.data) {
                        setPage("Services", l.data);
                      } else {
                        setPage(l.label);
                      }
                      window.scrollTo(0, 0);
                    }}
                      style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, padding: 0, transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = TEXT} onMouseLeave={e => e.target.style.color = MUTED}>{l.label}</button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: MUTED, fontSize: 13 }}>© {new Date().getFullYear()} BOZON.DEV. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="http://localhost:5174" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }} onMouseEnter={e => e.target.style.color = BRAND} onMouseLeave={e => e.target.style.color = MUTED}>Admin Panel</a>
            <span style={{ color: MUTED, fontSize: 13 }}>Technology & Digital Solutions Provider</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: BG,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "splashOut 1.8s ease forwards",
    }}>
      <div style={{ animation: "fadeUp 0.6s ease" }}>
        <Logo size={36} />
      </div>
      <div style={{
        marginTop: 32, width: 120, height: 2, background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)`,
        animation: "fadeIn 0.8s ease 0.4s both"
      }} />
    </div>
  );
}

// ─── LUXURY 404 EXPERIENCE ────────────────────────────────────────────────────
function NotFound({ setPage }) {
  return (
    <div style={{
      background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: 40, position: "relative", overflow: "hidden"
    }}>
      {/* Dynamic Background Element */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: "min(30vw, 400px)", fontFamily: "'DM Serif Display', serif",
        color: BRAND, opacity: 0.03, userSelect: "none", zIndex: 0,
        letterSpacing: "-0.05em", fontWeight: 900
      }}>404</div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
        <Reveal>
          <span style={{ color: BRAND, fontSize: 13, letterSpacing: "3px", textTransform: "uppercase", display: "block", marginBottom: 24, fontWeight: 600 }}>Lost in the right place</span>
          <SplitText>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.1, marginBottom: 32 }}>
              A beauty <em style={{ color: BRAND, fontStyle: "italic" }}>misplaced</em>
            </h1>
          </SplitText>
        </Reveal>

        <Reveal delay={0.2}>
          <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.8, marginBottom: 56, maxWidth: 480, margin: "0 auto 56px" }}>
            The page you're seeking has moved to another dimension. Let's guide you back to our curated experience.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <button onClick={() => { setPage("Home"); window.scrollTo(0, 0); }}
            style={{
              background: "transparent", color: TEXT, border: `1px solid ${BRAND}`,
              borderRadius: "50px", padding: "18px 48px", fontSize: 14, letterSpacing: "1px",
              fontWeight: 600, cursor: "pointer", transition: "all 0.4s cubic-bezier(0.2, 1, 0.3, 1)",
              textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 12
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = BRAND;
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = TEXT;
              e.currentTarget.style.transform = "scale(1)";
            }}>
            Return to Sanctuary →
          </button>
        </Reveal>
      </div>

      {/* Decorative Corner Lines */}
      <div style={{ position: "absolute", bottom: 60, left: 60, width: 80, height: 1, background: BORDER }} />
      <div style={{ position: "absolute", bottom: 60, left: 60, width: 1, height: 80, background: BORDER }} />
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Home");
  const [prevPage, setPrevPage] = useState("Home");
  const [transKey, setTransKey] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [activeItemTitle, setActiveItemTitle] = useState(null);
  const [splash, setSplash] = useState(true);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [social, setSocial] = useState({
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    x: "https://x.com",
    facebook: "https://facebook.com"
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    db.get("services", [Query.equal("visible", true), Query.orderAsc("sort_order"), Query.limit(100)])
      .then(data => { setServices(data || []); setLoadingServices(false); })
      .catch(() => setLoadingServices(false));

    db.get("settings", [Query.equal("key", ["social_linkedin", "social_instagram", "social_x", "social_facebook"])])
      .then(data => {
        if (data) {
          const map = {};
          data.forEach(s => map[s.key.replace("social_", "")] = s.value);
          setSocial(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  const changePage = (newPage, data) => {
    if (newPage === page && !data) return;
    setIsTransitioning(true);

    // 1. Wait for panels to cover the screen (approx 1s)
    setTimeout(() => {
      if (data) setPreviewData({ dataType: "service", data });
      else setPreviewData(null);
      setPrevPage(page);
      setPage(newPage);
      setTransKey(k => k + 1);
      window.scrollTo(0, 0);

      // 2. Hold for exactly 1s of total logo visibility
      // (Logo appears at 0.6s, panels covered at 1.0s. So 0.4s + 0.6s = 1.0s)
      setTimeout(() => setIsTransitioning(false), 600);
    }, 1000);
  };

  useEffect(() => {
    const titles = {
      Home: "Premier Digital Agency | BOZON",
      About: "Our Story | BOZON",
      Services: "Creative Services | BOZON",
      Portfolio: "Case Studies | BOZON",
      Blog: "Insights & Journal | BOZON",
      Contact: "Get in Touch | BOZON"
    };
    const base = titles[page] || "BOZON";
    document.title = activeItemTitle ? `${activeItemTitle} | ${base}` : base;
  }, [page, activeItemTitle]);

  useEffect(() => {
    const meta = {
      "og:title": document.title,
      "og:description": "BOZON - Building digital masterpieces for high-growth brands.",
      "og:type": "website",
      "twitter:card": "summary_large_image"
    };
    Object.entries(meta).forEach(([k, v]) => {
      let el = document.querySelector(`meta[property="${k}"], meta[name="${k}"]`);
      if (!el) { el = document.createElement('meta'); if (k.startsWith('og:')) el.setAttribute('property', k); else el.setAttribute('name', k); document.head.appendChild(el); }
      el.setAttribute('content', v);
    });
  }, [activeItemTitle, page]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true") {
      const type = params.get("type");
      if (type === "blog") setPage("Blog");
      if (type === "portfolio") setPage("Portfolio");
    }

    const handleMessage = (e) => {
      if (e.data?.type === "PREVIEW_DATA") {
        setPreviewData(e.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const portfolioPage = <PortfolioPage
    previewData={previewData?.dataType === "portfolio" ? previewData.data : null}
    onActiveChange={setActiveItemTitle}
  />;
  const blogPage = <BlogPage
    previewData={previewData?.dataType === "blog" ? previewData.data : null}
    onActiveChange={setActiveItemTitle}
  />;

  const pages = {
    Home: <HomePage setPage={changePage} />,
    About: <AboutPage />,
    Services: <ServicesPage services={services} loading={loadingServices} previewData={previewData?.dataType === "service" ? previewData.data : null} />,
    Portfolio: portfolioPage,
    Blog: blogPage,
    Contact: <ContactPage />,
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'DM Sans', sans-serif" }}>
      <CustomCursor />
      <TransitionPanels active={isTransitioning} />
      {splash && <SplashScreen onDone={() => { setSplash(false); window.scrollTo(0, 0); }} />}

      <div style={{ animation: "fadeRise 1.6s cubic-bezier(0.2, 1, 0.3, 1) both" }}>
        <Nav page={page} setPage={changePage} />
        <div key={transKey} style={{ animation: "fadeIn 0.4s ease" }}>
          {pages[page] || <NotFound setPage={changePage} />}
        </div>
        <Footer setPage={changePage} services={services} social={social} />
      </div>
    </div>
  );
}
