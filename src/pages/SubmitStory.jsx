import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaPaperPlane,
  FaMapMarkerAlt,
  FaBiohazard,
  FaExclamationTriangle,
  FaPepperHot,
  FaRadiation,
  FaSpinner
} from "react-icons/fa";
import { PROVINCES, CATEGORIES } from "../utils/constants";
import { getAnonymousID } from "../utils/identity";

const TOXIC_LEVELS = [
  { value: 1, label: "Tranqui (Nivel 1)", color: "#4ade80", icon: null },
  { value: 2, label: "Picante (Nivel 2)", color: "#fbbf24", icon: FaPepperHot },
  { value: 3, label: "Tóxico (Nivel 3)", color: "#f97316", icon: FaBiohazard },
  { value: 4, label: "Chernobyl (Nivel 4)", color: "#ef4444", icon: FaRadiation }
];

export default function SubmitStory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("infidelity");
  const [toxicity, setToxicity] = useState(1);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !province || !agreed) {
      alert("Por favor llena todos los campos y acepta las reglas.");
      return;
    }

    setLoading(true);

    try {
      // Guardar en Firestore
      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        content: content.trim(),
        province,
        category,
        toxicity,
        createdAt: serverTimestamp(),
        authorId: getAnonymousID(),
        status: "approved", // ✅ "approved" para que salga inmediato (en producción debería ser "pending")
        likes: 0,
        commentsCount: 0,
        votes_him: 0,
        votes_her: 0,
        votes_toxic: 0,
        votes_total: 0
      });

      // Redirigir al inicio
      navigate("/");
    } catch (error) {
      console.error("Error al subir historia:", error);
      alert("Hubo un error al subir tu historia. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in page-content" style={{ paddingBottom: "100px", maxWidth: "600px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 className="section-title">Confesar Pecado 😈</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Tu identidad es 100% anónima. Suelta esa bomba.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* TÍTULO */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 700, color: 'var(--text-main)'}}>Título del Chisme</label>
            <input
              type="text"
              placeholder="Ej: Mi vecina y el del colmado..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              style={{
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-main)",
                fontSize: "1rem",
                outline: "none"
              }}
            />
        </div>

        {/* CONTENIDO */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 700, color: 'var(--text-main)'}}>Cuenta la historia</label>
            <textarea
              placeholder="Escribe aquí con lujo de detalles..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              style={{
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-main)",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical"
              }}
            />
        </div>

        {/* SELECTORES (Provincia y Categoría) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 700, color: 'var(--text-main)'}}>Provincia</label>
            <div style={{position: 'relative'}}>
                <FaMapMarkerAlt style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 35px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface)",
                    color: "var(--text-main)",
                    outline: "none",
                    appearance: "none",
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecciona...</option>
                  {PROVINCES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontWeight: 700, color: 'var(--text-main)'}}>Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-main)",
                outline: "none",
                appearance: "none",
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NIVEL DE TOXICIDAD */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
            <label style={{fontWeight: 700, color: 'var(--text-main)'}}>Nivel de Toxicidad ☢️</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                {TOXIC_LEVELS.map((level) => {
                    const isSelected = toxicity === level.value;
                    return (
                        <div 
                            key={level.value}
                            onClick={() => setToxicity(level.value)}
                            style={{
                                border: isSelected ? `2px solid ${level.color}` : '1px solid var(--border-subtle)',
                                background: isSelected ? `${level.color}20` : 'var(--surface)',
                                padding: '10px', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {level.icon && <level.icon color={level.color} />}
                            <span style={{fontSize: '0.85rem', fontWeight: isSelected ? 700 : 400, color: 'var(--text-main)'}}>{level.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* AVISO LEGAL */}
        <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '15px', borderRadius: '12px',
            display: 'flex', gap: '10px', alignItems: 'start'
        }}>
            <FaExclamationTriangle color="#ef4444" style={{marginTop: '3px', flexShrink: 0}} />
            <div>
                <p style={{margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: 700, color: '#ef4444'}}>Reglas Importantes</p>
                <p style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-main)'}}>
                    Prohibido publicar nombres completos, números de teléfono, direcciones exactas o fotos íntimas. 
                    Si rompes las reglas, serás bloqueado permanentemente.
                </p>
            </div>
        </div>

        {/* CHECKBOX ACEPTAR */}
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '0 5px'}}>
            <input 
                type="checkbox" 
                id="rules" 
                checked={agreed} 
                onChange={e => setAgreed(e.target.checked)}
                style={{width: '20px', height: '20px', accentColor: 'var(--primary)'}} 
            />
            <label htmlFor="rules" style={{fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer'}}>
                He leído y acepto las reglas de la comunidad.
            </label>
        </div>

        {/* BOTÓN ENVIAR */}
        <button
          type="submit"
          className="active-press"
          disabled={loading || !agreed}
          style={{
            marginTop: "10px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            padding: "16px",
            borderRadius: "50px",
            fontSize: "1.1rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 4px 15px rgba(225, 29, 72, 0.4)",
            opacity: (!agreed || loading) ? 0.5 : 1
          }}
        >
          {loading ? <FaSpinner className="spin-icon" /> : <FaPaperPlane />}
          {loading ? "Publicando..." : "Publicar Historia"}
        </button>

      </form>
    </div>
  );
}