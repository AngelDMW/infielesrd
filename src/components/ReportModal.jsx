import { useState } from "react";
import { FaExclamationTriangle, FaTimes, FaCheck } from "react-icons/fa";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

const REASONS = [
  "Información personal / Doxing 🚫",
  "Contenido sexual explícito 🔞",
  "Discurso de odio / Insultos graves 🤬",
  "Spam o Publicidad 🤖",
  "Historia falsa / Inventada 🤥",
];

export default function ReportModal({ storyId, onClose }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReport = async () => {
    if (!selectedReason) return;
    setLoading(true);

    try {
      const storyRef = doc(db, "stories", storyId);
      
      // Lógica de seguridad:
      // 1. Aumentamos contador de reportes
      // 2. Guardamos la razón
      // 3. Si llega a 5 reportes, cambiamos status a 'under_review' (Auto-moderación)
      
      await updateDoc(storyRef, {
        reportCount: increment(1),
        reportReasons: arrayUnion(selectedReason),
        // Nota: La lógica de ocultar automáticamente (status: under_review) 
        // idealmente se hace con Cloud Functions, pero aquí confiamos en el Admin Panel
        // o podemos hacerlo en el cliente si confiamos en la atomicidad, pero dejémoslo simple por ahora.
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000); // Cerrar después de 2 segs
    } catch (error) {
      console.error("Error reportando:", error);
      alert("Error al enviar reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(5px)"
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "20px",
          padding: "25px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          position: "relative",
          animation: "slideUp 0.3s ease-out"
        }}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "1.2rem"
          }}
        >
          <FaTimes />
        </button>

        {!success ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <FaExclamationTriangle size={40} color="#fbbf24" style={{ marginBottom: "10px" }} />
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Reportar Historia</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Ayúdanos a mantener la comunidad segura. ¿Qué pasa con esto?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className="active-press"
                  style={{
                    padding: "15px",
                    borderRadius: "12px",
                    border: selectedReason === reason ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                    background: selectedReason === reason ? "rgba(217, 4, 41, 0.05)" : "var(--bg-body)",
                    color: selectedReason === reason ? "var(--primary)" : "var(--text-main)",
                    textAlign: "left",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              onClick={handleReport}
              disabled={!selectedReason || loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "50px",
                border: "none",
                background: "var(--text-main)",
                color: "var(--surface)",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                opacity: !selectedReason ? 0.5 : 1
              }}
            >
              {loading ? "Enviando..." : "ENVIAR REPORTE"}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#4ade80', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
            }}>
                <FaCheck size={30} />
            </div>
            <h3>¡Gracias por avisar!</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Nuestros administradores revisarán esto pronto.
            </p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}