import { useState, useEffect, useCallback, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { account, databases, storage, DB_ID, BUCKET_ID, ID, Query } from "./appwrite";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#0F0F0F",
  surface2: "#161616",
  surface3: "#1E1E1E",
  brand: "#E84B2B",
  brandDark: "#C23A1F",
  brandGlow: "rgba(232,75,43,0.15)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.15)",
  text: "#F5F5F5",
  muted: "rgba(245,245,245,0.4)",
  muted2: "rgba(245,245,245,0.2)",
  success: "#16A34A",
  successBg: "rgba(22,163,74,0.1)",
  warning: "#D97706",
  warningBg: "rgba(217,119,6,0.1)",
  danger: "#DC2626",
  dangerBg: "rgba(220,38,38,0.1)",
  info: "#2563EB",
  infoBg: "rgba(37,99,235,0.1)",
};

// SQL Schema omitted (Appwrite Collections are created via automated JS script)

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.brand}; border-radius: 2px; }
    ::selection { background: ${C.brand}; color: #fff; }
    input, textarea, select { font-family: 'DM Sans', sans-serif; }
    button { font-family: 'DM Sans', sans-serif; }
    a { color: inherit; text-decoration: none; }
    .row-hover:hover { background: ${C.surface2} !important; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return <div style={{ width: size, height: size, border: `2px solid ${C.border}`, borderTopColor: C.brand, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

function Badge({ variant = "brand", children }) {
  const map = {
    brand: { bg: C.brandGlow, color: C.brand, border: "rgba(232,75,43,0.25)" },
    green: { bg: C.successBg, color: "#4ADE80", border: "rgba(74,222,128,0.25)" },
    orange: { bg: C.warningBg, color: "#FCD34D", border: "rgba(252,211,77,0.25)" },
    red: { bg: C.dangerBg, color: "#F87171", border: "rgba(248,113,113,0.25)" },
    gray: { bg: "rgba(255,255,255,0.05)", color: C.muted, border: C.border },
  };
  const s = map[variant] || map.brand;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Btn({ onClick, children, variant = "primary", size = "md", loading = false, disabled = false, style: xStyle = {} }) {
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "9px 20px", fontSize: 13 }, lg: { padding: "13px 32px", fontSize: 15 } };
  const variants = {
    primary: { background: C.brand, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.dangerBg, color: "#F87171", border: `1px solid rgba(248,113,113,0.25)` },
    outline: { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button onClick={!disabled && !loading ? onClick : undefined}
      style={{ ...v, ...s, borderRadius: 7, cursor: disabled || loading ? "not-allowed" : "pointer", fontWeight: 600, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 7, opacity: disabled ? 0.5 : 1, ...xStyle }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = "0.82"; }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.opacity = "1"; }}>
      {loading && <Spinner size={13} />}
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{ width: "100%", background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", fontSize: 14, color: C.text, outline: "none", transition: "border-color 0.15s" }}
      onFocus={e => e.target.style.borderColor = C.brand}
      onBlur={e => e.target.style.borderColor = C.border} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", fontSize: 14, color: C.text, outline: "none", resize: "vertical", transition: "border-color 0.15s", lineHeight: 1.6 }}
      onFocus={e => e.target.style.borderColor = C.brand}
      onBlur={e => e.target.style.borderColor = C.border} />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: "100%", background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", fontSize: 14, color: value ? C.text : C.muted, outline: "none" }}>
      {children}
    </select>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? C.brand : C.surface3, border: `1px solid ${value ? C.brand : C.border}`, position: "relative", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );
}

function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <label style={{ fontSize: 12, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}>
          {label}{required && <span style={{ color: C.brand, marginLeft: 3 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 11, color: C.muted2 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, type = "success" }) {
  const colors = { success: C.success, error: C.danger, info: C.info };
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: C.surface, border: `1px solid ${colors[type]}40`,
      borderLeft: `3px solid ${colors[type]}`, borderRadius: 8,
      padding: "14px 20px", fontSize: 14, fontWeight: 500, color: C.text,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeUp 0.25s ease",
      display: "flex", alignItems: "center", gap: 10, maxWidth: 320
    }}>
      <span style={{ fontSize: 16 }}>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      {msg}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ padding: "72px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>{sub}</div>
      {action}
    </div>
  );
}

function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 36px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Are you sure?</div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>{msg}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: wide ? 900 : 500, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", animation: "fadeUp 0.3s ease" }}>
        {/* Header */}
        <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "rgba(255,255,255,0.01)" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: subtitle ? 4 : 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 28, cursor: "pointer", padding: 0, lineHeight: 1, marginTop: -4, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = C.brand} onMouseLeave={e => e.target.style.color = C.muted}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "32px", overflowY: "auto", flex: 1, background: "rgba(255,255,255,0.005)" }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

const Logo = ({ size = 20, glow = false }) => (
  <div style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: size, fontWeight: 900, color: C.text, display: "flex", alignItems: "center", gap: size * 0.4,
    letterSpacing: "-1px", userSelect: "none",
    filter: glow ? `drop-shadow(0 0 15px ${C.brand}66)` : "none"
  }}>
    <div style={{
      width: size * 1.1, height: size * 1.1, background: C.brand, borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <span style={{ color: "#fff", fontSize: size * 0.75, fontWeight: 900, transform: "rotate(-5deg)", marginLeft: 1 }}>B</span>
    </div>
    <span>BOZON</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS & LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function logActivity(action, entityType, entityId, details = null) {
  try {
    const user = await account.get();
    if (!user) return;
    // Audit logs collection is currently omitted, we will just silently pass for now.
    // If you need it, we can create the Appwrite collection.
  } catch (err) { console.error("Logging failed", err); }
}

function RichTextEditor({ value, onChange, placeholder }) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <style>{`
        .quill { background: ${C.surface3}; border-radius: 8px; border: 1px solid ${C.border}; overflow: hidden; }
        .ql-toolbar { border: none !important; border-bottom: 1px solid ${C.border} !important; background: rgba(255,255,255,0.02); }
        .ql-container { border: none !important; font-family: 'DM Sans', sans-serif; font-size: 14px; min-height: 120px; color: ${C.text}; }
        .ql-editor.ql-blank::before { color: ${C.muted}; font-style: normal; }
        .ql-snow.ql-toolbar button .ql-stroke { stroke: ${C.muted}; }
        .ql-snow.ql-toolbar button .ql-fill { fill: ${C.muted}; }
        .ql-snow.ql-toolbar button:hover .ql-stroke { stroke: ${C.brand}; }
        .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke: ${C.brand}; }
      `}</style>
      <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} placeholder={placeholder} />
    </div>
  );
}

