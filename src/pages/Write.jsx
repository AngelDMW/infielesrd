// src/pages/Write.jsx - CÓDIGO MEJORADO PARA FEEDBACK

import { useState } from "react"
import { db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
import { useTheme } from "../context/ThemeContext"
import { FaPenFancy, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function Write(){
  const { dark } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'success', 'error'
  const [message, setMessage] = useState("");

  async function handleSubmit(e){
    e.preventDefault();
    if (!title || !content) {
      setMessage("Por favor, completa el título y la historia.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus(null); // Resetear estado

    try {
      await addDoc(collection(db, "stories"), {
        title: title,
        content: content,
        author: "Anónimo", 
        createdAt: new Date().getTime(),
        status: "pending", 
        likes: 0,
        views: 0,
        commentsCount: 0,
        tags: [],
      });
      
      // Mostrar feedback de éxito y limpiar campos
      setTitle("");
      setContent("");
      setMessage("¡Tu historia se envió! Pendiente de aprobación.");
      setSubmissionStatus('success');
      
    } catch (error) {
      console.error("Error al enviar historia: ", error);
      setMessage("Ocurrió un error al enviar la historia.");
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Si se ha enviado exitosamente, mostramos la pantalla de éxito
  if (submissionStatus === 'success') {
    return (
      <div className="page-content" style={{textAlign: 'center', padding: '50px 20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <FaCheckCircle size={80} style={{color: 'var(--primary)', margin: '0 auto 20px'}} />
        <h2 style={{color: 'var(--text)'}}>¡Gracias por compartir!</h2>
        <p style={{color: 'var(--nav-link)', fontSize: '1.1rem'}}>
          Tu confesión ha sido recibida y está siendo revisada para ser publicada de forma totalmente anónima.
        </p>
        <button 
          onClick={() => setSubmissionStatus(null)}
          className="call-to-action-btn"
          style={{marginTop: '30px'}}
        >
          Escribir otra historia
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="section-title"><FaPenFancy style={{marginRight: '8px'}}/> ¡Escribe tu Historia!</h2>
      <p style={{color: 'var(--nav-link)'}}>Comparte tu secreto íntimo de forma totalmente anónima. Una vez enviada, pasará por revisión.</p>

      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título corto y atractivo"
          style={{padding: '10px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#fff', color: 'var(--text)'}}
          disabled={isSubmitting}
        />
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cuenta tu historia..."
          rows="10"
          style={{padding: '10px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#fff', color: 'var(--text)'}}
          disabled={isSubmitting}
        />
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="call-to-action-btn"
          style={{backgroundColor: isSubmitting ? 'gray' : 'var(--primary)'}}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar para Moderación'}
        </button>
      </form>
      
      {submissionStatus === 'error' && (
        <p style={{marginTop: '20px', textAlign: 'center', color: '#e53e3e', fontWeight: 'bold'}}>
          <FaExclamationTriangle style={{marginRight: '5px'}} /> {message}
        </p>
      )}
    </div>
  )
}