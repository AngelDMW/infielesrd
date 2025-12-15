import { useState } from "react";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeFormat";
import { FaHeart, FaRegHeart, FaRegComment, FaShare, FaEllipsisH } from "react-icons/fa";
import { doc, runTransaction, increment } from "firebase/firestore";
import { db } from "../firebase";
import { getAnonymousID } from "../utils/identity";

export default function FeedCard({ story }) {
  const currentUserId = getAnonymousID();
  const [isLiked, setIsLiked] = useState(() => !!localStorage.getItem(`liked_${story.id}_${currentUserId}`));
  const [likesCount, setLikesCount] = useState(story.likes || 0);
  const [animate, setAnimate] = useState(false);

  if (!story) return null;

  const handleLike = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);
    setAnimate(true); setTimeout(() => setAnimate(false), 300);

    const likedKey = `liked_${story.id}_${currentUserId}`;
    if (!prevLiked) localStorage.setItem(likedKey, "true"); else localStorage.removeItem(likedKey);

    const ref = doc(db, "stories", story.id);
    try {
      await runTransaction(db, async (t) => {
        const d = await t.get(ref); if (!d.exists()) throw "Err";
        t.update(ref, { likes: prevLiked ? increment(-1) : increment(1) });
      });
    } catch (e) { console.error(e); }
  };

  const handleShare = (e) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/story/${story.id}`;
    if (navigator.share) navigator.share({ title: "InfielesRD", text: story.title, url });
    else { navigator.clipboard.writeText(url); alert("Link copiado!"); }
  };

  return (
    <article className="feed-card active-press" style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-subtle)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Categoría Badge */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
         <span style={{ 
             fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
             color: 'var(--text-secondary)', background: 'var(--bg-body)', padding: '4px 8px', borderRadius: '6px'
         }}>
             {story.category === 'infidelity' ? 'Infidelidad' : 'Bochinche'}
         </span>
      </div>

      {/* Meta Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
        }}>🕵️</div>
        <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>Anónimo</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTimeAgo(story.publishedAt)}</span>
        </div>
      </div>

      {/* Contenido */}
      <Link to={`/story/${story.id}`} style={{ textDecoration: 'none' }}>
        <h3 style={{ 
            fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.3,
            color: 'var(--text-main)'
        }}>
            {story.title}
        </h3>
        <p style={{ 
            fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
            {story.content}
        </p>
      </Link>

      {/* Actions Footer */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: isLiked ? 'var(--primary)' : 'var(--text-main)' }}>
                <div style={{ transform: animate ? 'scale(1.3)' : 'scale(1)', transition: '0.2s' }}>
                    {isLiked ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{likesCount}</span>
            </button>
            
            <Link to={`/story/${story.id}`} style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaRegComment size={22} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{story.commentsCount || 0}</span>
            </Link>
         </div>

         <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <FaShare size={20} />
         </button>
      </div>
    </article>
  );
}