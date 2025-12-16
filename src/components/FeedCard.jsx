import { useState } from "react";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeFormat";
import { toBlob } from "html-to-image";
import {
  FaHeart, FaRegHeart, FaRegComment, FaRegPaperPlane, FaWhatsapp,
  FaBookmark, FaRegBookmark, FaEllipsisH, FaUserSecret, FaSpinner,
  FaRadiation, FaBiohazard, FaPepperHot, FaMapMarkerAlt
} from "react-icons/fa";
import { PROVINCES, CATEGORIES } from "../utils/constants"; 

const TOXIC_CONFIG = {
  1: { color: "var(--border-subtle)", icon: null }, // Tranqui (borde normal)
  2: { color: "#fbbf24", icon: FaPepperHot, label: "Picante" },
  3: { color: "#f97316", icon: FaBiohazard, label: "Tóxico" },
  4: { color: "#ef4444", icon: FaRadiation, label: "Chernobyl" }
};

export default function FeedCard({ story }) {
  if (!story) return null;

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(story.likes || 0);
  const [generatingImage, setGeneratingImage] = useState(false);

  const timeAgo = formatTimeAgo(story.createdAt);
  
  // Datos de Categoría y Provincia
  const catObj = CATEGORIES.find(c => c.value === story.category) || CATEGORIES[3];
  const provObj = PROVINCES.find(p => p.value === story.province);
  const provLabel = provObj ? provObj.label : "";

  // Datos de Toxicidad
  const toxicLevel = story.toxicity || 1;
  const toxicData = TOXIC_CONFIG[toxicLevel] || TOXIC_CONFIG[1];

  const displayCategoryLabel = (story.category === "other" && story.customLabel) 
    ? story.customLabel 
    : catObj.label;

  const handleLike = (e) => {
    e.preventDefault();
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

  // Compartir Texto
  const handleShareLink = async (e) => {
    e.preventDefault();
    const locationText = provLabel ? ` en ${provLabel}` : "";
    const text = `🔥 ¡Bochinche${locationText}! ${story.title}\n\nLéelo aquí 👉 ${window.location.origin}/story/${story.id}`;
    
    if (navigator.share) {
       try { await navigator.share({ title: story.title, text, url: window.location.origin + `/story/${story.id}` }); } 
       catch (err) {}
    } else {
       navigator.clipboard.writeText(window.location.origin + `/story/${story.id}`);
       alert("Enlace copiado");
    }
  };

  // Generar Imagen
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (generatingImage) return;
    setGeneratingImage(true);
    try {
      const element = document.createElement("div");
      element.style.width = "1080px";
      element.style.height = "1920px";
      element.style.background = `linear-gradient(135deg, #1a1a1a 0%, ${toxicLevel > 2 ? '#2c0005' : '#0f172a'} 100%)`;
      element.style.display = "flex";
      element.style.flexDirection = "column";
      element.style.justifyContent = "center";
      element.style.alignItems = "center";
      element.style.padding = "80px";
      element.style.fontFamily = "'Outfit', sans-serif";
      element.style.position = "fixed";
      element.style.top = "-9999px";
      element.style.left = "-9999px";
      
      const toxicBadge = toxicLevel > 1 ? `<div style="margin-bottom: 20px; background: ${toxicData.color}; color: white; padding: 10px 30px; border-radius: 50px; font-size: 30px; font-weight: bold;">⚠️ Nivel: ${toxicData.label}</div>` : '';
      const locBadge = provLabel ? `<div style="margin-top: 10px; color: #aaa; font-size: 24px; display: flex; align-items: center; gap: 10px;">📍 ${provLabel}</div>` : '';

      element.innerHTML = `
        <div style="background: white; padding: 60px; border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); width: 100%;">
          ${toxicBadge}
          <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 30px;">
            <div style="width: 100px; height: 100px; background: #ce1126; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 50px;">🤫</span></div>
            <div>
               <h2 style="margin: 0; font-size: 40px; color: #333;">Anónimo</h2>
               ${locBadge}
            </div>
          </div>
          <h1 style="font-size: 60px; line-height: 1.2; margin-bottom: 40px; color: #000;">${story.title}</h1>
          <p style="font-size: 36px; line-height: 1.6; color: #555; display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical; overflow: hidden;">${story.content}</p>
          <div style="margin-top: 60px; padding-top: 40px; border-top: 2px solid #eee; display: flex; justify-content: space-between; align-items: center;">
             <span style="font-size: 30px; color: #888;">infielesrd.com</span>
             <span style="background: #ce1126; color: white; padding: 10px 30px; border-radius: 20px; font-size: 28px; font-weight: bold;">Leer Completa 🔥</span>
          </div>
        </div>
      `;
      document.body.appendChild(element);
      const blob = await toBlob(element, { quality: 0.95, backgroundColor: '#1a1a1a' });
      document.body.removeChild(element);
      if (!blob) throw new Error("Error imagen");
      const file = new File([blob], "story.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Mira este chisme" }); } 
      else { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `story-${story.id}.png`; link.click(); }
    } catch (err) { console.error(err); alert("Error al generar imagen"); } finally { setGeneratingImage(false); }
  };

  return (
    <article
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "20px", // Margen corregido
        // 🎨 DISEÑO NUEVO: Borde izquierdo de color según toxicidad
        border: "1px solid var(--border-subtle)",
        borderLeft: toxicLevel > 1 ? `5px solid ${toxicData.color}` : "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: 'relative'
      }}
    >
      {/* HEADER COMPACTO (Sin barra superior gigante) */}
      <div style={{ padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", padding: "2px", background: `linear-gradient(45deg, ${toxicData.color}, #f09433)` }}>
            <div style={{ width: "100%", height: "100%", background: "var(--surface)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaUserSecret size={20} color="var(--text-main)" />
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)", lineHeight: 1.2 }}>
              Anónimo <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.85rem", marginLeft: "6px" }}>• {timeAgo}</span>
            </span>
            
            {/* LÍNEA DE METADATA (Ubicación, Categoría y Toxicidad) */}
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', marginTop: '3px'}}>
                
                {provLabel && (
                    <span style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px'}}>
                        <FaMapMarkerAlt size={10} /> {provLabel}
                    </span>
                )}
                
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                    {displayCategoryLabel}
                </span>

                {/* ⚠️ TOXIC BADGE COMPACTO (Aquí se ve sutil pero claro) */}
                {toxicLevel > 1 && (
                  <span style={{ 
                      color: toxicData.color, 
                      border: `1px solid ${toxicData.color}`, 
                      borderRadius: '4px', 
                      padding: '0 5px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '3px',
                      height: '18px'
                  }}>
                    <toxicData.icon size={10} /> {toxicData.label.toUpperCase()}
                  </span>
                )}
            </div>
          </div>
        </div>
        
        {/* Menú de opciones */}
        <FaEllipsisH color="var(--text-secondary)" />
      </div>

      {/* CONTENIDO (Clickeable) */}
      <Link to={`/story/${story.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ padding: "0 16px 16px 16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 800, lineHeight: "1.4", color: "var(--text-main)" }}>{story.title}</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-main)", opacity: 0.9, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{story.content}</p>
        </div>
      </Link>

      {/* FOOTER ACCIONES */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={handleLike} className="active-press" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            {isLiked ? <FaHeart size={26} color="#ed4956" /> : <FaRegHeart size={26} color="var(--text-main)" />}
          </button>
          <Link to={`/story/${story.id}#comments`} style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <FaRegComment size={24} style={{ transform: "scaleX(-1)" }} />
          </Link>
          <button onClick={handleShareLink} className="active-press" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-main)" }}>
            <FaRegPaperPlane size={24} />
          </button>
        </div>
        <div style={{display: 'flex', gap: '15px'}}>
             <button onClick={handleGenerateImage} className="active-press" disabled={generatingImage} style={{ background: "var(--primary)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", boxShadow: "0 4px 10px rgba(217, 4, 41, 0.3)" }}>
                {generatingImage ? <FaSpinner className="spin-icon" /> : <FaWhatsapp size={20} />}
             </button>
             <button onClick={handleSave} className="active-press" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-main)" }}>
                {isSaved ? <FaBookmark size={24} /> : <FaRegBookmark size={24} />}
             </button>
        </div>
      </div>
      <div style={{ padding: "0 16px 16px 16px" }}>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{likeCount} Me gusta</span>
      </div>
    </article>
  );
}