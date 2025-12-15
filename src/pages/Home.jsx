// src/pages/Home.jsx - CÓDIGO FINAL CORREGIDO (Estabilidad de Carga)

import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FaHeart,
  FaCommentAlt,
  FaSun,
  FaMoon,
  FaBullhorn,
  FaSpinner,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect, useCallback } from "react";
import { formatTimeAgo } from "../utils/timeFormat";

// Tarjeta Feed
const FeedCard = ({ story }) => (
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

export default function Home() {
  const { dark, toggleDark } = useTheme();
  const [popularStories, setPopularStories] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // EL CALENTÓN: Ordena por likes (principal), luego por fecha de creación (secundario)
      const qPop = query(
        collection(db, "stories"),
        where("status", "==", "approved"),
        orderBy("likes", "desc"),
        orderBy("createdAt", "desc"), // 👈 Añadido para robustez
        limit(5)
      );
      const snapPop = await getDocs(qPop);
      setPopularStories(snapPop.docs.map((d) => ({ id: d.id, ...d.data() }))); // ACABADITO DE SALIR: Ordena por fecha de publicación (principal), luego por fecha de creación (secundario)

      const qRec = query(
        collection(db, "stories"),
        where("status", "==", "approved"),
        orderBy("publishedAt", "desc"),
        orderBy("createdAt", "desc"), // 👈 Añadido para robustez
        limit(5)
      );
      const snapRec = await getDocs(qRec);
      setRecentStories(snapRec.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error cargando data de Home:", err); // Si ocurre un error, aseguramos que los arrays estén vacíos para mostrar mensajes de UX
      setPopularStories([]);
      setRecentStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); // Ejecuta solo al montar

  const LoadingIndicator = ({ text }) => (
    <div
      style={{
        padding: "20px 0",
        textAlign: "center",
        color: "var(--text-secondary)",
      }}
    >
      {" "}
      <FaSpinner
        className="spin-icon"
        size={20}
        style={{ marginBottom: "5px" }}
      />
      <p style={{ margin: 0 }}>{text}</p>{" "}
    </div>
  );

  return (
    <div className="app-container" style={{ paddingBottom: "100px" }}>
      {/* 1. HEADER DOMINICANO (Se mantiene) */}{" "}
      <div
        style={{
          padding: "20px 25px 10px 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {" "}
        <div>
          {" "}
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "2px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Klk, bienvenido a
          </p>{" "}
          <h1 style={{ fontSize: "2rem", lineHeight: "1" }}>
            Infiels<span className="text-gradient">RD</span> 🇩🇴
          </h1>{" "}
        </div>{" "}
        <button
          onClick={toggleDark}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "15px",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-main)",
            boxShadow: "var(--shadow)",
          }}
        >
          {" "}
          {dark ? <FaSun size={20} /> : <FaMoon size={20} />}{" "}
        </button>{" "}
      </div>
      {/* 2. HERO: SUELTA LA SOPA (Se mantiene) */}{" "}
      <div style={{ padding: "20px 25px" }}>
        {" "}
        <div
          style={{
            background: dark
              ? "linear-gradient(135deg, #002D62 0%, #CE1126 100%)"
              : "var(--primary-gradient)",
            borderRadius: "30px",
            padding: "30px 25px",
            color: "white",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 15px 35px rgba(206, 17, 38, 0.3)",
          }}
        >
          {" "}
          <div style={{ position: "relative", zIndex: 1 }}>
            {" "}
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                width: "fit-content",
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "10px",
                backdropFilter: "blur(5px)",
              }}
            >
              🤫 100% Anónimo{" "}
            </div>{" "}
            <h2
              style={{
                fontSize: "1.8rem",
                marginBottom: "10px",
                lineHeight: "1.1",
              }}
            >
              ¿Cuál es el
              <br />
              bochinche de hoy?
            </h2>{" "}
            <p
              style={{
                opacity: 0.9,
                marginBottom: "25px",
                fontSize: "0.95rem",
              }}
            >
              Desahógate sin miedo. Aquí nadie sabe quién eres.
            </p>{" "}
            <Link
              to="/submit"
              className="btn-primary"
              style={{ boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
            >
              <FaBullhorn /> Suelta la sopa{" "}
            </Link>{" "}
          </div>{" "}
          {/* Elementos decorativos abstractos (Se mantienen) */}{" "}
          <div
            style={{
              position: "absolute",
              right: "-30px",
              top: "-20px",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>{" "}
          <div
            style={{
              position: "absolute",
              right: "20px",
              bottom: "-50px",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>{" "}
        </div>{" "}
      </div>
      {/* 3. EL CALENTÓN (Scroll Horizontal) */}{" "}
      <div style={{ marginBottom: "35px" }}>
        {" "}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 25px",
            marginBottom: "15px",
            alignItems: "center",
          }}
        >
          {" "}
          <h2
            style={{
              fontSize: "1.3rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🔥 El Calentón{" "}
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: "normal",
              }}
            >
              (Top)
            </span>
          </h2>{" "}
        </div>{" "}
        <div
          style={{
            display: "flex",
            gap: "15px",
            overflowX: "auto",
            paddingBottom: "15px",
            paddingLeft: "25px",
            paddingRight: "25px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {" "}
          {loading ? (
            <LoadingIndicator text="Cargando el lío..." />
          ) : popularStories.length > 0 ? (
            popularStories.map((story) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  flex: "0 0 260px",
                }}
              >
                {" "}
                <div
                  style={{
                    background: "var(--surface)",
                    padding: "20px",
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {" "}
                  <h4
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "1rem",
                      lineHeight: "1.4",
                      fontWeight: "700",
                    }}
                  >
                    {story.title}
                  </h4>{" "}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: "600",
                    }}
                  >
                    {" "}
                    <span style={{ color: "var(--primary)" }}>
                      🔥 {story.likes} Fuego
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
              </Link>
            ))
          ) : (
            !loading && (
              <p
                style={{ paddingLeft: "25px", color: "var(--text-secondary)" }}
              >
                Aún no hay historias con mucho 🔥. ¡Sé el primero en comentar!
              </p>
            )
          )}{" "}
        </div>{" "}
      </div>
      {/* 4. FEED: ACABADITO DE SALIR */}{" "}
      <div style={{ padding: "0 25px" }}>
        {" "}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          {" "}
          <h2
            style={{
              fontSize: "1.3rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            👀 Acabadito de salir
          </h2>{" "}
          <Link
            to="/stories"
            style={{
              fontSize: "0.9rem",
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Ver to'
          </Link>{" "}
        </div>{" "}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {" "}
          {loading ? (
            <LoadingIndicator text="Buscando chismes..." />
          ) : recentStories.length > 0 ? (
            recentStories.map((story) => (
              <FeedCard key={story.id} story={story} />
            ))
          ) : (
            !loading && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  padding: "20px 0",
                }}
              >
                Aún no hay historias recién salidas. ¡Sé el primero en enviar
                una!
              </p>
            )
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
