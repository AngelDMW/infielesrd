import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaPaperPlane, FaPenNib, FaInfoCircle, FaTag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { value: "infidelity", label: "💔 Infidelidad" },
  { value: "confession", label: "🤫 Confesión" },
  { value: "dating", label: "🔥 Citas" },
  { value: "uncategorized", label: "📢 Bochinche" },
  { value: "other", label: "✨ Personalizado" }, // Nueva opción
];

export default function Submit() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [customLabel, setCustomLabel] = useState(""); // Estado para la categoría propia
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación: Si es 'other', debe tener customLabel
    if (!title || !content || !category) return;
    if (category === "other" && !customLabel.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        content: content.trim(),
        category,
        // Si es personalizada guardamos el texto, si no, null
        customLabel: category === "other" ? customLabel.trim() : null,
        status: "pending",
        createdAt: serverTimestamp(),
        likes: 0,
        commentsCount: 0,
        views: 0,
      });

      alert("¡Historia enviada! Pendiente de aprobación.");
      navigate("/");
    } catch (err) {
      console.error("Error:", err);
      alert("Hubo un error al enviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          paddingTop: "20px",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            background: "var(--surface)",
            borderRadius: "50%",
            margin: "0 auto 15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-md)",
            color: "var(--primary)",
          }}
        >
          <FaPenNib size={24} />
        </div>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            margin: "0 0 10px 0",
            color: "var(--text-main)",
          }}
        >
          Confiesa tu Secreto
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Tu identidad está 100% protegida.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "25px" }}
      >
        {/* Título */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              marginLeft: "5px",
              color: "var(--text-main)",
            }}
          >
            Título Atractivo
          </label>
          <input
            type="text"
            placeholder="Ej: Mi novio no sabe que salí con su hermano..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface)",
              fontSize: "1rem",
              outline: "none",
              boxShadow: "var(--shadow-sm)",
              color: "var(--text-main)", // ✅ SOLUCIÓN BUG MODO OSCURO
            }}
          />
        </div>

        {/* Categoría */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              marginLeft: "5px",
              color: "var(--text-main)",
            }}
          >
            Categoría
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border:
                    category === cat.value
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border-subtle)",
                  background:
                    category === cat.value
                      ? "rgba(206, 17, 38, 0.05)"
                      : "var(--surface)",
                  color:
                    category === cat.value
                      ? "var(--primary)"
                      : "var(--text-main)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* INPUT EXTRA: Solo si elige "Personalizado" */}
          {category === "other" && (
            <div
              className="fade-in"
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaTag color="var(--primary)" />
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Escribe tu propia categoría (Ej: Venganza)"
                maxLength={20}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--primary)",
                  background: "var(--surface)",
                  outline: "none",
                  color: "var(--text-main)",
                  fontSize: "0.9rem", // ✅ SOLUCIÓN BUG
                }}
              />
            </div>
          )}
        </div>

        {/* Historia */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              marginLeft: "5px",
              color: "var(--text-main)",
            }}
          >
            Tu Historia
          </label>
          <textarea
            placeholder="Cuenta todos los detalles..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface)",
              fontSize: "1rem",
              outline: "none",
              boxShadow: "var(--shadow-sm)",
              resize: "none",
              lineHeight: "1.5",
              color: "var(--text-main)", // ✅ SOLUCIÓN BUG MODO OSCURO
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              paddingLeft: "5px",
            }}
          >
            <FaInfoCircle /> Sé detallado, las historias cortas suelen ser
            ignoradas.
          </div>
        </div>

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={
            loading ||
            !title ||
            !content ||
            !category ||
            (category === "other" && !customLabel)
          }
          className="active-press"
          style={{
            marginTop: "10px",
            padding: "18px",
            borderRadius: "50px",
            border: "none",
            background: "var(--primary)",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 10px 20px rgba(206, 17, 38, 0.3)",
          }}
        >
          {loading ? (
            "Enviando..."
          ) : (
            <>
              <FaPaperPlane /> Publicar Anónimamente
            </>
          )}
        </button>
      </form>
    </div>
  );
}
