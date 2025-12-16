import { Link } from "react-router-dom";
import { FaFire, FaBolt, FaArrowRight, FaHashtag } from "react-icons/fa";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect } from "react";
import FeedCard from "../components/FeedCard";
import Loader from "../components/Loader";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const [popularStories, setPopularStories] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { dark } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        // El Calentón (Top Likes)
        const qPop = query(
          collection(db, "stories"),
          where("status", "==", "approved"),
          orderBy("likes", "desc"),
          limit(5)
        );
        const snapPop = await getDocs(qPop);
        setPopularStories(snapPop.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Feed Reciente
        const qRec = query(
          collection(db, "stories"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snapRec = await getDocs(qRec);
        setRecentStories(snapRec.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading)
    return (
      <div style={{ paddingTop: 100 }}>
        <Loader message="Buscando los archivos..." />
      </div>
    );

  return (
    <div className="fade-in home">
      {/* --- HERO SECTION: EL CALENTÓN --- */}
      <section style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            padding: "0 4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background:
                  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
                padding: "8px",
                borderRadius: "10px",
                color: "#d90429",
              }}
            >
              <FaFire size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                EL CALENTÓN
              </h2>
              <span
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                Lo más picante de la semana
              </span>
            </div>
          </div>
          <Link
            to="/stories"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Ver todo
          </Link>
        </div>

        {/* Scroll Horizontal de Tarjetas Verticales */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "20px",
            scrollSnapType: "x mandatory",
            maskImage: "linear-gradient(to right, black 90%, transparent 100%)", // Fade out al final
          }}
        >
          {popularStories.map((story, index) => (
            <Link
              key={story.id}
              to={`/story/${story.id}`}
              style={{ textDecoration: "none", scrollSnapAlign: "start" }}
            >
              <div
                className="active-press"
                style={{
                  width: "160px",
                  height: "240px",
                  background: dark ? "#1e1e1e" : "#ffffff",
                  borderRadius: "var(--radius-lg)",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Visual Header (Gradiente decorativo único por tarjeta) */}
                <div
                  style={{
                    height: "50%",
                    background:
                      index % 2 === 0
                        ? "linear-gradient(180deg, #d90429 0%, #ff4d6d 100%)"
                        : "linear-gradient(180deg, #002d62 0%, #4361ee 100%)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0.3,
                      backgroundImage:
                        "radial-gradient(#fff 1px, transparent 1px)",
                      backgroundSize: "10px 10px",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "rgba(255,255,255,0.2)",
                      backdropFilter: "blur(4px)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    #{index + 1}
                  </span>
                </div>

                {/* Contenido */}
                <div
                  style={{
                    padding: "12px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      margin: 0,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: "var(--text-main)",
                    }}
                  >
                    {story.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <FaBolt style={{ color: "var(--primary)" }} />{" "}
                    {story.likes || 0} interacciones
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- FEED SECTION --- */}
      <section>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: 4,
              height: 24,
              background: "var(--primary)",
              borderRadius: 2,
            }}
          />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
            Recién Salido
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {recentStories.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--text-secondary)",
                background: "var(--surface)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              No hay chismes nuevos. ¡Sé el primero!
            </div>
          ) : (
            recentStories.map((story) => (
              <FeedCard key={story.id} story={story} />
            ))
          )}
        </div>

        {/* Cargar más (Decorativo) */}
        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
            paddingBottom: "20px",
          }}
        >
          <Link
            to="/stories"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 28px",
              borderRadius: "50px",
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Explorar Archivo <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
