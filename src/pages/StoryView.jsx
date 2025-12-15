// src/pages/StoryView.jsx - Versión Final Funcional (Corrección de Carga, Likes y Comentarios)

import { useState, useEffect, useCallback } from "react";
// 🏆 CORRECCIÓN CRÍTICA 1: Añadir 'useNavigate' para manejar redirecciones de historias no aprobadas
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  increment,
  deleteDoc,
  setDoc,
  serverTimestamp,
  addDoc,
  getCountFromServer,
  runTransaction, // 🏆 CORRECCIÓN CRÍTICA 2: Añadir 'runTransaction' (necesario para la lógica de likes)
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FaHeart,
  FaCommentAlt,
  FaRegClock,
  FaUserSecret,
  FaReply,
  FaArrowLeft,
  FaFlag,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
} from "react-icons/fa";

import { formatTimeAgo } from "../utils/timeFormat";

const TEMP_USER_ID = "ANON_SESSION_RD_123";

// Mapeo de categorías para mostrar la etiqueta
const CATEGORY_MAP = {
  infidelity: "Infidelidad",
  confession: "Confesiones",
  dating: "Citas",
  uncategorized: "Bochinche",
};

// =========================================================================
// 1. Componente: ReplyForm
// =========================================================================

const ReplyForm = ({
  parentCommentId,
  replyToReplyId,
  storyId,
  handleCommentUpdate,
  onReplySuccess,
}) => {
  const [content, setContent] = useState("");

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (trimmedContent === "") return;

    try {
      const repliesRef = collection(
        db,
        "stories",
        storyId,
        "comments",
        parentCommentId,
        "replies"
      );

      const newReply = {
        content: trimmedContent,
        createdAt: serverTimestamp(),
        parentReplyId: replyToReplyId,
      };

      await addDoc(repliesRef, newReply);
      setContent("");

      // Actualizar el comentario padre para refrescar la vista de replies
      await updateDoc(
        doc(db, "stories", storyId, "comments", parentCommentId),
        {
          repliesCount: increment(1),
        }
      );

      // Llamar a la función de éxito para que el padre pueda cerrar el formulario
      onReplySuccess();
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
      alert("No se pudo enviar la respuesta.");
    }
  };

  return (
    <form
      onSubmit={handleReplySubmit}
      style={{
        margin: "10px 0",
        borderLeft: "3px solid var(--border)",
        paddingLeft: "10px",
      }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          replyToReplyId
            ? "Respuesta a otro anónimo..."
            : "Escribe una respuesta..."
        }
        rows="2"
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid var(--card-border)",
          background: "var(--secondary)",
          color: "var(--text-main)",
          resize: "vertical",
          marginBottom: "5px",
        }}
      />
      <button
        type="submit"
        className="btn-primary"
        style={{ padding: "5px 10px", fontSize: "0.8rem", width: "auto" }}
      >
        Responder
      </button>
    </form>
  );
};

// =========================================================================
// 2. Componente: CommentCard
// =========================================================================

