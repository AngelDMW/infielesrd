import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaPaperPlane, FaPenNib, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { value: 'infidelity', label: '💔 Infidelidad' },
  { value: 'confession', label: '🤫 Confesión Secreta' },
  { value: 'dating', label: '🔥 Citas / Dating' },
  { value: 'uncategorized', label: '📢 Bochinche General' },
];

export default function Submit() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !category) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        content: content.trim(),
        category,
        status: "pending", // Requiere aprobación
        createdAt: serverTimestamp(),
        likes: 0,
        commentsCount: 0,
        views: 0
      });
      
      // Redirigir o mostrar éxito
      alert("¡Tu historia fue enviada al anonimato! Pendiente de aprobación.");
      navigate('/');
      
    } catch (err) {
      console.error("Error:", err);
      alert("Hubo un error al enviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', paddingTop: '20px' }}>
        <div style={{ 
            width: 60, height: 60, background: 'var(--surface)', 
            borderRadius: '50%', margin: '0 auto 15px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)', color: 'var(--primary)'
        }}>
            <FaPenNib size={24} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 10px 0' }}>Confiesa tu Secreto</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Tu identidad está 100% protegida. <br/> Desahógate sin miedo.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Título */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', marginLeft: '5px' }}>Título Atractivo</label>
            <input
              type="text"
              placeholder="Ej: Mi novio no sabe que salí con su hermano..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              style={{
                padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                background: 'var(--surface)', fontSize: '1rem', outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
        </div>

        {/* Categoría */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', marginLeft: '5px' }}>Categoría</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        style={{
                            padding: '12px', borderRadius: '10px',
                            border: category === cat.value ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                            background: category === cat.value ? 'rgba(217, 4, 41, 0.05)' : 'var(--surface)',
                            color: category === cat.value ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Historia */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', marginLeft: '5px' }}>Tu Historia</label>
            <textarea
              placeholder="Cuenta todos los detalles..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              style={{
                padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                background: 'var(--surface)', fontSize: '1rem', outline: 'none',
                boxShadow: 'var(--shadow-sm)', resize: 'none', lineHeight: '1.5'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '5px' }}>
                <FaInfoCircle /> Sé detallado, las historias cortas suelen ser ignoradas.
            </div>
        </div>

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={loading || !title || !content || !category}
          className="active-press"
          style={{
            marginTop: '10px', padding: '18px', borderRadius: '50px', border: 'none',
            background: 'var(--primary)', color: 'white', fontSize: '1.1rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: (loading || !title || !content || !category) ? 0.6 : 1,
            boxShadow: '0 10px 20px rgba(217, 4, 41, 0.3)'
          }}
        >
          {loading ? 'Enviando...' : <><FaPaperPlane /> Publicar Anónimamente</>}
        </button>

      </form>
    </div>
  );
}