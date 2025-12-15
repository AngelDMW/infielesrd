import { FaHeart, FaCommentAlt } from "react-icons/fa";
import { formatTimeAgo } from "../utils/timeFormat";

export const FeedCard = ({ story }) => (
  <Link
    to={`/story/${story.id}`}
    style={{ textDecoration: "none", color: "inherit" }}
  >
    {" "}
    <div className="card fade-in" style={{ marginBottom: "15px" }}>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <span className="badge">📢 Bochinche</span>{" "}
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            fontWeight: "600",
          }}
        >
          {formatTimeAgo(story.publishedAt)}
        </span>{" "}
      </div>{" "}
      <h3
        style={{ fontSize: "1.15rem", marginBottom: "8px", lineHeight: "1.3" }}
      >
        {story.title}
      </h3>{" "}
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          marginBottom: "15px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {story.content}{" "}
      </p>{" "}
      <div
        style={{
          borderTop: "1px dashed var(--border)",
          paddingTop: "12px",
          display: "flex",
          gap: "20px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontWeight: "600",
        }}
      >
        {" "}
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaHeart style={{ color: "var(--primary)" }} /> {story.likes || 0}
        </span>{" "}
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaCommentAlt /> {story.commentsCount || 0}
        </span>{" "}
      </div>{" "}
    </div>{" "}
  </Link>
);
