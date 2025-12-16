import { Link } from "react-router-dom";
import { formatTimeAgo } from "../utils/timeFormat";
import { FaHeart, FaRegComment } from "react-icons/fa";

export default function FeedCard({ story }) {
  if (!story) return null;

  // Lógica de Categoría Personalizada para la Tarjeta
  const displayCategory =
    story.category === "other" && story.customLabel
      ? `✨ ${story.customLabel}`
      : story.category === "infidelity"
      ? "Infidelidad"
      : story.category === "confession"
      ? "Confesión"
      : story.category === "dating"
      ? "Citas"
      : "Bochinche";

  return (
    <article
      className="feed-card active-press"
      style={{
        background: "var(--surface)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border-subtle)",
        position: "relative",
        overflow: "hidden",
        marginBottom: "15px",
      }}
    >
      {/* Badge Categoría */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-secondary)",
            background: "var(--bg-body)",
            padding: "4px 8px",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {displayCategory}
        </span>
      </div>

      <Link
        to={`/story/${story.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <h3
          style={{
            marginTop: "20px",
            marginBottom: "10px",
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--text-main)",
          }}
        >
          {story.title}
        </h3>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-main)",
            opacity: 0.8,
            lineHeight: "1.5",
            marginBottom: "15px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {story.content}
        </p>
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "15px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            <FaHeart
              color={story.likes > 0 ? "var(--primary)" : "currentColor"}
            />{" "}
            {story.likes || 0}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            <FaRegComment /> {story.commentsCount || 0}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {formatTimeAgo(story.createdAt)}
        </span>
      </div>
    </article>
  );
}