const CommentCard = ({
  comment,
  storyId,
  handleReport,
  handleCommentUpdate,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyFormVisible, setReplyFormVisible] = useState(false);
  const [replyToReplyId, setReplyToReplyId] = useState(null); // Para responder a una respuesta específica
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const loadReplies = useCallback(async () => {
    if (!showReplies) return;
    setIsLoadingReplies(true);
    try {
      const repliesRef = collection(
        db,
        "stories",
        storyId,
        "comments",
        comment.id,
        "replies"
      );
      const q = query(repliesRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);

      // Mapear replies y asegurar que el id esté incluido
      const loadedReplies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isReplyToReply: !!doc.data().parentReplyId,
      }));

      setReplies(loadedReplies);
      handleCommentUpdate(comment.id, loadedReplies.length); // Actualizar count en el padre
    } catch (error) {
      console.error("Error al cargar respuestas:", error);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [comment.id, storyId, showReplies, handleCommentUpdate]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleReplyTo = (replyId = null) => {
    setReplyToReplyId(replyId);
    setReplyFormVisible(true);
  };

  return (
    <div className="comment-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaUserSecret /> Anónimo
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {formatTimeAgo(comment.createdAt)}
        </span>
      </div>

      <p style={{ margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
        {comment.content}
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          fontSize: "0.85rem",
          color: "var(--nav-link)",
          alignItems: "center",
        }}
      >
        <span
          onClick={() => handleReplyTo()}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaReply /> Responder
        </span>
        <span
          onClick={() =>
            handleReport(
              "comment",
              comment.id,
              comment.content.substring(0, 50)
            )
          }
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaFlag /> Reportar
        </span>

        {/* Mostrar botón de respuestas solo si hay repliesCount > 0 o si se abre el formulario */}
        {(comment.repliesCount > 0 || replies.length > 0) && (
          <span
            onClick={() => setShowReplies((prev) => !prev)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginLeft: "auto",
            }}
          >
            {showReplies ? <FaChevronUp /> : <FaChevronDown />}
            {comment.repliesCount || replies.length}{" "}
            {comment.repliesCount === 1 ? "Respuesta" : "Respuestas"}
          </span>
        )}
      </div>

      {replyFormVisible && (
        <ReplyForm
          parentCommentId={comment.id}
          replyToReplyId={replyToReplyId}
          storyId={storyId}
          handleCommentUpdate={handleCommentUpdate}
          onReplySuccess={() => {
            setReplyFormVisible(false);
            loadReplies(); // Recargar replies después de un éxito
          }}
        />
      )}

      {showReplies && (
        <div
          style={{
            marginTop: "15px",
            borderLeft: "2px solid var(--card-border)",
            paddingLeft: "10px",
          }}
        >
          {isLoadingReplies && (
            <p style={{ fontSize: "0.8rem", color: "var(--nav-link)" }}>
              Cargando respuestas...
            </p>
          )}
          {!isLoadingReplies && replies.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--nav-link)" }}>
              No hay respuestas.
            </p>
          )}

          {replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                marginBottom: "10px",
                padding: "5px",
                background: "var(--secondary)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  marginBottom: "3px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaUserSecret /> Anónimo
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {formatTimeAgo(reply.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 5px 0",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {reply.content}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "0.8rem",
                  color: "var(--nav-link)",
                }}
              >
                <span
                  onClick={() => handleReplyTo(reply.id)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaReply /> Responder
                </span>
                <span
                  onClick={() =>
                    handleReport(
                      "reply",
                      reply.id,
                      reply.content.substring(0, 50)
                    )
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FaFlag /> Reportar
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. Componente Principal: StoryView
// =========================================================================

export default function StoryView() {
  const { id } = useParams();
  // 🏆 CORRECCIÓN CRÍTICA 3: Inicializar useNavigate
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [reportModal, setReportModal] = useState({
    visible: false,
    type: "",
    id: "",
    snippet: "",
  });
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Función para actualizar el conteo de replies de un comentario
  const handleCommentUpdate = useCallback((commentId, newRepliesCount) => {
    setComments((prevComments) =>
      prevComments.map((c) =>
        c.id === commentId ? { ...c, repliesCount: newRepliesCount } : c
      )
    );
  }, []);

  // -------------------------------------------------------------------------
  // A. Lógica de Carga de Historia (fetchStory)
  // -------------------------------------------------------------------------

  const fetchStory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storyRef = doc(db, "stories", id);
      const storySnap = await getDoc(storyRef);

      if (!storySnap.exists()) {
        setError("La historia no existe o fue eliminada.");
        setLoading(false);
        return;
      }

      const storyData = storySnap.data();

      // 🏆 CORRECCIÓN CRÍTICA 4: Verificar el estado de la historia (ESTO SOLUCIONA EL 404)
      if (storyData.status !== "approved") {
        setError(
          "La historia no ha sido publicada o fue eliminada por el administrador."
        );
        setLoading(false);
        // Opcional: Redirigir al inicio o a una página de 404
        // navigate('/404', { replace: true });
        return;
      }

      setStory({ id: storySnap.id, ...storyData });
      // Incrementar las vistas solo una vez por sesión anónima (simulado)

      const sessionKey = `viewed_${id}`;

      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "true");
      }

      // Comprobar si el usuario actual le dio 'like' (simulado)
      const likedKey = `liked_${id}_${TEMP_USER_ID}`;
      setIsLiked(!!localStorage.getItem(likedKey));
      // -------------------------------------------------------------------------
      // B. Lógica de Carga de Comentarios
      // -------------------------------------------------------------------------
      const commentsRef = collection(db, "stories", id, "comments");
      const q = query(commentsRef, orderBy("createdAt", "desc"));
      const commentsSnapshot = await getDocs(q);

      const loadedComments = commentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        repliesCount: doc.data().repliesCount || 0, // Asegurar que el conteo existe
      }));
      setComments(loadedComments);
    } catch (err) {
      console.error("Error al cargar la historia:", err);
      setError(
        "Ocurrió un error al intentar cargar la historia. Intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]); // Añadir navigate a las dependencias

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  // -------------------------------------------------------------------------
  // C. Lógica de Likes (runTransaction)
  // -------------------------------------------------------------------------

  const handleLike = async () => {
    if (!story) return;

    const storyRef = doc(db, "stories", story.id);
    const likedKey = `liked_${story.id}_${TEMP_USER_ID}`;

    try {
      await runTransaction(db, async (transaction) => {
        const storyDoc = await transaction.get(storyRef);
        if (!storyDoc.exists()) {
          throw "Story does not exist!";
        }

        let newLikes;
        if (isLiked) {
          newLikes = (storyDoc.data().likes || 0) - 1;
          transaction.update(storyRef, { likes: increment(-1) });
          localStorage.removeItem(likedKey);
        } else {
          newLikes = (storyDoc.data().likes || 0) + 1;
          transaction.update(storyRef, { likes: increment(1) });
          localStorage.setItem(likedKey, "true");
        }

        // Actualizar el estado local para reflejar el cambio inmediatamente
        setStory((prev) => ({ ...prev, likes: newLikes }));
        setIsLiked((prev) => !prev);
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
      alert("No se pudo actualizar el like. Intenta de nuevo.");
    }
  };

  // -------------------------------------------------------------------------
  // D. Lógica de Comentarios (Add Comment)
  // -------------------------------------------------------------------------

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (trimmedComment === "" || !story) return;

    try {
      const commentsRef = collection(db, "stories", story.id, "comments");

      const newCommentData = {
        content: trimmedComment,
        createdAt: serverTimestamp(),
        // Se añadirá el ID del comentario en el front para facilitar la navegación a las replies
        repliesCount: 0,
      };

      const docRef = await addDoc(commentsRef, newCommentData);

      // Actualizar la lista de comentarios en el estado local inmediatamente
      setComments((prev) => [
        {
          id: docRef.id,
          ...newCommentData,
          createdAt: { toDate: () => new Date() },
        }, // Usar una estructura de Date para el formato en el front
        ...prev,
      ]);

      setNewComment("");

      // Opcional: actualizar el conteo de comentarios en el documento principal de la historia
      await updateDoc(doc(db, "stories", story.id), {
        commentsCount: increment(1),
      });

      // Actualizar el estado local de la historia con el nuevo conteo
      setStory((prev) => ({
        ...prev,
        commentsCount: (prev.commentsCount || 0) + 1,
      }));
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      alert("No se pudo enviar el comentario. Intenta de nuevo.");
    }
  };

  // -------------------------------------------------------------------------
  // E. Lógica de Reporte (Modal/Submit)
  // -------------------------------------------------------------------------

  const handleReport = (type, contentId, snippet) => {
    setReportModal({ visible: true, type, id: contentId, snippet });
    setReportReason("");
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setIsReporting(true);
    try {
      await addDoc(collection(db, "reports"), {
        storyId: story.id,
        type: reportModal.type, // 'story', 'comment', 'reply'
        contentId: reportModal.id,
        reason: reportReason.trim(),
        reportedAt: serverTimestamp(),
        contentSnippet: reportModal.snippet, // Guardar un fragmento para el admin
      });

      alert("Reporte enviado con éxito. Gracias por tu ayuda.");
      setReportModal({ visible: false, type: "", id: "", snippet: "" });
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      alert("Fallo al enviar el reporte. Intenta de nuevo.");
    } finally {
      setIsReporting(false);
    }
  };

  // -------------------------------------------------------------------------
  // F. Renderizado (Loader, Error, Contenido)
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div
        className="page-content"
        style={{ textAlign: "center", paddingTop: "50px" }}
      >
        <FaSpinner
          className="spinner"
          size={30}
          style={{ color: "var(--primary)" }}
        />
        <p>Cargando chisme...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="page-content"
        style={{ textAlign: "center", paddingTop: "50px" }}
      >
        <h1 style={{ color: "var(--error-color)" }}>¡Error!</h1>
        <p style={{ marginBottom: "20px" }}>{error}</p>
        <Link
          to="/"
          className="btn-primary"
          style={{ padding: "10px 20px", textDecoration: "none" }}
        >
          <FaArrowLeft style={{ marginRight: "5px" }} /> Volver al Inicio
        </Link>
      </div>
    );
  }

  if (!story) {
    return null; // No debería suceder si el error se maneja arriba
  }

  const categoryLabel = CATEGORY_MAP[story.category] || "Bochinche";

  // -------------------------------------------------------------------------
  // MODAL DE REPORTE (Renderizado flotante)
  // -------------------------------------------------------------------------

  const ReportModal = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={submitReport}
        className="card"
        style={{
          padding: "20px",
          width: "90%",
          maxWidth: "400px",
          margin: "20px",
        }}
      >
        <h2>Reportar Contenido 🚨</h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Estás reportando{" "}
          {reportModal.type === "story"
            ? "la historia"
            : `el ${reportModal.type}`}{" "}
          con fragmento:
          <em style={{ display: "block", margin: "5px 0", fontWeight: "bold" }}>
            &quot;{reportModal.snippet}...&quot;
          </em>
        </p>

        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Escribe el motivo del reporte (requerido)..."
          rows="3"
          required
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--secondary)",
            color: "var(--text-main)",
            resize: "vertical",
            marginBottom: "10px",
          }}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button
            type="button"
            onClick={() => setReportModal({ visible: false })}
            className="btn-secondary"
            style={{ flexGrow: 1, padding: "10px" }}
            disabled={isReporting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ flexGrow: 2, padding: "10px" }}
            disabled={isReporting || !reportReason.trim()}
          >
            {isReporting ? <FaSpinner className="spinner" /> : "Enviar Reporte"}
          </button>
        </div>
      </form>
    </div>
  );

  // -------------------------------------------------------------------------
  // VISTA PRINCIPAL
  // -------------------------------------------------------------------------

  return (
    <div className="page-content">
      {reportModal.visible && <ReportModal />}

      {/* Header de Historia */}
      <div
        className="story-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <Link
          to="/stories"
          style={{
            textDecoration: "none",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: "bold",
          }}
        >
          <FaArrowLeft /> Archivo
        </Link>
        <span
          style={{
            background: "var(--primary)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: "bold",
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Contenido de Historia */}
      <h1 className="story-title">{story.title}</h1>

      <div
        className="story-meta"
        style={{
          display: "flex",
          gap: "15px",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          marginBottom: "20px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaRegClock /> {formatTimeAgo(story.publishedAt)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaUserSecret /> Anónimo
        </span>
      </div>

      <div className="story-content">
        {/* Usar whiteSpace: 'pre-wrap' para respetar saltos de línea y formato */}
        <p style={{ whiteSpace: "pre-wrap" }}>{story.content}</p>
      </div>

      {/* Acciones y Reporte de Historia */}
      <div
        className="story-actions"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 0",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          margin: "20px 0",
        }}
      >
        <button
          onClick={handleLike}
          style={{
            background: "none",
            border: "none",
            color: isLiked ? "var(--primary)" : "var(--nav-link)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          <FaHeart size={20} />
          {story.likes || 0} Me Gusta
        </button>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--nav-link)",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            <FaCommentAlt size={20} />
            {story.commentsCount || 0} Comentarios
          </span>
          <button
            onClick={() => handleReport("story", story.id, story.title)}
            style={{
              background: "none",
              border: "1px solid var(--error-color)",
              color: "var(--error-color)",
              padding: "5px 10px",
              borderRadius: "15px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            <FaFlag /> Reportar
          </button>
        </div>
      </div>

      {/* Sección de Comentarios */}
      <h2
        style={{
          fontSize: "1.5rem",
          marginTop: "30px",
          marginBottom: "20px",
          borderBottom: "2px solid var(--primary)",
          paddingBottom: "5px",
        }}
      >
        <FaCommentAlt
          style={{ marginRight: "10px", color: "var(--primary)" }}
        />{" "}
        Comentarios
      </h2>

      {/* Formulario de Comentario */}
      <form onSubmit={handleCommentSubmit} style={{ marginBottom: "40px" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Suelta tu opinión (Anónimo)..."
          rows="3"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "15px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-main)",
            resize: "none",
            marginBottom: "10px",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", padding: "12px" }}
        >
          Enviar Comentario
        </button>
      </form>

      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              storyId={id}
              handleReport={handleReport}
              handleCommentUpdate={handleCommentUpdate}
            />
          ))
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Sé el primero en comentar este chisme.
          </p>
        )}
      </div>
    </div>
  );
}
