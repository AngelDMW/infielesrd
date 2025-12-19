import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase"; 
import { signInAnonymously } from "firebase/auth"; 
import {
  FaPaperPlane,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaSpinner
} from "react-icons/fa";
import { PROVINCES, CATEGORIES } from "../utils/constants";
import { getAnonymousID } from "../utils/identity";

export default function SubmitStory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("infidelity");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || !province || !agreed) {
      alert("Por favor llena todos los campos y acepta las reglas.");
      return;
    }

    if (title.length < 3) {
      alert("El título es muy corto (mínimo 3 letras).");
      return;
    }

    if (content.length < 10) {
      alert("El cuento es muy corto, danos más detalles (mínimo 10 letras).");
      return;
    }

    setLoading(true);

    try {
      let currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId) {
        const userCredential = await signInAnonymously(auth);
        currentUserId = userCredential.user.uid;
      }

      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        content: content.trim(),
        province,
        category,
        createdAt: serverTimestamp(),
        authorId: currentUserId || getAnonymousID(),
        
        // ✅ AQUÍ ESTÁ EL CAMBIO PARA MODERACIÓN
        status: "pending", 
        
        likes: 0,
        commentsCount: 0,
        votes_him: 0,
        votes_her: 0,
        votes_toxic: 0,
        votes_total: 0
      });

      // Mensaje de éxito explicando que debe esperar aprobación
      alert("¡Historia enviada! Un administrador la revisará antes de publicarla.");
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

        {/* SELECTORES */}
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

        {/* AVISO LEGAL */}
        <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '15px', borderRadius: '12px',
            display: 'flex', gap: '10px', alignItems: 'start',
            marginTop: '10px'
        }}>
            <FaExclamationTriangle color="#ef4444" style={{marginTop: '3px', flexShrink: 0}} />
            <div>
                <p style={{margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: 700, color: '#ef4444'}}>Reglas Importantes</p>
                <p style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-main)'}}>
                    Prohibido publicar nombres completos...
                </p>
            </div>
        </div>

        {/* CHECKBOX */}
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