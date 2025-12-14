// src/pages/Stories.jsx - Versión Corregida con Filtro Aprobado y Categorías

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from 'react-router-dom';
import { FaBookOpen, FaFilter, FaHeart, FaCommentAlt, FaRegClock, FaSearch, FaTags } from 'react-icons/fa';
import { formatTimeAgo } from '../utils/timeFormat'; 
import Loader from '../components/Loader';

// Mapeo simple de categorías para mostrar la etiqueta de forma legible
const CATEGORY_MAP = {
    infidelity: "Infidelidad",
    confession: "Confesiones",
    dating: "Citas",
    uncategorized: "Otros",
    pending: "Pendiente" // Aunque no debería mostrarse, se deja por seguridad
};

// Tarjeta de Historia para el Feed (Corregida)
const StoryFeedItem = ({ story }) => {
    const categoryLabel = CATEGORY_MAP[story.category] || 'Bochinche';

    return (
        <Link to={`/story/${story.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
            <div className="card fade-in" style={{
                marginBottom: '20px', 
                padding: '25px', 
                borderLeft: '5px solid var(--primary)' // Estilo moderno
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <FaRegClock /> {formatTimeAgo(story.publishedAt)}
                    </span>
                    {/* CRÍTICO: Mostrar la categoría real */}
                    <span style={{background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold'}}>
                        {categoryLabel}
                    </span>
                </div>

                <h2 className="story-title-list">{story.title}</h2>

                {/* Resumen de estadísticas */}
                <div style={{display: 'flex', gap: '15px', marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <FaHeart style={{color: 'var(--primary)'}} /> {story.likes || 0}
                    </span>
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <FaCommentAlt /> {story.commentsCount || 0}
                    </span>
                </div>
            </div>
        </Link>
    );
};

// =========================================================================
// Stories Page (Corregida)
// =========================================================================

const STORIES_PER_PAGE = 10;

export default function Stories() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el buscador
    const [selectedCategory, setSelectedCategory] = useState('all'); // Estado para el filtro

    const loadStories = async (isInitialLoad = true) => {
        setLoading(true);
        try {
            let q;
            const collectionRef = collection(db, "stories");
            
            // 1. Construir la consulta de base
            let baseQuery = [
                // CRÍTICO: SOLO mostrar historias aprobadas
                where("status", "==", "approved") 
            ];

            // 2. Aplicar filtro de categoría si no es 'all'
            if (selectedCategory !== 'all') {
                 baseQuery.push(where("category", "==", selectedCategory));
            }
            
            // 3. Aplicar ordenamiento
            baseQuery.push(orderBy("publishedAt", "desc"));
            
            // 4. Aplicar paginación
            if (!isInitialLoad && lastVisible) {
                baseQuery.push(startAfter(lastVisible));
            }
            
            baseQuery.push(limit(STORIES_PER_PAGE));
            
            q = query(collectionRef, ...baseQuery);

            const documentSnapshots = await getDocs(q);
            
            const newStories = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Actualizar estado
            setStories(prevStories => isInitialLoad ? newStories : [...prevStories, ...newStories]);
            
            // Guardar el último documento visible para la próxima carga
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            
        } catch (error) {
            console.error("Error al cargar historias:", error);
            // Podrías establecer un estado de error para el usuario aquí
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStories(true);
    }, [selectedCategory]); // Recargar cada vez que cambie el filtro

    // Función para manejar la búsqueda en el lado del cliente (para simplicidad)
    // Usamos useMemo para no recalcular la lista en cada render
    const filteredStories = useMemo(() => {
        if (!searchTerm) {
            return stories;
        }
        const term = searchTerm.toLowerCase();
        return stories.filter(story => 
            story.title.toLowerCase().includes(term) || 
            story.content.toLowerCase().includes(term)
        );
    }, [stories, searchTerm]);

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    return (
        <div className="page-content">
            <h1 className="section-title"><FaBookOpen /> Archivo de Historias</h1>
            
            {/* BARRA DE BÚSQUEDA Y FILTRO */}
            <div className="stories-search-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--nav-link)' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar historias por título o contenido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--secondary)', color: 'var(--text)' }}
                    />
                </div>
                
                <select 
                    value={selectedCategory} 
                    onChange={handleCategoryChange} 
                    style={{ 
                        padding: '10px 15px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--card-border)', 
                        background: 'var(--secondary)', 
                        color: 'var(--text)',
                        fontWeight: '600'
                    }}
                >
                    <option value="all">Todas</option>
                    <option value="infidelity">{CATEGORY_MAP.infidelity}</option>
                    <option value="confession">{CATEGORY_MAP.confession}</option>
                    <option value="dating">{CATEGORY_MAP.dating}</option>
                    <option value="uncategorized">{CATEGORY_MAP.uncategorized}</option>
                </select>
            </div>


            {/* MENSAJE DE SIN RESULTADOS */}
            {filteredStories.length === 0 && !loading && (
                <p style={{textAlign: 'center', marginTop: '50px', color: 'var(--text-secondary)'}}>
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}".` : 'No hay historias publicadas aún. ¡Sé el primero!'}
                </p>
            )}
            
            {/* LISTA DE HISTORIAS */}
            {filteredStories.map(story => <StoryFeedItem key={story.id} story={story} />)}
            
            {/* LOADER Y BOTÓN DE CARGAR MÁS */}
            {loading && <Loader message="Buscando más chismes..." />}
            
            {!loading && lastVisible && !searchTerm && ( 
                <button 
                    onClick={() => loadStories(false)} 
                    className="btn-primary"
                    style={{width: '100%', marginTop: '20px', padding: '15px'}}
                >
                    Cargar más historias
                </button>
            )}
        </div>
    );
}