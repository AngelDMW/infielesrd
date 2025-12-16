import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase";
import { FaCompass, FaSearch } from "react-icons/fa";
import FeedCard from "../components/FeedCard"; // ✅ Usamos la tarjeta rica visualmente
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

// Mapeo simple de categorías
const CATEGORY_MAP = {
  infidelity: "Infidelidad",
  confession: "Confesiones",
  dating: "Citas",
  uncategorized: "Otros",
  other: "Varios",
};

const STORIES_PER_PAGE = 10;

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadStories = async (isInitialLoad = true) => {
    setLoading(true);
    try {
      const baseQuery = [where("status", "==", "approved")];
      if (selectedCategory !== "all")
        baseQuery.push(where("category", "==", selectedCategory));

      baseQuery.push(orderBy("createdAt", "desc"));
      if (!isInitialLoad && lastVisible)
        baseQuery.push(startAfter(lastVisible));
      baseQuery.push(limit(STORIES_PER_PAGE));

      const q = query(collection(db, "stories"), ...baseQuery);
      const snapshots = await getDocs(q);

      const newStories = snapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStories((prev) =>
        isInitialLoad ? newStories : [...prev, ...newStories]
      );
      setLastVisible(snapshots.docs[snapshots.docs.length - 1]);
    } catch (error) {
      console.error("Error cargando historias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories(true);
  }, [selectedCategory]);

  return (
    <div className="fade-in">
      {/* Header de la Sección */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "var(--surface)",
              padding: "10px",
              borderRadius: "50%",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <FaCompass size={20} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            Explorar
          </h1>
        </div>

        {/* Botón Buscar */}
        <Link
          to="/search"
          style={{
            background: "var(--surface)",
            padding: "10px",
            borderRadius: "50%",
            boxShadow: "var(--shadow-sm)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaSearch />
        </Link>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "15px",
          marginBottom: "10px",
          scrollbarWidth: "none",
        }}
      >
        <button
          onClick={() => setSelectedCategory("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "none",
            background:
              selectedCategory === "all"
                ? "var(--text-main)"
                : "var(--surface)",
            color:
              selectedCategory === "all"
                ? "var(--surface)"
                : "var(--text-main)",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Todo
        </button>
        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              background:
                selectedCategory === key
                  ? "var(--text-main)"
                  : "var(--surface)",
              color:
                selectedCategory === key
                  ? "var(--surface)"
                  : "var(--text-main)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Historias (Feed Cards Ricas) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {stories.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-secondary)",
            }}
          >
            No encontramos historias en esta categoría.
          </div>
        )}

        {stories.map((story) => (
          <FeedCard key={story.id} story={story} />
        ))}
      </div>

      {loading && (
        <div style={{ padding: 20 }}>
          <Loader />
        </div>
      )}

      {!loading && lastVisible && (
        <button
          onClick={() => loadStories(false)}
          className="active-press"
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "15px",
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-main)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cargar más historias
        </button>
      )}
    </div>
  );
}
