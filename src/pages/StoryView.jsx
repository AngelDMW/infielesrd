import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment, addDoc, runTransaction, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { getAnonymousID } from "../utils/identity";
import {
  FaHeart, FaRegHeart, FaArrowLeft, FaPaperPlane, FaFlag, FaShare, FaSpinner, FaUserSecret, FaReply, FaTimes
} from "react-icons/fa";
import { formatTimeAgo } from "../utils/timeFormat";
import Loader from "../components/Loader";

const CURRENT_USER_ID = getAnonymousID();

const CATEGORY_LABELS = {
  infidelity: "💔 Infidelidad",
  confession: "🤫 Confesión",
  dating: "🔥 Citas",
  uncategorized: "📢 Bochinche",
  pending: "⏳ Revisión",
  other: "👀 Varios"
};

// Generador de colores seguro
const getColorFromId = (id) => {
    if (!id) return '#1a1a1a'; 
    const colors = ['#ce1126', '#002d62', '#e67e22', '#16a085', '#8e44ad', '#2980b9', '#c0392b'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// --- COMPONENTE COMENTARIO ---
const CommentItem = ({ comment, onReply, onReport }) => {
    const [likes, setLikes] = useState(comment.likes || 0);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
    };

    const isMe = comment.authorId === CURRENT_USER_ID;
    const avatarBg = isMe ? '#000000' : getColorFromId(comment.authorId);

    return (
        <div style={{ marginBottom: '16px', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ 
                    minWidth: '36px', width: '36px', height: '36px', borderRadius: '50%', 
                    backgroundColor: avatarBg, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#ffffff', fontSize: '14px', marginTop: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {isMe ? 'Yo' : <FaUserSecret />}
                </div>
                
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {isMe ? 'Tú' : 'Anónimo'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {formatTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {comment.replyTo && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Repondiendo a: <strong>{comment.replyTo}</strong>
                        </div>
                    )}
                    
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button onClick={handleLike} className="active-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: isLiked ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                            {isLiked ? <FaHeart /> : <FaRegHeart />} {likes || 0}
                        </button>
                        <button onClick={() => onReply(comment)} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                            Responder
                        </button>
                        <button onClick={() => onReport(comment)} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
                            Reportar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function StoryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [story, setStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); 
  
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const docRef = doc(db, "stories", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return navigate("/404");

        setStory({ id: docSnap.id, ...docSnap.data() });
        const likedKey = `liked_${id}_${CURRENT_USER_ID}`;
        setIsLiked(!!localStorage.getItem(likedKey));

        const qComments = query(collection(db, "stories", id, "comments"), orderBy("createdAt", "asc"));
        const commentsSnap = await getDocs(qComments);
        setComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchStory();
  }, [id, navigate]);

  const handleLike = async () => {
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setAnimateLike(true); setTimeout(() => setAnimateLike(false), 300);
    setStory(prev => ({ ...prev, likes: prevLiked ? (prev.likes - 1) : (prev.likes + 1) }));

    const storyRef = doc(db, "stories", id);
    const likedKey = `liked_${id}_${CURRENT_USER_ID}`;
    if (!prevLiked) localStorage.setItem(likedKey, "true");
    else localStorage.removeItem(likedKey);

    try {
      await runTransaction(db, async (t) => {
        const sfDoc = await t.get(storyRef);
        if (sfDoc.exists()) t.update(storyRef, { likes: prevLiked ? increment(-1) : increment(1) });
      });
    } catch (e) { console.error(e); }
  };

  const handleShare = () => {
    if (navigator.share) {
        navigator.share({ title: "InfielesRD", text: `🔥 ${story.title}`, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Enlace copiado! 📋");
    }
  };

  const handleReport = () => {
      if(window.confirm("¿Deseas reportar esta historia?")) {
          alert("Reporte enviado.");
      }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      const newComment = {
        content: commentText.trim(), 
        authorId: CURRENT_USER_ID, 
        createdAt: serverTimestamp(), 
        likes: 0,
        replyTo: replyingTo ? (replyingTo.authorId === CURRENT_USER_ID ? 'Ti mismo' : 'Anónimo') : null
      };
      
      const docRef = await addDoc(collection(db, "stories", id, "comments"), newComment);
      await updateDoc(doc(db, "stories", id), { commentsCount: increment(1) });
      
      setComments(prev => [...prev, { id: docRef.id, ...newComment, createdAt: new Date() }]);
      setStory(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      setCommentText("");
      setReplyingTo(null); 
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) { alert("Error al comentar"); } 
    finally { setIsSending(false); }
  };

  // ✅ LÓGICA CATEGORÍA PERSONALIZADA
  const getDisplayCategory = () => {
      if (!story) return "";
      if (story.category === 'other' && story.customLabel) {
          return `✨ ${story.customLabel}`;
      }
      return CATEGORY_LABELS[story.category] || "Historia";
  };

  if (loading) return <div style={{paddingTop: 100}}><Loader /></div>;
  if (!story) return null;

  return (
    <div className="fade-in" style={{ paddingBottom: '100px', position: 'relative' }}>
      
      {/* Botón Volver Flotante */}
      <div style={{ 
          position: 'sticky', top: 20, zIndex: 50, 
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none' 
      }}>
          <button onClick={() => navigate(-1)} className="active-press" style={{ 
              pointerEvents: 'auto',
              marginLeft: '20px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '50%', width: 42, height: 42, 
              fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-main)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <FaArrowLeft />
          </button>
      </div>

      <main style={{ marginTop: '20px', padding: '0 20px' }}>
        
        {/* Info Autor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #ce1126 0%, #002d62 100%)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'white', fontSize: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <FaUserSecret />
                </div>
                <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', display: 'block', color: 'var(--text-main)' }}>Anónimo</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTimeAgo(story.publishedAt)}</span>
                </div>
            </div>
            
            {/* CATEGORÍA (Custom o Normal) */}
            <div style={{ 
                background: 'var(--bg-body)', padding: '6px 12px', borderRadius: '20px', 
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', 
                textTransform: 'uppercase', border: '1px solid var(--border-subtle)',
                maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
                {getDisplayCategory()}
            </div>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {story.title}
        </h1>
        
        <div style={{ fontSize: '1.15rem', lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '40px', fontFamily: 'Georgia, serif' }}>
          {story.content}
        </div>

        <div style={{ display: 'flex', gap: '10px', padding: '15px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '30px', boxShadow: 'var(--shadow-sm)' }}>
           <button onClick={handleLike} className="active-press" style={{ flex: 2, background: isLiked ? 'rgba(217,4,41,0.08)' : 'var(--bg-body)', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: isLiked ? 'var(--primary)' : 'var(--text-main)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
               <div style={{ transform: animateLike ? 'scale(1.4)' : 'scale(1)', transition: '0.2s' }}>{isLiked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}</div>
               {story.likes || 0}
           </button>
           <button onClick={handleShare} className="active-press" style={{ flex: 2, background: 'var(--bg-body)', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
               <FaShare size={18} />
           </button>
           <button onClick={handleReport} className="active-press" style={{ flex: 1, background: 'var(--bg-body)', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
               <FaFlag size={18} />
           </button>
        </div>

        <div>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Comentarios ({story.commentsCount || 0})
            </h3>
            
            {comments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Sé el primero en opinar 👇</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {comments.map(c => (
                        <CommentItem 
                            key={c.id} 
                            comment={c} 
                            onReply={(comment) => setReplyingTo(comment)} 
                            onReport={() => alert("Reporte enviado.")}
                        />
                    ))}
                </div>
            )}
            <div ref={scrollRef} />
        </div>
      </main>

      {/* Input Flotante */}
      <div style={{
          position: 'fixed', bottom: 0, 
          width: '100%', maxWidth: 'var(--max-feed-width)',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', 
          borderTop: '1px solid var(--border-subtle)',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
          {replyingTo && (
              <div style={{ padding: '8px 20px', background: 'var(--bg-body)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaReply /> Respondiendo a <strong>{replyingTo.authorId === CURRENT_USER_ID ? 'ti mismo' : 'Anónimo'}</strong></span>
                  <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}><FaTimes /></button>
              </div>
          )}

          <div style={{ padding: '15px 20px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe un comentario..."}
                style={{ flex: 1, padding: '14px 20px', borderRadius: '30px', border: '1px solid var(--border-subtle)', background: 'var(--bg-body)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
              />
              <button onClick={handleSendComment} disabled={!commentText.trim() || isSending} style={{ background: 'var(--primary)', color: 'white', border: 'none', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !commentText.trim() ? 0.5 : 1, boxShadow: '0 4px 10px rgba(206, 17, 38, 0.3)' }}>
                  {isSending ? <FaSpinner className="spin-icon" /> : <FaPaperPlane />}
              </button>
          </div>
      </div>
    </div>
  );
}