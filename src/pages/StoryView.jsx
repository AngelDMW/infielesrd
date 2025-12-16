import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
  arrayUnion
} from "firebase/firestore";
import { db } from "../firebase";
import { getAnonymousID } from "../utils/identity";
import {
  FaHeart, FaRegHeart, FaArrowLeft, FaPaperPlane, FaFlag, FaShare,
  FaSpinner, FaUserSecret, FaGavel, FaRadiation, FaBiohazard,
  FaPepperHot, FaMapMarkerAlt
} from "react-icons/fa";
import { formatTimeAgo } from "../utils/timeFormat";
import Loader from "../components/Loader";
import { PROVINCES, CATEGORIES } from "../utils/constants";
import ReportModal from "../components/ReportModal";
import { incrementStoryRead } from "../utils/gamification";

const CURRENT_USER_ID = getAnonymousID();

const TOXIC_CONFIG = {
  1: { color: "#4ade80", icon: null, label: "Tranqui" },
  2: { color: "#fbbf24", icon: FaPepperHot, label: "Picante" },
  3: { color: "#f97316", icon: FaBiohazard, label: "Tóxico" },
  4: { color: "#ef4444", icon: FaRadiation, label: "Chernobyl" }
};

const VerdictBar = ({ label, count, total, color, onClick, selected }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div onClick={onClick} className="active-press" style={{ marginBottom: '12px', cursor: 'pointer', opacity: selected ? 1 : 0.8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
        <span style={{color: 'var(--text-main)'}}>{label}</span>
        <span style={{color: 'var(--text-secondary)'}}>{percentage}%</span>
      </div>
      <div style={{ height: '12px', background: 'var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
      </div>
      {selected && <div style={{textAlign: 'center', fontSize: '0.7rem', color: color, marginTop: '2px'}}>¡Tu voto!</div>}
    </div>
  );
};

export default function StoryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    // 1. Verificar Like Local
    const likedStories = JSON.parse(localStorage.getItem('liked_stories') || '[]');
    if (likedStories.includes(id)) setIsLiked(true);

    // 2. Verificar Voto Local
    const localVote = localStorage.getItem(`vote_${id}`);
    if (localVote) { setHasVoted(true); setVoteType(localVote); }

    // 3. Registrar Lectura
    incrementStoryRead(id);

    // 4. Firebase Snapshot
    const docRef = doc(db, "stories", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) { setStory({ id: docSnap.id, ...docSnap.data() }); } 
      else { setStory(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // ✅ MANEJADOR DE LIKE CORREGIDO
  const handleLike = async () => {
    // 1. Optimistic UI
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    
    // 2. LocalStorage
    const likedStories = JSON.parse(localStorage.getItem('liked_stories') || '[]');
    if (newStatus) {
      if (!likedStories.includes(id)) likedStories.push(id);
    } else {
      const idx = likedStories.indexOf(id);
      if (idx > -1) likedStories.splice(idx, 1);
    }
    localStorage.setItem('liked_stories', JSON.stringify(likedStories));

    // 3. Firebase
    try { 
        await updateDoc(doc(db, "stories", id), { likes: increment(newStatus ? 1 : -1) }); 
    } 
    catch (e) { 
        console.error(e); 
        setIsLiked(!newStatus); // Revertir si falla
    }
  };

  const handleVote = async (type) => {
    if (hasVoted) return;
    setHasVoted(true); setVoteType(type);
    localStorage.setItem(`vote_${id}`, type);
    const fieldMap = { him: "votes_him", her: "votes_her", toxic: "votes_toxic" };
    try { await updateDoc(doc(db, "stories", id), { [fieldMap[type]]: increment(1), votes_total: increment(1) }); } 
    catch (e) { console.error(e); }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setIsSending(true);
    const newComment = { id: Date.now().toString(), text: commentText, authorId: CURRENT_USER_ID, createdAt: new Date().toISOString() };
    try { await updateDoc(doc(db, "stories", id), { comments: arrayUnion(newComment), commentsCount: increment(1) }); setCommentText(""); } 
    catch (e) { console.error(e); } 
    finally { setIsSending(false); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: story?.title || "InfielesRD", text: `🔥 Mira este bochinche: ${story?.title}`, url: window.location.href }); } 
      catch (err) {}
    } else { navigator.clipboard.writeText(window.location.href); alert("Enlace copiado"); }
  };

  if (loading) return <Loader />;
  if (!story) return <div style={{ padding: 20, textAlign: 'center' }}>Historia no encontrada</div>;

  const vHim = story.votes_him || 0; const vHer = story.votes_her || 0; const vToxic = story.votes_toxic || 0;
  const vTotal = story.votes_total || (vHim + vHer + vToxic) || 0;
  const toxicLevel = story.toxicity || 1;
  const toxicData = TOXIC_CONFIG[toxicLevel] || TOXIC_CONFIG[1];
  const catObj = CATEGORIES.find(c => c.value === story.category) || {};
  const categoryLabel = (story.category === "other" && story.customLabel) ? story.customLabel : catObj.label || "Bochinche";
  const provObj = PROVINCES.find(p => p.value === story.province);
  const provLabel = provObj ? provObj.label : story.province;

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--text-main)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          <FaArrowLeft /> Volver
        </button>
        <div style={{ display: "flex", gap: "15px" }}>
          <FaShare size={20} onClick={handleShare} style={{cursor: 'pointer', color: 'var(--text-main)'}} />
          <FaFlag size={20} onClick={() => setShowReportModal(true)} style={{cursor: 'pointer', color: 'var(--text-secondary)'}} />
        </div>
      </div>

      <article style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
        {toxicLevel > 1 && (
           <div style={{ background: `${toxicData.color}20`, color: toxicData.color, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px', borderBottom: `1px solid ${toxicData.color}40` }}>
              <toxicData.icon size={18} /> <span>NIVEL: {toxicData.label.toUpperCase()}</span>
           </div>
        )}
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-body)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaUserSecret size={26} color="var(--text-main)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Anónimo</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {formatTimeAgo(story.createdAt)}
              {provLabel && ( <span style={{display: 'flex', alignItems: 'center', gap: '3px'}}>• <FaMapMarkerAlt size={11} /> {provLabel}</span> )}
              • <span style={{ color: "var(--primary)", fontWeight: 600 }}>{categoryLabel}</span>
            </span>
          </div>
        </div>
        <div style={{ padding: "24px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "16px", lineHeight: 1.3 }}>{story.title}</h1>
          <p style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>{story.content}</p>
        </div>
        <div style={{ padding: "15px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "20px" }}>
          <button onClick={handleLike} className="active-press" style={{ background: "var(--bg-body)", border: "none", padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px", color: isLiked ? "var(--primary)" : "var(--text-main)", fontWeight: 600, cursor: "pointer" }}>
            {isLiked ? <FaHeart color="#ed4956" /> : <FaRegHeart />} {story.likes || 0} Likes
          </button>
        </div>
      </article>

      <div style={{ marginTop: '30px', background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
           <div style={{background: 'var(--text-main)', color: 'var(--surface)', padding: '8px', borderRadius: '8px'}}> <FaGavel size={20} /> </div>
           <h3 style={{margin: 0, fontSize: '1.2rem'}}>Veredicto del Pueblo</h3>
        </div>
        {!hasVoted ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
             <button onClick={() => handleVote('him')} className="active-press" style={verdictBtnStyle('#002d62')}>😡 Él es un Perro</button>
             <button onClick={() => handleVote('her')} className="active-press" style={verdictBtnStyle('#d90429')}>😒 Ella está Loca</button>
             <button onClick={() => handleVote('toxic')} className="active-press" style={verdictBtnStyle('#6c757d')}>☢️ Tóxicos los Dos</button>
          </div>
        ) : (
          <div>
            <VerdictBar label="Él es un Perro" count={vHim} total={vTotal} color="#002d62" selected={voteType === 'him'} />
            <VerdictBar label="Ella está Loca" count={vHer} total={vTotal} color="#d90429" selected={voteType === 'her'} />
            <VerdictBar label="Tóxicos los Dos" count={vToxic} total={vTotal} color="#6c757d" selected={voteType === 'toxic'} />
          </div>
        )}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px" }}>Comentarios ({story.commentsCount || 0})</h3>
        <div style={{ display: "flex", gap: "10px", background: "var(--surface)", padding: "15px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-subtle)" }}>
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escribe tu opinión..." style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--text-main)" }} />
          <button onClick={handleSendComment} disabled={!commentText.trim() || isSending} style={{ background: "var(--primary)", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !commentText.trim() ? 0.5 : 1 }}>
            {isSending ? <FaSpinner className="spin-icon" /> : <FaPaperPlane />}
          </button>
        </div>
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {story.comments?.map((comment, idx) => (
              <div key={idx} style={{ background: "var(--surface)", padding: "15px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                   <span style={{fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)'}}>Anónimo-{comment.authorId?.slice(-4) || '???'}</span>
                   <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>{comment.createdAt ? formatTimeAgo(new Date(comment.createdAt)) : ''}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-main)" }}>{comment.text}</p>
              </div>
          ))}
        </div>
      </div>

      {showReportModal && ( <ReportModal storyId={id} onClose={() => setShowReportModal(false)} /> )}
    </div>
  );
}

const verdictBtnStyle = (color) => ({
  padding: '15px', borderRadius: '12px', border: `1px solid ${color}`, background: 'transparent',
  color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
});