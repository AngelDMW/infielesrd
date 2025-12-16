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
import { FaCompass, FaSearch, FaTimes } from "react-icons/fa";
import FeedCard from "../components/FeedCard";
import Loader from "../components/Loader";
import { useSearchParams } from "react-router-dom";

// Mapeo de categorías
const CATEGORY_MAP = {
  infidelity: "💔 Infidelidad",
  confession: "🤫 Confesión",
  dating: "🔥 Citas",
  uncategorized: "📢 Bochinche",
  other: "👀 Varios",
};

const STORIES_PER_PAGE = 10;

export default function Stories() {
  // Estados de Datos
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Estados de Búsqueda y Filtro
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all");
  
  // Estados del Buscador
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Sincronizar URL con Categoría
  useEffect(() => {
    const currentCat = searchParams.get("category") || "all";
    setSelectedCategory(currentCat);
  }, [searchParams]);

  // ✅ 1. EFECTO INTELIGENTE: Si borras el texto, resetea todo
  useEffect(() => {
    if (searchTerm === "") {
        setIsSearching(false);
        // Solo recargamos si no estábamos ya en el estado inicial
        if (isSearching) {
            loadStories(true);
        }
    }
  }, [searchTerm]);

  // Cargar Historias (Feed Normal Paginado)
  const loadStories = async (isInitialLoad = true) => {
    if (isInitialLoad) setLoading(true);
    
    try {
      const baseQuery = [where("status", "==", "approved")];

      if (selectedCategory !== "all") {
        baseQuery.push(where("category", "==", selectedCategory));
      }

      baseQuery.push(orderBy("createdAt", "desc"));

      if (!isInitialLoad && lastVisible) {
        baseQuery.push(startAfter(lastVisible));
      }

      baseQuery.push(limit(STORIES_PER_PAGE));

      const q = query(collection(db, "stories"), ...baseQuery);
      const snapshots = await getDocs(q);

      const newStories = snapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStories((prev) => (isInitialLoad ? newStories : [...prev, ...newStories]));
      
      if (snapshots.docs.length < STORIES_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastVisible(snapshots.docs[snapshots.docs.length - 1]);
      }

    } catch (error) {
      console.error("Error cargando feed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. BUSCADOR INTELIGENTE (Client-Side Search)
  // Descarga las últimas 100 historias y filtra en memoria para ignorar mayúsculas/acentos
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setIsSearching(true);

    try {
        // Obtenemos un lote grande de historias aprobadas (Ej: últimas 50 o 100)
        // Esto evita el problema de que Firebase no soporte "CONTAINS" o "Ignorar Mayúsculas"
        const q = query(
            collection(db, "stories"),
            where("status", "==", "approved"),
            orderBy("createdAt", "desc"),
            limit(50) // Ajustar según necesidad. 50 es un buen número para búsqueda rápida.
        );

        const snapshot = await getDocs(q);
        const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const term = searchTerm.toLowerCase();

        // Filtrado en JavaScript (Más potente que Firebase nativo)
        const filteredResults = allDocs.filter(s => 
            (s.title && s.title.toLowerCase().includes(term)) || 
            (s.content && s.content.toLowerCase().includes(term))
        );

        setStories(filteredResults);
        setHasMore(false); // En búsqueda deshabilitamos "cargar más" por simplicidad
    } catch (error) {
        console.error("Error en búsqueda:", error);
    } finally {
        setLoading(false);
    }
  };

  // Efecto para recargar si cambia la categoría (y limpiar búsqueda)
  useEffect(() => {
    if (!isSearching) {
        setStories([]);
        setLastVisible(null);
        setHasMore(true);
        loadStories(true);
    }
  }, [selectedCategory]);

  const handleCategoryChange = (cat) => {
    // Si cambia categoría, salimos del modo búsqueda
    setSearchTerm("");
    setIsSearching(false);
    if (cat === "all") setSearchParams({});
    else setSearchParams({ category: cat });
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "20px" }}>
        
        {/* Título Sección */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <div style={{
              background: "var(--surface)", padding: "10px", borderRadius: "50%",
              boxShadow: "var(--shadow-sm)", display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <FaCompass size={20} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Explorar</h1>
        </div>

        {/* 🔍 BARRA DE BÚSQUEDA CORREGIDA */}
        <form 
            onSubmit={handleSearchSubmit}
            style={{ position: 'relative', marginBottom: '10px' }}
        >
            <FaSearch 
                style={{ 
                    position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', 
                    color: 'var(--text-secondary)' 
                }} 
            />
            <input 
                type="text" 
                placeholder="Buscar chisme..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '100%',
                    padding: '14px 40px 14px 45px',
                    borderRadius: '50px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                }}
            />
            {/* Botón X para limpiar */}
            {searchTerm && (
                <button 
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        // El useEffect se encargará de resetear el feed
                    }}
                    style={{
                        position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                >
                    <FaTimes />
                </button>
            )}
        </form>

      </div>

      {/* FILTROS (Ocultar si estamos buscando) */}
      {!isSearching && (
          <div
            style={{
              display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", marginBottom: "20px",
              scrollbarWidth: "none", msOverflowStyle: "none"
            }}
          >
            <button
              onClick={() => handleCategoryChange("all")}
              style={filterBtnStyle(selectedCategory === "all")}
            >
              Todo
            </button>
            {Object.entries(CATEGORY_MAP).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                style={filterBtnStyle(selectedCategory === key)}
              >
                {label}
              </button>
            ))}
          </div>
      )}

      {/* RESULTADOS O FEED */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {isSearching && (
            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '-10px'}}>
                Resultados para: <strong>{searchTerm}</strong>
            </div>
        )}

        {stories.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            {isSearching 
                ? "No encontramos nada con esa palabra. 🧐" 
                : "No hay historias aquí todavía."}
          </div>
        )}

        {stories.map((story) => (
          <FeedCard key={story.id} story={story} />
        ))}
      </div>

      {loading && (
        <div style={{ padding: 20 }}>
          <Loader message={isSearching ? "Buscando en la base de datos..." : "Cargando historias..."} />
        </div>
      )}

      {/* Botón Cargar Más (Solo en Feed normal) */}
      {!loading && hasMore && !isSearching && (
        <button
          onClick={() => loadStories(false)}
          className="active-press"
          style={{
            width: "100%", marginTop: "20px", padding: "15px",
            background: "var(--surface)", border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", color: "var(--text-main)",
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Cargar más historias
        </button>
      )}
    </div>
  );
}

const filterBtnStyle = (isActive) => ({
  padding: "8px 16px",
  borderRadius: "20px",
  border: "none",
  background: isActive ? "var(--text-main)" : "var(--surface)",
  color: isActive ? "var(--surface)" : "var(--text-main)",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
  flexShrink: 0,
  boxShadow: "var(--shadow-sm)",
  whiteSpace: "nowrap"
});