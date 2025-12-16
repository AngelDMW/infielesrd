import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaPaperPlane, 
  FaInfoCircle, 
  FaRadiation, 
  FaPepperHot, 
  FaBiohazard, 
  FaCloud, 
  FaMapMarkerAlt, 
  FaPen, 
  FaLock, 
  FaHeart, 
  FaUserSecret, 
  FaBullhorn, 
  FaMagic 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PROVINCES } from "../utils/constants"; 

// Configuramos las categorías con iconos visuales para la UI
const CATEGORY_UI = [
  { value: "infidelity", label: "Infidelidad", icon: FaLock, color: "#e91e63" },
  { value: "confession", label: "Confesión", icon: FaUserSecret, color: "#9c27b0" },
  { value: "dating", label: "Citas", icon: FaHeart, color: "#ff9800" },
  { value: "uncategorized", label: "Bochinche", icon: FaBullhorn, color: "#607d8b" },
  { value: "other", label: "Otro", icon: FaMagic, color: "#2196f3" },
];

const TOXICITY_LEVELS = [
  { value: 1, label: "Tranqui", icon: FaCloud, color: "#4ade80", desc: "Chisme sano" },
  { value: 2, label: "Picante", icon: FaPepperHot, color: "#fbbf24", desc: "Se calienta" },
  { value: 3, label: "Tóxico", icon: FaBiohazard, color: "#f97316", desc: "Peligro" },
  { value: 4, label: "Chernobyl", icon: FaRadiation, color: "#ef4444", desc: "Destrucción" }
];

export default function Submit() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [toxicity, setToxicity] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !category || !province) return;
    if (category === "other" && !customLabel.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        content: content.trim(),
        category,
        province,
        customLabel: category === "other" ? customLabel.trim() : null,
        toxicity,
        createdAt: serverTimestamp(),
        likes: 0,
        status: "pending", 
      });
      navigate("/stories");
    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Hubo un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in page-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER VISUAL */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>
          Confiesa tu Pecado
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: '1rem' }}>
          Tu identidad es secreta. Tu historia será leyenda. 🤫
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        
        {/* 1. SELECCIÓN DE CATEGORÍA (Botones Grandes) */}
        <div>
          <label style={labelStyle}>Elige el tema</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
            {CATEGORY_UI.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className="active-press"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '15px 10px',
                    background: isSelected ? cat.color : 'var(--surface)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 8px 16px ${cat.color}40` : 'none'
                  }}
                >
                  <cat.icon size={22} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {/* Campo extra si elige "Otro" */}
          {category === "other" && (
            <input
              type="text"
              placeholder="¿Qué tema es? Ej: Venganza"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              maxLength={20}
              className="fade-in"
              style={{ ...inputStyle, marginTop: '10px' }}
              required
            />
          )}
        </div>

        {/* 2. TÍTULO */}
        <div>
          <label style={labelStyle}>Título Impactante</label>
          <div style={{ position: 'relative' }}>
            <FaPen style={iconInputStyle} />
            <input
              type="text"
              placeholder="Ej: Mi novio no sabe que soy..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              required
              style={inputStyle}
            />
          </div>
        </div>

        {/* 3. UBICACIÓN (Estilo Select Mejorado) */}
        <div>
          <label style={labelStyle}>¿Dónde ocurrió?</label>
          <div style={{ position: 'relative' }}>
            <FaMapMarkerAlt style={iconInputStyle} />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Selecciona la zona...</option>
              {PROVINCES.map((prov) => (
                <option key={prov.value} value={prov.value}>{prov.label}</option>
              ))}
            </select>
            {/* Flechita custom CSS hack */}
            <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
          </div>
        </div>

        {/* 4. HISTORIA */}
        <div>
          <label style={labelStyle}>Echa el cuento completo</label>
          <textarea
            rows="8"
            placeholder="No omitas detalles..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ ...inputStyle, paddingLeft: '20px', resize: 'vertical' }} // Sin icono dentro
          ></textarea>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "8px" }}>
            <FaInfoCircle color="var(--primary)" /> 
            <span>Escribe al menos 3 líneas para que te lean.</span>
          </div>
        </div>

        {/* 5. NIVEL DE TOXICIDAD (Diseño Tarjetas) */}
        <div>
          <label style={labelStyle}>Nivel de Toxicidad</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
             {TOXICITY_LEVELS.map((level) => {
                const isActive = toxicity === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setToxicity(level.value)}
                    className="active-press"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: isActive ? `2px solid ${level.color}` : '1px solid var(--border-subtle)',
                      background: isActive ? `${level.color}15` : 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ 
                        background: level.color, color: '#fff', 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                        <level.icon size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isActive ? level.color : 'var(--text-main)' }}>{level.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{level.desc}</div>
                    </div>
                  </button>
                )
             })}
          </div>
        </div>

        {/* BOTÓN ENVIAR */}
        <button
          type="submit"
          disabled={loading || !title || !content || !category || !province}
          className="active-press"
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "50px",
            border: "none",
            background: "linear-gradient(135deg, var(--primary) 0%, #ff4d6d 100%)",
            color: "white",
            fontSize: "1.2rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 10px 25px rgba(217, 4, 41, 0.4)",
            letterSpacing: '0.5px'
          }}
        >
          {loading ? "Publicando..." : (
             <>
               <FaPaperPlane /> PUBLICAR ANÓNIMAMENTE
             </>
          )}
        </button>

      </form>
    </div>
  );
}

// --- ESTILOS EN JS (Para mantener limpieza en el JSX) ---
const labelStyle = {
  display: 'block',
  marginBottom: '10px',
  fontWeight: 700,
  fontSize: '0.95rem',
  color: 'var(--text-main)',
  marginLeft: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '16px 16px 16px 45px', // Padding izq para el icono
  borderRadius: '14px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface)',
  color: 'var(--text-main)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit'
};

const iconInputStyle = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
  pointerEvents: 'none'
};