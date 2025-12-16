import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeFormat";
import { toBlob } from "html-to-image";
import {
  FaHeart, FaRegHeart, FaRegComment, FaRegPaperPlane, FaWhatsapp,
  FaBookmark, FaRegBookmark, FaEllipsisH, FaUserSecret, FaSpinner,
  FaRadiation, FaBiohazard, FaPepperHot, FaMapMarkerAlt
} from "react-icons/fa";
import { PROVINCES, CATEGORIES } from "../utils/constants"; 
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

const TOXIC_CONFIG = {
  1: { color: "var(--border-subtle)", icon: null },
  2: { color: "#fbbf24", icon: FaPepperHot, label: "Picante" },
  3: { color: "#f97316", icon: FaBiohazard, label: "Tóxico" },
  4: { color: "#ef4444", icon: FaRadiation, label: "Chernobyl" }
};

export default function FeedCard({ story }) {
  if (!story) return null;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(story.likes || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    const likedStories = JSON.parse(localStorage.getItem('liked_stories') || '[]');
    if (likedStories.includes(story.id)) {
      setIsLiked(true);
    }
  }, [story.id]);

  const timeAgo = formatTimeAgo(story.createdAt);
  
  const catObj = CATEGORIES.find(c => c.value === story.category) || CATEGORIES[3];
  const provObj = PROVINCES.find(p => p.value === story.province);
  const provLabel = provObj ? provObj.label : "";

  const toxicLevel = story.toxicity || 1;
  const toxicData = TOXIC_CONFIG[toxicLevel] || TOXIC_CONFIG[1];

  const displayCategoryLabel = (story.category === "other" && story.customLabel) 
    ? story.customLabel 
    : catObj.label;

  const handleLike = async (e) => {
    e.preventDefault(); 
    e.stopPropagation();

    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount((prev) => (newStatus ? prev + 1 : prev - 1));

    const likedStories = JSON.parse(localStorage.getItem('liked_stories') || '[]');
    if (newStatus) {
      if (!likedStories.includes(story.id)) likedStories.push(story.id);
    } else {
      const index = likedStories.indexOf(story.id);
      if (index > -1) likedStories.splice(index, 1);
    }
    localStorage.setItem('liked_stories', JSON.stringify(likedStories));

    try {
      const storyRef = doc(db, "stories", story.id);
      await updateDoc(storyRef, { likes: increment(newStatus ? 1 : -1) });
    } catch (error) {
      console.error("Error like:", error);
      setIsLiked(!newStatus);
      setLikeCount((prev) => (newStatus ? prev - 1 : prev + 1));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

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

  // ✅ FUNCIÓN CORREGIDA PARA MÓVILES (Fuerza Bruta)
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (generatingImage) return;
    setGeneratingImage(true);
    
    try {
      const element = document.createElement("div");
      
      // --- ESTRATEGIA MÓVIL ---
      // 1. Z-Index negativo profundo (detrás de la app)
      // 2. Opacidad 1 (VISIBLE) - Crucial para que iOS renderice el texto
      // 3. Posición fija top/left 0
      element.style.position = "fixed";
      element.style.top = "0";
      element.style.left = "0";
      element.style.zIndex = "-9999"; 
      element.style.width = "1080px"; 
      // Sin opacidad ni visibilidad oculta. Confiamos en que z-index lo oculte.
      
      // Fondo Gradiente
      element.style.background = `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`;
      element.style.display = "flex";
      element.style.flexDirection = "column";
      element.style.padding = "80px";
      // Usamos fuentes del sistema para asegurar carga rápida en móvil
      element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      element.style.boxSizing = "border-box";
      element.style.color = "white";
      
      const toxicBadge = toxicLevel > 1 ? `
        <div style="display: inline-flex; align-items: center; gap: 15px; background: ${toxicData.color}30; color: ${toxicData.color}; padding: 15px 40px; border-radius: 60px; font-size: 32px; font-weight: 800; border: 3px solid ${toxicData.color}; margin-bottom: 40px;">
          ⚠️ Nivel: ${toxicData.label.toUpperCase()}
        </div>
      ` : '';
      
      const locBadge = provLabel ? `<div style="margin-top: 20px; color: #94a3b8; font-size: 30px; display: flex; align-items: center; gap: 15px;"><span style="font-size: 36px">📍</span> ${provLabel}</div>` : '';

      // HTML CON ESTILOS INLINE (Más seguro para html-to-image)
      element.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 60px;">
              <div style="background: #e11d48; padding: 15px; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="50" height="50" fill="white"><path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32zm0-320H32C14.33 48 0 62.33 0 80v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32V80c0-17.67-14.33-32-32-32z"/></svg>
              </div>
              <h1 style="font-size: 60px; font-weight: 900; color: white; margin: 0; letter-spacing: -1px;">
                Infieles<span style="color: #e11d48;">RD</span>
              </h1>
          </div>

          <div style="background: #ffffff; padding: 70px; border-radius: 50px; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); color: #0f172a; flex: 1;">
            
            ${toxicBadge}

            <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 50px;">
              <div style="width: 110px; height: 110px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #e11d48;">
                 <span style="color: #0f172a; font-size: 60px;">🤫</span>
              </div>
              <div>
                 <h2 style="margin: 0; font-size: 42px; font-weight: 800; color: #0f172a;">Anónimo</h2>
                 ${locBadge}
                 <div style="color: #e11d48; font-size: 28px; font-weight: 700; margin-top: 10px;">${displayCategoryLabel.toUpperCase()}</div>
              </div>
            </div>

            <h1 style="font-size: 65px; line-height: 1.1; font-weight: 900; margin-bottom: 50px; color: #000;">
              ${story.title}
            </h1>

            <p style="font-size: 40px; line-height: 1.5; color: #334155; font-weight: 500; white-space: pre-wrap;">${story.content}</p>

          </div>
          
          <div style="margin-top: 60px; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 20px;">
              <div style="background: #e11d48; color: white; padding: 20px 50px; border-radius: 100px; font-size: 36px; font-weight: 800; display: flex; align-items: center; gap: 15px;">
                 🔥 Leer en infielesrd.com
              </div>
          </div>

        </div>
      `;
      document.body.appendChild(element);
      
      // ⏳ ESPERA LARGA PARA MÓVILES (1 SEGUNDO)
      // Esto da tiempo al procesador del celular para renderizar el nodo oculto
      await new Promise(resolve => setTimeout(resolve, 1000));

      const blob = await toBlob(element, { 
          quality: 0.95, 
          backgroundColor: '#0f172a',
          width: 1080,
          // Permitir que la altura sea dinámica para que no corte texto
          style: {
             'visibility': 'visible',
             'z-index': '9999' // Truco interno para forzar captura
          }
      });
      
      document.body.removeChild(element);
      
      if (!blob) throw new Error("Blob nulo");
      
      const file = new File([blob], `bochinche-${story.id}.png`, { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) { 
          await navigator.share({ 
              files: [file], 
              title: "InfielesRD",
              text: `😱 ${story.title}`
          }); 
      } else { 
          const url = URL.createObjectURL(blob); 
          const link = document.createElement("a"); 
          link.href = url; 
          link.download = `bochinche-${story.id}.png`; 
          link.click(); 
      }
    } catch (err) { 
        console.error("Fallo generacion imagen:", err); 
        alert("No se pudo generar la imagen. Tu celular podría tener poca memoria disponible."); 
    } finally { 
        setGeneratingImage(false); 
    }
  };

  return (
    <article
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "20px",
        border: "1px solid var(--border-subtle)",
        borderLeft: toxicLevel > 1 ? `5px solid ${toxicData.color}` : "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", position: 'relative', width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden"
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
          <div style={{ flexShrink: 0, width: "42px", height: "42px", borderRadius: "50%", padding: "2px", background: `linear-gradient(45deg, ${toxicData.color}, #f09433)` }}>
            <div style={{ width: "100%", height: "100%", background: "var(--surface)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaUserSecret size={20} color="var(--text-main)" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Anónimo <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.85rem", marginLeft: "6px" }}>• {timeAgo}</span>
            </span>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', marginTop: '3px'}}>
                {provLabel && ( <span style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap'}}><FaMapMarkerAlt size={10} /> {provLabel}</span> )}
                <span style={{ color: "var(--primary)", fontWeight: 600, whiteSpace: 'nowrap' }}>{displayCategoryLabel}</span>
                {toxicLevel > 1 && ( <span style={{ color: toxicData.color, border: `1px solid ${toxicData.color}`, borderRadius: '4px', padding: '0 5px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', height: '18px', whiteSpace: 'nowrap' }}><toxicData.icon size={10} /> {toxicData.label.toUpperCase()}</span> )}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, paddingLeft: '10px' }}> <FaEllipsisH color="var(--text-secondary)" /> </div>
      </div>

      {/* CONTENIDO */}
      <Link to={`/story/${story.id}`} style={{ textDecoration: "none", color: "inherit", display: 'block', width: '100%' }}>
        <div style={{ padding: "0 16px 16px 16px", width: "100%", boxSizing: "border-box" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 800, lineHeight: "1.4", color: "var(--text-main)", wordBreak: "break-word", overflowWrap: "break-word" }}>{story.title}</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-main)", opacity: 0.9, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word", overflowWrap: "break-word" }}>{story.content}</p>
        </div>
      </Link>

      {/* FOOTER */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", width: "100%", boxSizing: "border-box" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={handleLike} className="active-press" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            {isLiked ? <FaHeart size={26} color="#ed4956" /> : <FaRegHeart size={26} color="var(--text-main)" />}
          </button>
          
          {/* COMENTARIOS */}
          <Link to={`/story/${story.id}#comments`} style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <FaRegComment size={24} style={{ transform: "scaleX(-1)" }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{story.commentsCount || 0}</span>
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