function ImageUpload({ value, onChange, onUploading, bucket = "team" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    if (onUploading) onUploading(true);

    try {
      const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const url = storage.getFileView(BUCKET_ID, result.$id);
      onChange(url);
    } catch (error) {
      console.error("Upload error", error);
      window.alert(`🚨 Image Upload Failed!\n\nAppwrite says: "${error.message}"\n\nDid you forget to add the "Users" role in the Storage Bucket Permissions?`);
    }

    setUploading(false);
    if (onUploading) onUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {value ? (
        <div style={{ position: "relative" }}>
          <img src={value} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: `2px solid ${C.border}` }} alt="Preview" />
          <button onClick={() => onChange("")} style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      ) : (
        <div onClick={() => !uploading && fileRef.current.click()} style={{ width: 64, height: 64, borderRadius: 8, background: C.surface3, border: `1px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", transition: "all 0.2s" }} onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = C.brand)}>
          {uploading ? <Spinner size={16} /> : <span style={{ fontSize: 20, color: C.muted }}>↑</span>}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Input value={uploading ? "Uploading image... please wait" : value} onChange={e => onChange(e.target.value)} placeholder="Or paste Image URL..." disabled={uploading} />
      </div>
      <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} accept="image/*" />
    </div>
  );
}

function MultiImageUpload({ value = [], onChange, onUploading, bucket = "services" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    if (onUploading) onUploading(true);

    try {
      const newUrls = await Promise.all(
        files.map(async (file) => {
          const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
          return storage.getFileView(BUCKET_ID, result.$id);
        })
      );
      onChange([...(Array.isArray(value) ? value : []), ...newUrls]);
    } catch (error) {
      console.error("Upload error", error);
      window.alert(`🚨 Image Upload Failed!\n\nAppwrite says: "${error.message}"`);
    }

    setUploading(false);
    if (onUploading) onUploading(false);
  };

  const removeImage = (idx) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {Array.isArray(value) && value.map((url, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={url} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: `2px solid ${C.border}` }} alt="Preview" />
          <button onClick={() => removeImage(i)} style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      ))}
      <div onClick={() => !uploading && fileRef.current.click()} style={{ width: 80, height: 80, borderRadius: 8, background: C.surface3, border: `1px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", transition: "all 0.2s" }} onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = C.brand)}>
        {uploading ? <Spinner size={20} /> : <span style={{ fontSize: 24, color: C.muted }}>＋</span>}
      </div>
      <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} accept="image/*" multiple />
    </div>
  );
}

function VideoUpload({ value, onChange, onUploading }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    if (onUploading) onUploading(true);

    try {
      const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const url = storage.getFileView(BUCKET_ID, result.$id);
      onChange(url);
    } catch (error) {
      console.error("Upload error", error);
      window.alert(`🚨 Video Upload Failed!\n\nAppwrite says: "${error.message}"\n\nDid you forget to add the "Users" role in the Storage Bucket Permissions?`);
    }

    setUploading(false);
    if (onUploading) onUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {value ? (
        <div style={{ position: "relative" }}>
          {value.toLowerCase().endsWith(".mp4") ? (
            <video src={value} style={{ width: 120, height: 64, borderRadius: 8, objectFit: "cover", border: `2px solid ${C.border}` }} muted />
          ) : (
            <div style={{ width: 120, height: 64, borderRadius: 8, background: C.surface3, border: `2px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color: C.muted, fontSize: 10 }}>URL Set</div>
          )}
          <button onClick={() => onChange("")} style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      ) : (
        <div onClick={() => !uploading && fileRef.current.click()} style={{ width: 120, height: 64, borderRadius: 8, background: C.surface3, border: `1px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", transition: "all 0.2s" }} onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = C.brand)}>
          {uploading ? <Spinner size={16} /> : <span style={{ fontSize: 20, color: C.muted }}>↑</span>}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Input value={uploading ? "Uploading video... please wait" : value} onChange={e => onChange(e.target.value)} placeholder="Or paste YouTube/Vimeo/mp4 URL..." disabled={uploading} />
      </div>
      <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} accept="video/*" />
    </div>
  );
}

function PreviewModal({ type, data, onClose }) {
  const iframeRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: "PREVIEW_DATA", dataType: type, data }, "http://localhost:5173");
      }
    }, 1000); // Give iframe time to load
    return () => clearTimeout(timer);
  }, [type, data]);

  return (
    <Modal title="Live Preview" subtitle="See how it looks on the site before saving" onClose={onClose} wide>
      <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, height: 500, position: "relative" }}>
        <iframe ref={iframeRef} src={`http://localhost:5173?preview=true&type=${type}`} style={{ width: "100%", height: "100%", border: "none" }} title="Preview" />
        <div style={{ position: "absolute", bottom: 12, right: 12, background: C.brand, color: "#fff", borderRadius: 100, padding: "4px 12px", fontSize: 10, fontWeight: 700, pointerEvents: "none" }}>PREVIEW MODE</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Btn variant="ghost" onClick={onClose}>Close Preview</Btn>
      </div>
    </Modal>
  );
}

