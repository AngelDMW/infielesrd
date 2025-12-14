// src/pages/Submit.jsx - AÑADIDA SELECCIÓN DE CATEGORÍA
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import { FaPaperPlane } from 'react-icons/fa';

// Definición de las categorías que el usuario puede elegir (Deben coincidir con Admin.jsx)
const USER_CATEGORIES = [
  { value: 'infidelity', label: 'Infidelidad' },
  { value: 'confession', label: 'Confesiones' },
  { value: 'dating', label: 'Citas / Encuentros' },
  { value: 'other', label: 'Otros Temas' },
];


export default function Submit() {
  const { dark } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("other"); // Nuevo estado
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 5 || content.length < 50) {
      setError("El título debe tener al menos 5 caracteres y la historia al menos 50.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await addDoc(collection(db, "stories"), {
        title: title,
        content: content,
        status: "pending", 
        createdAt: new Date().getTime(),
        // CRÍTICO: El usuario sugiere una categoría
        category: "pending", 
        suggestedCategory: suggestedCategory, 
        // Campos iniciales:
        views: 0,
        likes: 0
      });
      
      setTitle("");
      setContent("");
      setSuggestedCategory("other");
      setSuccess(true);
      
    } catch (err) {
      console.error("Error al enviar la historia:", err);
      setError("Ocurrió un error al intentar enviar tu historia. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  
  // Si la historia fue enviada, mostramos un mensaje de éxito.
  if (success) {
    return (
      <div className="page-content">
        <div className="feedback-success">
          <FaPaperPlane size={24} style={{ marginBottom: '10px' }} />
          <h3>¡Historia Enviada!</h3>
          <p>Tu chisme ha sido recibido. Pasará por un proceso de moderación y se publicará pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1 className="section-title"><FaPaperPlane /> Envía Tu Historia Anónima</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Toda historia es revisada antes de ser publicada. Sé honesto y detallado.
      </p>

      {error && (
        <div className="feedback-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Título corto (máx. 80 caracteres)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          disabled={loading}
        />
        
        {/* NUEVO CAMPO DE SELECCIÓN DE CATEGORÍA */}
        <select
          value={suggestedCategory}
          onChange={(e) => setSuggestedCategory(e.target.value)}
          disabled={loading}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)' }}
        >
          <option value="" disabled>Selecciona una categoría</option>
          {USER_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        
        <textarea
          placeholder="Escribe aquí tu historia (sé detallado/a)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || title.length < 5 || content.length < 50}
          className="btn-primary" 
        >
          {loading ? 'Enviando...' : <><FaPaperPlane /> Enviar para Moderación</>}
        </button>
      </form>
    </div>
  );
}