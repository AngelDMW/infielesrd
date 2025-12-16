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
  
  // 🔥 Nuevo Estado para el Buscador Integrado
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Para saber si estamos en modo búsqueda

  // Sincronizar URL con Categoría
  useEffect(() => {
    const currentCat = searchParams.get("category") || "all";
    setSelectedCategory(currentCat);
  }, [searchParams]);

  // Cargar Historias (Feed Normal)
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
      setIsSearching(false);
    }
  };

  // 🔥 Función de Búsqueda Profunda (Firebase)
  const performDatabaseSearch = async () => {
    if (!searchTerm.trim()) {
        loadStories(true); // Si borra, vuelve al feed normal
        return;
    }

    setLoading(true);
    setIsSearching(true); // Activamos modo búsqueda

    try {
        // NOTA: Firestore no tiene búsqueda "LIKE %texto%" nativa.
        // Usamos un truco de rango (startAt/endAt) para buscar por prefijo del título.
        // Para búsqueda avanzada real se necesitaría Algolia o ElasticSearch.
        const q = query(
            collection(db, "stories"),
            where("status", "==", "approved"),
            where("title", ">=", searchTerm),
            where("title", "<=", searchTerm + '\uf8ff'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtro adicional en cliente para asegurar (case insensitive)
        const filteredResults = results.filter(s => 
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setStories(filteredResults);
        setHasMore(false); // En búsqueda no paginamos igual
    } catch (error) {
        console.error("Error en búsqueda:", error);
        // Fallback: Filtrar lo que ya teníamos cargado si falla la red
        const localFilter = stories.filter(s => 
            s.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setStories(localFilter);
    } finally {
        setLoading(false);
    }
  };

  // Efecto para recargar si cambia la categoría (y limpiar búsqueda)
  useEffect(() => {
    setSearchTerm("");
    setIsSearching(false);
    setStories([]);
    setLastVisible(null);
    setHasMore(true);
    loadStories(true);
  }, [selectedCategory]);

  // Manejo de cambio de categoría
  const handleCategoryChange = (cat) => {
    if (cat === "all") setSearchParams({});
    else setSearchParams({ category: cat });
  };

  // Manejo del Submit del Buscador
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performDatabaseSearch();
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* --- HEADER CON BUSCADOR --- */}
      <div style={{ marginBottom: "20px" }}>
        
        {/* Título */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <div style={{
              background: "var(--surface)", padding: "10px", borderRadius: "50%",
              boxShadow: "var(--shadow-sm)", display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <FaCompass size={20} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Explorar</h1>
        </div>

        {/* 🔍 BARRA DE BÚSQUEDA INTEGRADA */}
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
                placeholder="Buscar chisme por título..." 
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
            {/* Botón de limpiar o buscar */}
            {searchTerm && (
                <button 
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        setIsSearching(false);
                        loadStories(true); // Recargar feed original
                    }}
                    style={{
                        position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        padding: '10px', cursor: 'pointer'
                    }}
                >
                    <FaTimes />
                </button>
            )}
        </form>

      </div>

      {/* --- FILTROS DE CATEGORÍA (Ocultar si estamos buscando para no confundir) --- */}
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

      {/* --- RESULTADOS DE BÚSQUEDA --- */}
      {isSearching && (
          <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Resultados para: <strong>"{searchTerm}"</strong>
          </div>
      )}

      {/* --- LISTA DE HISTORIAS --- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {stories.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            {isSearching 
                ? "No encontramos chismes con ese nombre. Intenta otra palabra." 
                : "No hay historias en esta categoría aún."}
          </div>
        )}

        {stories.map((story) => (
          <FeedCard key={story.id} story={story} />
        ))}
      </div>

      {loading && (
        <div style={{ padding: 20 }}>
          <Loader message={isSearching ? "Buscando..." : "Cargando historias..."} />
        </div>
      )}

      {/* Botón Cargar Más (Solo en modo Feed normal) */}
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

// Estilo auxiliar para botones de filtro
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