// Schema SQL Modal removed for Appwrite

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "services", icon: "◈", label: "Services" },
  { id: "portfolio", icon: "⊡", label: "Portfolio" },
  { id: "blog", icon: "⊞", label: "Blog Posts" },
  { id: "team", icon: "◎", label: "Team" },
  { id: "clients", icon: "▣", label: "Clients" },
  { id: "testimonials", icon: "✪", label: "Testimonials" },
  { id: "messages", icon: "◻", label: "Messages" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

function Sidebar({ active, setActive, unread, onSignOut }) {
  return (
    <aside style={{
      width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", top: 0, left: 0, zIndex: 50
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <Logo size={22} glow />
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginTop: 5, paddingLeft: 1 }}>Admin Console</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
                borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 1, textAlign: "left",
                background: isActive ? C.brandGlow : "transparent",
                color: isActive ? C.brand : C.muted,
                fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "all 0.12s"
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surface2; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === "messages" && unread > 0 && (
                <span style={{ background: C.brand, color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 10px 16px", borderTop: `1px solid ${C.border}` }}>
        <a href="https://bozon.dev" target="_blank" rel="noopener noreferrer"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: "none", cursor: "pointer", background: "transparent", color: C.brand, fontSize: 13, transition: "all 0.12s", marginBottom: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = C.brandGlow}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span>🌐</span> View Website
        </a>
        <button onClick={onSignOut}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: "none", cursor: "pointer", background: "transparent", color: C.muted, fontSize: 13, transition: "all 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#F87171"}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          <span>⏏</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

function SetupBanner({ onShowSchema }) {
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "0px", marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ color: C.muted, fontSize: 13 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, style: xStyle = {}, noPad = false }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", ...xStyle }}>
      {noPad ? children : <div style={{ padding: 24 }}>{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA TABLE
// ─────────────────────────────────────────────────────────────────────────────
function DataTable({ headers, rows, loading }) {
  if (loading) return <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div>;
  if (rows.length === 0) return null;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "10px 16px",
                textAlign: h === "Actions" ? "center" : "left",
                fontSize: 10, color: C.muted2,
                letterSpacing: "1.5px", textTransform: "uppercase",
                fontWeight: 600, whiteSpace: "nowrap",
                width: h === "Actions" ? 180 : "auto"
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="row-hover" style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "13px 16px",
                  verticalAlign: "middle",
                  textAlign: headers[j] === "Actions" ? "center" : "left"
                }}>
                  {headers[j] === "Actions" ? (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{cell}</div>
                  ) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useToast hook
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  }, []);
  return [toast, show];
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ counts, setTab }) {
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    const loadWeek = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);
      try {
        const result = await databases.listDocuments(DB_ID, "contact_submissions", [
          Query.greaterThanEqual("$createdAt", since.toISOString())
        ]);
        const data = result.documents;
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          return { label: d.toLocaleDateString("en-US", { weekday: "short" }), date: d.toDateString(), count: 0 };
        });
        data.forEach(r => { const ds = new Date(r.$createdAt).toDateString(); const day = days.find(d => d.date === ds); if (day) day.count++; });
        setWeekData(days);
      } catch (err) {
        console.error(err);
      }
    };
    loadWeek();
  }, []);

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  const stats = [
    { label: "Services", value: counts.services, icon: "◈", color: C.brand, tab: "services" },
    { label: "Portfolio", value: counts.portfolio, icon: "⊡", color: "#A78BFA", tab: "portfolio" },
    { label: "Blog Posts", value: counts.blog, icon: "⊞", color: "#34D399", tab: "blog" },
    { label: "Team Members", value: counts.team, icon: "◎", color: "#60A5FA", tab: "team" },
    { label: "Clients", value: counts.clients, icon: "▣", color: "#F472B6", tab: "clients" },
    { label: "Testimonials", value: counts.testimonials, icon: "✪", color: "#FBBF24", tab: "testimonials" },
    { label: "Unread Messages", value: counts.unread, icon: "◻", color: counts.unread > 0 ? "#FCD34D" : C.muted, tab: "messages" },
  ];
  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <PageHeader title="Dashboard" subtitle={`Welcome back — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <button key={i} onClick={() => setTab(s.tab)}
            style={{ 
              background: "rgba(255,255,255,0.03)", 
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: `1px solid ${C.border}`, 
              borderRadius: 14, 
              padding: "24px 20px 22px", 
              textAlign: "left", 
              cursor: "pointer", 
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.borderColor = s.color + "90"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.transform = "translateY(-5px)"; 
              e.currentTarget.style.boxShadow = `0 15px 30px -10px ${s.color}30`;
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.borderColor = C.border; 
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.transform = "translateY(0)"; 
              e.currentTarget.style.boxShadow = "none";
            }}>
            <div style={{ 
              position: "absolute", top: -20, right: -20, fontSize: 60, opacity: 0.05, color: s.color, transform: "rotate(15deg)", pointerEvents: "none" 
            }}>{s.icon}</div>
            <div style={{ fontSize: 24, color: s.color, marginBottom: 16 }}>{s.icon}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, letterSpacing: "0.2px" }}>{s.label.toUpperCase()}</div>
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>📨 Messages — Last 7 Days</h3>
          <button onClick={() => setTab("messages")} style={{ background: "none", border: "none", color: C.brand, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>View all →</button>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
          {weekData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: d.count > 0 ? C.brand : "transparent", fontWeight: 700 }}>{d.count}</div>
              <div style={{
                width: "100%", minHeight: 4,
                height: `${Math.max((d.count / maxCount) * 52, d.count > 0 ? 8 : 4)}px`,
                background: d.count > 0 ? `linear-gradient(to top, ${C.brand}, #FFB347)` : C.surface2,
                borderRadius: "4px 4px 0 0", transition: "height 0.5s ease",
              }} />
              <div style={{ fontSize: 10, color: C.muted2 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card noPad>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>Quick Actions</h3>
        </div>
        <div style={{ padding: "16px 22px", display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "＋ Add Service", tab: "services" },
            { label: "＋ New Case Study", tab: "portfolio" },
            { label: "＋ Write Blog Post", tab: "blog" },
            { label: "＋ Add Team Member", tab: "team" },
            { label: "✉ View Messages", tab: "messages" },
          ].map((a, i) => (
            <button key={i} onClick={() => setTab(a.tab)}
              style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 16px", fontSize: 12, color: C.muted, cursor: "pointer", fontWeight: 500, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.brand; e.currentTarget.style.borderColor = C.brand + "50"; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
              {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_SERVICE = { icon: "", title: "", subtitle: "", description: "", items: "", visible: true, sort_order: 0, gallery: [] };

function ServicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | item
  const [form, setForm] = useState(BLANK_SERVICE);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "services", [Query.orderAsc("sort_order"), Query.limit(100)]);
      setData(response.documents);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target ? e.target.value : e }));

  const openAdd = () => { setForm({ ...BLANK_SERVICE }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item, items: Array.isArray(item.items) ? item.items.join(", ") : item.items || "" }); setModal(item); };

  const doSave = async () => {
    if (!form.title.trim()) return;
    if (form.sort_order < 0) { show("Sort order must be 0 or greater", "error"); return; }
    setSaving(true);
    const payload = {
      ...form,
      sort_order: parseInt(form.sort_order) || 0,
      items: form.items ? form.items.split(",").map(s => s.trim()).filter(Boolean) : []
    };
    delete payload.$id; delete payload.$createdAt; delete payload.$updatedAt; delete payload.$databaseId; delete payload.$collectionId; delete payload.$permissions;
    const isNew = modal === "add";

    try {
      if (isNew) {
        const result = await databases.createDocument(DB_ID, "services", ID.unique(), payload);
        show("Service added!");
        logActivity("CREATE", "service", result.$id, { title: form.title });
      } else {
        const result = await databases.updateDocument(DB_ID, "services", modal.$id, payload);
        show("Service updated!");
        logActivity("UPDATE", "service", modal.$id, { title: form.title });
      }
      load(); setModal(null);
    } catch (err) {
      show("Error saving service: " + err.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async (id) => {
    try {
      await databases.deleteDocument(DB_ID, "services", id);
      logActivity("DELETE", "service", id, { title: data.find(s => s.$id === id)?.title });
      show("Deleted."); load();
      setConfirm(null);
    } catch (err) {
      show("Delete failed", "error");
    }
  };

  const toggleVisible = async (item) => {
    await databases.updateDocument(DB_ID, "services", item.$id, { visible: !item.visible });
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      {confirm && <ConfirmDialog msg={`Delete "${confirm.title}"? This cannot be undone.`} onConfirm={() => doDelete(confirm.$id)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Services" subtitle={`${data.length} services · ${data.filter(s => s.visible).length} visible`}
        action={<Btn onClick={openAdd}>＋ Add Service</Btn>} />

      <Card noPad>
        {loading ? <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div>
          : data.length === 0 ? <EmptyState icon="◈" title="No services yet" sub="Add your first service to get started." action={<Btn onClick={openAdd}>＋ Add Service</Btn>} />
            : <DataTable loading={false} headers={["Icon", "Title", "Subtitle", "Order", "Visible", "Actions"]}
              rows={data.map(s => [
                <span style={{ fontSize: 22 }}>{s.icon}</span>,
                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</span>,
                <span style={{ color: C.muted, fontSize: 12 }}>{s.subtitle}</span>,
                <span style={{ color: C.muted2, fontSize: 12 }}>#{s.sort_order}</span>,
                <Toggle value={s.visible} onChange={() => toggleVisible(s)} />,
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => setConfirm(s)}>Delete</Btn>
                </div>
              ])} />
        }
      </Card>

      {modal !== null && (
        <Modal title={modal === "add" ? "Add Service" : "Edit Service"} onClose={() => setModal(null)}>
          <Field label="Icon Emoji" required><Input value={form.icon} onChange={f("icon")} placeholder="🌐" /></Field>
          <Field label="Title" required><Input value={form.title} onChange={f("title")} placeholder="Website Design & Development" /></Field>
          <Field label="Subtitle"><Input value={form.subtitle} onChange={f("subtitle")} placeholder="Corporate · E-commerce · Custom Apps" /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={f("description")} placeholder="Short description shown on services page..." /></Field>
          <Field label="Animated Gallery Images" hint="Click to upload multiple images"><MultiImageUpload value={form.gallery} onChange={f("gallery")} onUploading={setSaving} /></Field>
          <Field label="Items / Tags" hint="Comma separated"><Textarea rows={2} value={form.items} onChange={f("items")} placeholder="Corporate Websites, E-commerce, Custom Apps" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={f("sort_order")} placeholder="0" /></Field>
            <Field label="Visible">
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
                <Toggle value={form.visible} onChange={v => setForm(p => ({ ...p, visible: v }))} />
                <span style={{ fontSize: 13, color: C.muted }}>{form.visible ? "Shown on site" : "Hidden"}</span>
              </div>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doSave} loading={saving}>{modal === "add" ? "Add Service" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_PORTFOLIO = { title: "", category: "", year: new Date().getFullYear().toString(), problem: "", strategy: "", execution: "", results: "", visible: true };

function PortfolioPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_PORTFOLIO);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "portfolio", [Query.orderDesc("$createdAt"), Query.limit(100)]);
      setData(response.documents);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target ? e.target.value : e }));
  const openAdd = () => { setForm({ ...BLANK_PORTFOLIO }); setModal("add"); };
  const openEdit = item => { setForm({ ...item }); setModal(item); };

  const doSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form };
    delete payload.$id; delete payload.$createdAt; delete payload.$updatedAt; delete payload.$databaseId; delete payload.$collectionId; delete payload.$permissions;
    const isNew = modal === "add";

    try {
      if (isNew) {
        const result = await databases.createDocument(DB_ID, "portfolio", ID.unique(), payload);
        show("Case study added!");
        logActivity("CREATE", "portfolio", result.$id, { title: form.title });
      } else {
        const result = await databases.updateDocument(DB_ID, "portfolio", modal.$id, payload);
        show("Case study updated!");
        logActivity("UPDATE", "portfolio", modal.$id, { title: form.title });
      }
      load(); setModal(null);
    } catch (err) {
      show("Error saving portfolio: " + err.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async id => {
    try {
      await databases.deleteDocument(DB_ID, "portfolio", id);
      logActivity("DELETE", "portfolio", id, { title: data.find(p => p.$id === id)?.title });
      show("Deleted."); load(); setConfirm(null);
    } catch (err) {
      show("Delete failed", "error");
    }
  };

  const toggleVisible = async item => {
    await databases.updateDocument(DB_ID, "portfolio", item.$id, { visible: !item.visible });
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      {confirm && <ConfirmDialog msg={`Delete "${confirm.title}"?`} onConfirm={() => doDelete(confirm.$id)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Portfolio" subtitle={`${data.length} case studies · ${data.filter(p => p.visible).length} visible`}
        action={<Btn onClick={openAdd}>＋ New Case Study</Btn>} />

      <Card noPad>
        {loading ? <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div>
          : data.length === 0 ? <EmptyState icon="⊡" title="No case studies yet" sub="Showcase your best work." action={<Btn onClick={openAdd}>＋ Add Case Study</Btn>} />
            : <DataTable loading={false} headers={["Title", "Category", "Year", "Visible", "Actions"]}
              rows={data.map(p => [
                <span style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</span>,
                <Badge variant="brand">{p.category || "—"}</Badge>,
                <span style={{ color: C.muted }}>{p.year}</span>,
                <Toggle value={p.visible} onChange={() => toggleVisible(p)} />,
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => setConfirm(p)}>Delete</Btn>
                </div>
              ])} />
        }
      </Card>

      {modal !== null && (
        <Modal title={modal === "add" ? "New Case Study" : "Edit Case Study"} onClose={() => setModal(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Project Title" required style={{ gridColumn: "1 / -1" }}><Input value={form.title} onChange={f("title")} placeholder="Project Name" /></Field>
            <Field label="Category"><Input value={form.category} onChange={f("category")} placeholder="Web Development" /></Field>
            <Field label="Year"><Input value={form.year} onChange={f("year")} placeholder="2025" /></Field>
            <Field label="Visible">
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                <Toggle value={form.visible} onChange={v => setForm(p => ({ ...p, visible: v }))} />
                <span style={{ fontSize: 12, color: C.muted }}>{form.visible ? "Published" : "Hidden"}</span>
              </div>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="The Problem"><RichTextEditor value={form.problem} onChange={v => setForm(p => ({ ...p, problem: v }))} placeholder="The challenge..." /></Field>
            <Field label="Our Strategy"><RichTextEditor value={form.strategy} onChange={v => setForm(p => ({ ...p, strategy: v }))} placeholder="The approach..." /></Field>
            <Field label="Execution"><RichTextEditor value={form.execution} onChange={v => setForm(p => ({ ...p, execution: v }))} placeholder="How it was built..." /></Field>
            <Field label="Results"><RichTextEditor value={form.results} onChange={v => setForm(p => ({ ...p, results: v }))} placeholder="The outcome..." /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <Btn variant="outline" onClick={() => setPreview(form)}>👁 Preview Case Study</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doSave} loading={saving}>{modal === "add" ? "Add Case Study" : "Save"}</Btn>
          </div>
        </Modal>
      )}
      {preview && <PreviewModal type="portfolio" data={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_BLOG = { title: "", category: "", excerpt: "", content: "", published: false, published_at: null };

function BlogPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_BLOG);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "blog_posts", [Query.orderDesc("$createdAt"), Query.limit(100)]);
      setData(response.documents);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target ? e.target.value : e }));
  const openAdd = () => { setForm({ ...BLANK_BLOG }); setModal("add"); };
  const openEdit = item => { setForm({ ...item }); setModal(item); };

  const doSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, published_at: form.published ? (form.published_at || new Date().toISOString()) : null };
    delete payload.$id; delete payload.$createdAt; delete payload.$updatedAt; delete payload.$databaseId; delete payload.$collectionId; delete payload.$permissions;
    const isNew = modal === "add";

    try {
      if (isNew) {
        const result = await databases.createDocument(DB_ID, "blog_posts", ID.unique(), payload);
        show("Post created!");
        logActivity("CREATE", "blog_post", result.$id, { title: form.title });
      } else {
        const result = await databases.updateDocument(DB_ID, "blog_posts", modal.$id, payload);
        show("Post updated!");
        logActivity("UPDATE", "blog_post", modal.$id, { title: form.title });
      }
      load(); setModal(null);
    } catch (err) {
      show("Error saving post: " + err.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async id => {
    try {
      await databases.deleteDocument(DB_ID, "blog_posts", id);
      logActivity("DELETE", "blog_post", id, { title: data.find(b => b.$id === id)?.title });
      show("Deleted."); load(); setConfirm(null);
    } catch (err) {
      show("Delete failed", "error");
    }
  };

  const togglePublish = async item => {
    await databases.updateDocument(DB_ID, "blog_posts", item.$id, { published: !item.published, published_at: !item.published ? new Date().toISOString() : null });
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      {confirm && <ConfirmDialog msg={`Delete "${confirm.title}"?`} onConfirm={() => doDelete(confirm.$id)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Blog Posts" subtitle={`${data.length} posts · ${data.filter(b => b.published).length} published`}
        action={<Btn onClick={openAdd}>＋ New Post</Btn>} />

      <Card noPad>
        {loading ? <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div>
          : data.length === 0 ? <EmptyState icon="⊞" title="No blog posts yet" sub="Share insights and grow your audience." action={<Btn onClick={openAdd}>＋ Write First Post</Btn>} />
            : <DataTable loading={false} headers={["Title", "Category", "Created", "Status", "Actions"]}
              rows={data.map(b => [
                <span style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</span>,
                <span style={{ color: C.muted, fontSize: 12 }}>{b.category || "—"}</span>,
                <span style={{ color: C.muted, fontSize: 12 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</span>,
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle value={b.published} onChange={() => togglePublish(b)} />
                  <Badge variant={b.published ? "green" : "gray"}>{b.published ? "Published" : "Draft"}</Badge>
                </div>,
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(b)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => setConfirm(b)}>Delete</Btn>
                </div>
              ])} />
        }
      </Card>

      {modal !== null && (
        <Modal title={modal === "add" ? "New Blog Post" : "Edit Post"} onClose={() => setModal(null)} wide>
          <Field label="Title" required><Input value={form.title} onChange={f("title")} placeholder="Post Title" /></Field>
          <Field label="Category"><Input value={form.category} onChange={f("category")} placeholder="Design, Technology, Business..." /></Field>
          <Field label="Excerpt" hint="Shown in listings"><Textarea rows={2} value={form.excerpt} onChange={f("excerpt")} placeholder="A brief summary of the post..." /></Field>
          <Field label="Content"><RichTextEditor value={form.content} onChange={v => setForm(p => ({ ...p, content: v }))} placeholder="Write your full blog post content here..." /></Field>
          <Field label="Publish">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Toggle value={form.published} onChange={v => setForm(p => ({ ...p, published: v }))} />
              <span style={{ fontSize: 13, color: C.muted }}>{form.published ? "Will be published immediately" : "Save as draft"}</span>
            </div>
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <Btn variant="outline" onClick={() => setPreview(form)}>👁 Preview</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doSave} loading={saving}>{modal === "add" ? "Create Post" : "Save Post"}</Btn>
          </div>
        </Modal>
      )}
      {preview && <PreviewModal type="blog" data={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_TEAM = { name: "", role: "", initials: "", bio: "", image_url: "", visible: true, sort_order: 0 };

function TeamPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_TEAM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "team_members", [Query.orderAsc("sort_order"), Query.limit(100)]);
      setData(response.documents);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target ? e.target.value : e }));
  const openAdd = () => { setForm({ ...BLANK_TEAM }); setModal("add"); };
  const openEdit = item => { setForm({ ...item }); setModal(item); };

  const doSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      role: form.role || "",
      initials: form.initials || "",
      bio: form.bio || "",
      image_url: form.image_url || "",
      sort_order: Number(form.sort_order) || 0,
      visible: form.visible !== false
    };
    const isNew = modal === "add";

    try {
      if (isNew) {
        const result = await databases.createDocument(DB_ID, "team_members", ID.unique(), payload);
        show("Member added!");
        logActivity("CREATE", "team_member", result.$id, { name: form.name });
      } else {
        const result = await databases.updateDocument(DB_ID, "team_members", modal.$id, payload);
        show("Updated!");
        logActivity("UPDATE", "team_member", modal.$id, { name: form.name });
      }
      load(); setModal(null);
    } catch (err) {
      show("Error saving team member: " + err.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async id => {
    try {
      await databases.deleteDocument(DB_ID, "team_members", id);
      logActivity("DELETE", "team_member", id, { name: data.find(t => t.$id === id)?.name });
      show("Deleted."); load(); setConfirm(null);
    } catch (err) {
      show("Delete failed", "error");
    }
  };

  const toggleVisible = async item => {
    await databases.updateDocument(DB_ID, "team_members", item.$id, { visible: !item.visible });
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      {confirm && <ConfirmDialog msg={`Remove "${confirm.name}" from the team?`} onConfirm={() => doDelete(confirm.$id)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Team Members" subtitle={`${data.length} members · ${data.filter(t => t.visible).length} visible`}
        action={<Btn onClick={openAdd}>＋ Add Member</Btn>} />

      {loading ? <Card><div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={24} /></div></Card>
        : data.length === 0 ? <Card><EmptyState icon="◎" title="No team members yet" sub="Add your leadership and team." action={<Btn onClick={openAdd}>＋ Add Member</Btn>} /></Card>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {data.map(t => (
              <div key={t.$id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Image Container */}
                <div style={{ padding: 12, paddingBottom: 0 }}>
                  {t.image_url ? (
                    <img src={t.image_url} alt={t.name} style={{ width: "100%", aspectRatio: "4/5", borderRadius: 10, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 10, background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 32, color: "#fff" }}>
                      {t.initials || (t.name ? t.name.slice(0, 2).toUpperCase() : "?")}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: "20px 20px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.text }}>{t.name}</div>
                    <div style={{ color: C.brand, fontSize: 13, fontWeight: 600 }}>{t.role}</div>
                  </div>

                  {t.bio && (
                    <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                      {t.bio}
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: t.bio ? 0 : "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={t.visible} onChange={() => toggleVisible(t)} />
                      <span style={{ fontSize: 11, color: C.muted2 }}>Visible</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn size="sm" variant="ghost" onClick={() => openEdit(t)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setConfirm(t)}>Delete</Btn>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      {modal !== null && (
        <Modal title={modal === "add" ? "Add Team Member" : "Edit Member"} onClose={() => setModal(null)}>
          <Field label="Full Name" required><Input value={form.name} onChange={f("name")} placeholder="Full Name" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <Field label="Role / Title"><Input value={form.role} onChange={f("role")} placeholder="Founder & CEO" /></Field>
            <Field label="Initials"><Input value={form.initials} onChange={f("initials")} placeholder="BC" /></Field>
          </div>
          <Field label="Bio"><Textarea rows={3} value={form.bio} onChange={f("bio")} placeholder="Short biography..." /></Field>
          <Field label="Team Photo"><ImageUpload value={form.image_url} onChange={v => setForm(p => ({ ...p, image_url: v }))} onUploading={setUploadingImage} bucket="team" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={f("sort_order")} placeholder="0" /></Field>
            <Field label="Visibility">
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                <Toggle value={form.visible} onChange={v => setForm(p => ({ ...p, visible: v }))} />
                <span style={{ fontSize: 13, color: C.muted }}>{form.visible ? "Shown on site" : "Hidden"}</span>
              </div>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doSave} loading={saving || uploadingImage} disabled={uploadingImage}>{uploadingImage ? "Uploading Image..." : modal === "add" ? "Add Member" : "Save"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES / CONTACT SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
function MessagesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "contact_submissions", [Query.orderDesc("$createdAt"), Query.limit(100)]);
      setData(response.documents);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async id => {
    await databases.updateDocument(DB_ID, "contact_submissions", id, { read: true });
    setData(d => d.map(m => m.$id === id ? { ...m, read: true } : m));
  };

  const doDelete = async id => {
    const m = data.find(x => x.$id === id);
    await databases.deleteDocument(DB_ID, "contact_submissions", id);
    logActivity("DELETE", "contact_submission", id, { name: m?.name, email: m?.email });
    show("Deleted."); load(); setActive(null); setConfirm(null);
  };

  const markAllRead = async () => {
    await Promise.all(data.filter(m => !m.read).map(m => databases.updateDocument(DB_ID, "contact_submissions", m.$id, { read: true })));
    load(); show("All marked as read.");
  };

  const msg = active ? data.find(m => m.$id === active) : null;
  const unread = data.filter(m => !m.read).length;

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      {confirm && <ConfirmDialog msg="Delete this message? This cannot be undone." onConfirm={() => doDelete(confirm)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Messages" subtitle={`${unread} unread · ${data.length} total`}
        action={unread > 0 ? <Btn variant="ghost" onClick={markAllRead}>Mark All Read</Btn> : null} />

      <div style={{ display: "grid", gridTemplateColumns: active ? "320px 1fr" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Inbox list */}
        <Card noPad>
          {loading ? <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div>
            : data.length === 0 ? <EmptyState icon="◻" title="No messages yet" sub="Contact form submissions will appear here." />
              : data.map(m => (
                <div key={m.$id}
                  onClick={() => { setActive(m.$id); if (!m.read) markRead(m.$id); }}
                  style={{
                    padding: "16px 18px", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                    background: active === m.$id ? C.surface2 : "transparent",
                    borderLeft: !m.read ? `2px solid ${C.brand}` : "2px solid transparent",
                    transition: "background 0.12s"
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 3 }}>
                    <span style={{ fontWeight: m.read ? 500 : 700, fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: C.muted2, flexShrink: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{m.email}</div>
                  {m.service && <Badge variant="brand">{m.service}</Badge>}
                  <div style={{ fontSize: 12, color: C.muted2, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.message}</div>
                </div>
              ))
          }
        </Card>

        {/* Message detail */}
        {msg && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{msg.name}</h3>
                <a href={`mailto:${msg.email}`} style={{ color: C.brand, fontSize: 13 }}>{msg.email}</a>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{msg.created_at ? new Date(msg.created_at).toLocaleString() : "—"}</div>
              </div>
              <Btn size="sm" variant="danger" onClick={() => setConfirm(msg.$id)}>Delete</Btn>
            </div>
            {msg.service && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "1px" }}>Service Requested: </span>
                <Badge variant="brand">{msg.service}</Badge>
              </div>
            )}
            <div style={{ background: C.surface2, borderRadius: 8, padding: "16px 18px", fontSize: 15, lineHeight: 1.8, color: "rgba(245,245,245,0.85)", whiteSpace: "pre-wrap", marginBottom: 22 }}>
              {msg.message}
            </div>
            <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}&su=${encodeURIComponent(`Re: Your inquiry to bozon.dev`)}&body=${encodeURIComponent(`\n\n--- Original Message ---\nFrom: ${msg.name}\n\n${msg.message.length > 500 ? msg.message.substring(0, 500) + "..." : msg.message}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.brand, color: "#fff", borderRadius: 7, padding: "11px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.15s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              ✉ Reply via Gmail
            </a>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const attempt = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      const session = await account.createEmailPasswordSession(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    }
    setLoading(false);
  };

  const sendReset = async () => {
    if (!email) { setError("Enter your email first."); return; }
    setResetLoading(true); setError("");
    try {
      await account.createRecovery(email, window.location.origin);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
    setResetLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Logo size={36} glow />
          <div style={{ color: C.muted, fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", marginTop: 8 }}>Admin Console</div>
        </div>

        {/* Form */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 32px 28px" }}>
          {resetSent ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>We sent a password reset link to <strong style={{ color: C.text }}>{email}</strong>.</p>
              <button onClick={() => { setResetMode(false); setResetSent(false); }} style={{ marginTop: 20, background: "none", border: "none", color: C.brand, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Back to Sign In</button>
            </div>
          ) : resetMode ? (
            <>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Reset Password</h2>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>We'll send a reset link to your email.</p>
              <Field label="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bozon.dev" /></Field>
              {error && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 16, background: C.dangerBg, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 6, padding: "9px 12px" }}>{error}</div>}
              <Btn onClick={sendReset} loading={resetLoading} style={{ width: "100%", justifyContent: "center" }} size="lg">Send Reset Link</Btn>
              <button onClick={() => { setResetMode(false); setError(""); }} style={{ display: "block", width: "100%", marginTop: 14, background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>← Back to Sign In</button>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>Use your Supabase Auth credentials.</p>
              <Field label="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bozon.dev" /></Field>
              <Field label="Password">
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && attempt()} />
              </Field>
              <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
                <button onClick={() => { setResetMode(true); setError(""); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>Forgot password?</button>
              </div>
              {error && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 16, background: C.dangerBg, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 6, padding: "9px 12px" }}>{error}</div>}
              <Btn onClick={attempt} loading={loading} disabled={!email || !password} style={{ width: "100%", justifyContent: "center" }} size="lg">
                Sign In
              </Btn>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: C.muted2, fontSize: 12, marginTop: 20 }}>
          Create users in your{" "}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: C.muted }}>Supabase dashboard</a>{" "}
          under Authentication → Users.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [form, setForm] = useState({ showreel_url: "", showreel_title: "2025 Showreel", showreel_subtitle: "Coming Soon" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, show] = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await databases.listDocuments(DB_ID, "settings");
        if (response.documents) {
          const map = Object.fromEntries(response.documents.map(r => [r.key, r.value]));
          setForm(f => ({
            showreel_url: map.showreel_url || "",
            showreel_title: map.showreel_title || "2025 Showreel",
            showreel_subtitle: map.showreel_subtitle || "Coming Soon",
          }));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(form).map(async ([key, value]) => {
        try {
          // To upsert, try fetching first
          const exists = await databases.listDocuments(DB_ID, "settings", [Query.equal("key", key)]);
          if (exists.documents.length > 0) {
            await databases.updateDocument(DB_ID, "settings", exists.documents[0].$id, { key, value });
          } else {
            await databases.createDocument(DB_ID, "settings", ID.unique(), { key, value });
          }
        } catch (e) { console.error(e) }
      });
      await Promise.all(updates);
      show("Settings saved!");
    } catch (err) {
      show("Failed to save settings: " + err.message, "error");
    }
    setSaving(false);
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <Toast msg={toast.msg} type={toast.type} />
      <PageHeader title="Settings" subtitle="Manage global site configuration" />

      <Card>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🎬 Showreel Video</h3>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          Paste a <strong style={{ color: C.text }}>YouTube link</strong>, <strong style={{ color: C.text }}>Vimeo link</strong>, or a{" "}
          <strong style={{ color: C.text }}>direct .mp4 URL</strong>. Leave blank to show the "Coming Soon" placeholder.
        </p>

        {loading ? <Spinner /> : (
          <>
            <Field label="Showreel Video URL" hint="Upload .mp4 file or paste YouTube/Vimeo link">
              <VideoUpload value={form.showreel_url} onChange={v => setForm(p => ({ ...p, showreel_url: v }))} onUploading={setSaving} />
            </Field>

            {form.showreel_url && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: C.muted }}>
                ✓ URL set — the play button on the Services page will open this video.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Video Label" hint="Shown below the play button">
                <Input value={form.showreel_title} onChange={f("showreel_title")} placeholder="2025 Showreel" />
              </Field>
              <Field label="Subtitle / Status" hint="e.g. Coming Soon or Watch Now">
                <Input value={form.showreel_subtitle} onChange={f("showreel_subtitle")} placeholder="Coming Soon" />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <Btn onClick={save} loading={saving}>Save Settings</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ClientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", item?:obj }
  const [form, setForm] = useState({ name: "", logo_url: "", website_url: "", sort_order: 0, visible: true });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, showToast] = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "clients", [Query.orderAsc("sort_order"), Query.limit(100)]);
      setItems(response.documents);
    } catch (error) {
      console.error("clients load:", error); showToast("Failed to load clients: " + error.message, "error");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: "", logo_url: "", website_url: "", sort_order: items.length, visible: true }); setModal({ mode: "add" }); };
  const openEdit = (item) => { setForm({ name: item.name, logo_url: item.logo_url || "", website_url: item.website_url || "", sort_order: item.sort_order ?? 0, visible: item.visible !== false }); setModal({ mode: "edit", item }); };

  const doSave = async () => {
    if (!form.name.trim() || uploadingImage) return showToast("Name is required", "error");
    setSaving(true);
    const payload = { name: form.name.trim(), logo_url: form.logo_url.trim() || "", website_url: form.website_url.trim() || "", sort_order: Number(form.sort_order) || 0, visible: form.visible };

    try {
      if (modal.mode === "add") {
        const result = await databases.createDocument(DB_ID, "clients", ID.unique(), payload);
        logActivity("CREATE", "client", result.$id, { name: form.name });
        showToast("Client added!");
      } else {
        const result = await databases.updateDocument(DB_ID, "clients", modal.item.$id, payload);
        logActivity("UPDATE", "client", modal.item.$id, { name: form.name });
        showToast("Client updated!");
      }
      setModal(null);
      load();
    } catch (error) {
      showToast("Save failed: " + error.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async (item) => {
    try {
      await databases.deleteDocument(DB_ID, "clients", item.$id);
      logActivity("DELETE", "client", item.$id, { name: item.name });
      showToast("Client removed");
      load();
      setConfirm(null);
    } catch (error) {
      console.error("Delete client error:", error);
      showToast("Delete failed: " + error.message, "error");
    }
  };

  const toggleVisible = async (item) => {
    try {
      await databases.updateDocument(DB_ID, "clients", item.$id, { visible: !item.visible });
      load();
    } catch (error) {
      showToast("Update failed", "error");
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {toast.msg && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog msg={`Delete "${confirm.name}"? This cannot be undone.`} onConfirm={() => doDelete(confirm)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Clients" subtitle="Logos shown on the website home page"
        action={<Btn onClick={openAdd}>+ Add Client</Btn>} />

      {loading ? <Card><div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={24} /></div></Card> :
        items.length === 0 ? (
          <Card>
            <EmptyState icon="🏢" title="No clients yet" sub="Add your first client logo to display on the home page." action={<Btn onClick={openAdd}>+ Add Client</Btn>} />
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {items.map((item) => (
              <div key={item.$id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 10px 20px -10px ${C.brand}40`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

                <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: C.surface2, padding: 30, position: "relative" }}>
                  {item.logo_url ? (
                    <img src={item.logo_url} alt={item.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }} />
                  ) : (
                    <div style={{ fontSize: 32, fontWeight: 800, color: C.muted2, opacity: 0.5 }}>{item.name.slice(0, 1).toUpperCase()}</div>
                  )}
                  <div style={{ position: "absolute", top: 12, right: 12, scale: "0.8", transformOrigin: "right top" }}>
                    <Toggle value={item.visible} onChange={() => toggleVisible(item)} />
                  </div>
                </div>

                <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    {item.website_url ? (
                      <a href={item.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.brand, textDecoration: "none", display: "inline-block", fontWeight: 600 }}>
                        {item.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: C.muted2 }}>No website link</span>
                    )}
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: C.surface3, padding: "2px 6px", borderRadius: 4, color: C.muted, letterSpacing: "0.5px" }}>#{item.sort_order ?? 0}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setConfirm(item)}>Delete</Btn>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Client" : "Edit Client"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Company Name *"><Input value={form.name} onChange={f("name")} placeholder="Acme Corp" /></Field>
            <Field label="Logo URL" hint="Upload logo or paste link">
              <ImageUpload value={form.logo_url} onChange={v => setForm(p => ({ ...p, logo_url: v }))} onUploading={setUploadingImage} bucket="team" />
            </Field>
            <Field label="Website URL"><Input value={form.website_url} onChange={f("website_url")} placeholder="https://example.com" /></Field>
            <Field label="Sort Order" hint="Lower = shown first"><Input type="number" value={form.sort_order} onChange={f("sort_order")} placeholder="0" /></Field>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="cl-visible" checked={form.visible} onChange={f("visible")} style={{ accentColor: C.brand, width: 15, height: 15 }} />
              <label htmlFor="cl-visible" style={{ fontSize: 13, cursor: "pointer" }}>Visible on website</label>
            </div>
            {form.logo_url && (
              <div style={{ padding: "12px 16px", background: C.surface3, borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <img src={form.logo_url} alt="preview" style={{ height: 36, maxWidth: 120, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                <span style={{ fontSize: 12, color: C.muted }}>Logo preview</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn onClick={doSave} loading={saving || uploadingImage} disabled={uploadingImage}>{uploadingImage ? "Uploading Logo..." : "Save Client"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ author: "", role: "", company: "", quote: "", rating: 5, photo_url: "", sort_order: 0, visible: true });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, showToast] = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, "testimonials", [Query.orderAsc("sort_order"), Query.limit(100)]);
      setItems(response.documents);
    } catch (error) {
      console.error("testimonials load:", error); showToast("Failed to load: " + error.message, "error");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ author: "", role: "", company: "", quote: "", rating: 5, photo_url: "", sort_order: items.length, visible: true }); setModal({ mode: "add" }); };
  const openEdit = (item) => { setForm({ author: item.author, role: item.role || "", company: item.company || "", quote: item.quote || "", rating: item.rating ?? 5, photo_url: item.photo_url || "", sort_order: item.sort_order ?? 0, visible: item.visible !== false }); setModal({ mode: "edit", item }); };

  const doSave = async () => {
    if (!form.author.trim() || !form.quote.trim() || uploadingImage) return showToast("Author and quote are required", "error");
    setSaving(true);
    const payload = { author: form.author.trim(), role: form.role.trim() || "", company: form.company.trim() || "", quote: form.quote.trim(), rating: Number(form.rating) || 5, photo_url: form.photo_url.trim() || "", sort_order: Number(form.sort_order) || 0, visible: form.visible };

    try {
      if (modal.mode === "add") {
        const result = await databases.createDocument(DB_ID, "testimonials", ID.unique(), payload);
        logActivity("CREATE", "testimonial", result.$id, { author: form.author });
        showToast("Testimonial added!");
      } else {
        const result = await databases.updateDocument(DB_ID, "testimonials", modal.item.$id, payload);
        logActivity("UPDATE", "testimonial", modal.item.$id, { author: form.author });
        showToast("Testimonial updated!");
      }
      setModal(null);
      load();
    } catch (error) {
      showToast("Save failed: " + error.message, "error");
    }
    setSaving(false);
  };

  const doDelete = async (item) => {
    try {
      await databases.deleteDocument(DB_ID, "testimonials", item.$id);
      logActivity("DELETE", "testimonial", item.$id, { author: item.author });
      showToast("Testimonial removed");
      load();
      setConfirm(null);
    } catch (error) {
      console.error("Delete testimonial error:", error);
      showToast("Delete failed: " + error.message, "error");
    }
  };

  const toggleVisible = async (item) => {
    try {
      await databases.updateDocument(DB_ID, "testimonials", item.$id, { visible: !item.visible });
      load();
    } catch (error) {
      showToast("Update failed", "error");
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {toast.msg && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog msg={`Delete testimonial from "${confirm.author}"? This cannot be undone.`} onConfirm={() => doDelete(confirm)} onCancel={() => setConfirm(null)} />}
      <PageHeader title="Testimonials" subtitle="Manage customer reviews and feedback"
        action={<Btn onClick={openAdd}>+ Add Testimonial</Btn>} />

      <Card noPad>
        {loading ? <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Spinner size={24} /></div> :
          items.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No testimonials yet</div>
              <div style={{ fontSize: 13 }}>Add client reviews to display on the website home page.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Author", "Quote", "Rating", "Company", "Visible", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: h === "Actions" ? "center" : "left", padding: "12px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: C.muted, fontWeight: 600, width: h === "Actions" ? 180 : "auto" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.$id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14 }}>
                      <div>{item.author}</div>
                      {item.role && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.role}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted, maxWidth: 260 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{item.quote}"</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>{"⭐".repeat(Math.min(item.rating || 5, 5))}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>{item.company || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => toggleVisible(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{item.visible !== false ? "👁" : "🙈"}</button>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Btn>
                        <Btn size="sm" variant="danger" onClick={() => setConfirm(item)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Testimonial" : "Edit Testimonial"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Author Name *"><Input value={form.author} onChange={f("author")} placeholder="Jane Smith" /></Field>
              <Field label="Rating" hint="1–5 stars">
                <select value={form.rating} onChange={f("rating")} style={{ width: "100%", background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", fontSize: 14, color: C.text, outline: "none" }}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Role / Title"><Input value={form.role} onChange={f("role")} placeholder="Marketing Director" /></Field>
              <Field label="Company"><Input value={form.company} onChange={f("company")} placeholder="Acme Corp" /></Field>
            </div>
            <Field label="Quote *"><Textarea value={form.quote} onChange={f("quote")} placeholder="Share what this client said about your work..." rows={4} /></Field>
            <Field label="Photo URL" hint="Upload headshot or paste link">
              <ImageUpload value={form.photo_url} onChange={v => setForm(p => ({ ...p, photo_url: v }))} onUploading={setUploadingImage} bucket="team" />
            </Field>
            <Field label="Sort Order" hint="Lower = shown first"><Input type="number" value={form.sort_order} onChange={f("sort_order")} placeholder="0" /></Field>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="tm-visible" checked={form.visible} onChange={f("visible")} style={{ accentColor: C.brand, width: 15, height: 15 }} />
              <label htmlFor="tm-visible" style={{ fontSize: 13, cursor: "pointer" }}>Visible on website</label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn onClick={doSave} loading={saving || uploadingImage} disabled={uploadingImage}>{uploadingImage ? "Uploading Photo..." : "Save Review"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [counts, setCounts] = useState({ services: 0, portfolio: 0, blog: 0, team: 0, unread: 0 });

  useEffect(() => {
    const init = async () => {
      try {
        await account.deleteSession("current");
      } catch (err) {
        // Ignore error if no session existed to begin with
      }
      setSession(null);
      setLoadingAuth(false);
    };
    init();
  }, []);

  // Load counts for dashboard
  useEffect(() => {
    if (!session) return;
    const loadCounts = async () => {
      const tables = ["services", "portfolio", "blog_posts", "team_members", "contact_submissions", "clients", "testimonials"];
      const results = await Promise.allSettled(tables.map(t => databases.listDocuments(DB_ID, t)));
      const [svcs, port, blog, team, msgs, cls, tst] = results.map(r => r.value?.documents || []);
      setCounts({
        services: svcs.length,
        portfolio: port.length,
        blog: blog.length,
        team: team.length,
        unread: msgs.filter(m => m.read === false).length,
        clients: cls.length,
        testimonials: tst.length,
      });
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [session, tab]);

  const handleSignOut = async () => {
    try {
      await account.deleteSession("current");
    } catch (err) { }
    setSession(null);
  };

  if (loadingAuth) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <Spinner size={32} />
    </div>
  );

  if (!session) return (
    <>
      <GlobalStyles />
      <LoginPage onLogin={s => setSession(s)} />
    </>
  );

  const panels = {
    dashboard: <Dashboard counts={counts} setTab={setTab} />,
    services: <ServicesPage />,
    portfolio: <PortfolioPage />,
    blog: <BlogPage />,
    team: <TeamPage />,
    clients: <ClientsPage />,
    testimonials: <TestimonialsPage />,
    messages: <MessagesPage />,
    settings: <SettingsPage />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text }}>
        <Sidebar active={tab} setActive={setTab} unread={counts.unread} onSignOut={handleSignOut} />
        <main style={{ flex: 1, marginLeft: 220, padding: "36px 40px 60px", minHeight: "100vh" }}>
          {panels[tab] || panels.dashboard}
        </main>
      </div>
    </>
  );
}
