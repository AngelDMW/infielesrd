// src/pages/Search.jsx - VERSIÓN CON BÚSQUEDA POR PREFIJO, FILTROS Y ORDEN

import { useState, useCallback, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaSearch, FaTimesCircle, FaBookOpen, FaHeart, FaEye, FaFilter, FaSort, FaCheckCircle } from 'react-icons/fa';

// Opciones de ordenamiento
const ORDER_OPTIONS = {
    'publishedAt_desc': { label: 'Más Recientes', field: 'publishedAt', direction: 'desc' },
    'publishedAt_asc': { label: 'Más Antiguas', field: 'publishedAt', direction: 'asc' },
    'views_desc': { label: 'Más Vistas', field: 'views', direction: 'desc' },
    'likes_desc': { label: 'Más Gustadas', field: 'likes', direction: 'desc' },
};

// Opciones de categoría (Ejemplo: debes cargarlas desde Firestore si usas una colección)
// Por ahora, usamos un ejemplo base.
const CATEGORIES = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'uncategorized', label: 'Sin Categorizar' },
    { value: 'infidelity', label: 'Infidelidad' },
    { value: 'confession', label: 'Confesiones' },
];


export default function Search() {
    const { dark } = useTheme();
    const [searchTerm, setSearchTerm] = useState("");
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState('publishedAt_desc');

    // Función de búsqueda (se ejecuta al hacer clic o al cambiar los filtros)
    const handleSearch = useCallback(async () => {
        if (searchTerm.trim().length < 3 && selectedCategory === 'all' && selectedOrder === 'publishedAt_desc') {
            setStories([]);
            setError("Ingresa al menos 3 caracteres en el título para buscar, o usa los filtros.");
            return;
        }

        setLoading(true);
        setError(null);
        setStories([]);
        
        // Configurar el ordenamiento
        const orderConfig = ORDER_OPTIONS[selectedOrder];

        // Consulta base: solo historias aprobadas
        let q = collection(db, "stories");
        let queryConstraints = [
            where("status", "==", "approved"),
        ];
        
        // 1. FILTRO POR CATEGORÍA
        if (selectedCategory !== 'all') {
            queryConstraints.push(where("category", "==", selectedCategory));
        }

        // 2. FILTRO POR TÍTULO (BÚSQUEDA POR PREFIJO)
        // Firestore solo permite buscar si la cadena *comienza* con.
        if (searchTerm.trim().length >= 3) {
             const startCode = searchTerm.trim();
             const endCode = startCode + '\uf8ff'; // Carácter Unicode que garantiza la última cadena posible
             
             // Nota: Firestore requiere que el campo de orden esté antes o sea el mismo que el campo de filtro de rango.
             queryConstraints.push(
                where("title", ">=", startCode),
                where("title", "<=", endCode)
             );
        }

        // 3. ORDENAMIENTO
        queryConstraints.push(
            orderBy(orderConfig.field, orderConfig.direction),
            limit(20) // Límite por defecto para la búsqueda
        );
        
        try {
            const finalQuery = query(q, ...queryConstraints);
            const snap = await getDocs(finalQuery);

            const results = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                publishedDate: doc.data().publishedAt ? new Date(doc.data().publishedAt).toLocaleDateString() : 'N/A',
                preview: doc.data().content ? doc.data().content.substring(0, 150) + '...' : 'Sin contenido'
            }));
            
            if (results.length === 0) {
                setError("No se encontraron historias que coincidan con los criterios.");
            }
            setStories(results);

        } catch (err) {
            console.error("Error al ejecutar búsqueda:", err);
            setError("Ocurrió un error al buscar. Asegúrate de que las reglas de índice compuestas sean correctas en Firebase.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, selectedOrder]);

    // Ejecuta la búsqueda automáticamente cuando se cambian los filtros (después de la carga inicial)
    useEffect(() => {
        // Ejecutar búsqueda solo si hay criterios o filtros activos
        if (searchTerm.trim().length > 0 || selectedCategory !== 'all' || selectedOrder !== 'publishedAt_desc') {
            handleSearch();
        }
    }, [selectedCategory, selectedOrder]); // Ejecuta al cambiar categoría u orden

    // Limpiar la búsqueda
    const clearSearch = () => {
        setSearchTerm("");
        setStories([]);
        setError(null);
        setSelectedCategory('all');
        setSelectedOrder('publishedAt_desc');
    };


    return (
        <div className="page-content">
            <h1 className="section-title"><FaSearch /> Buscar y Filtrar Historias</h1>

            {/* FORMULARIO DE BÚSQUEDA */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por Título (min 3 caracteres)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            flexGrow: 1, 
                            padding: '10px', 
                            borderRadius: '8px 0 0 8px', 
                            border: '1px solid var(--card-border)', 
                            background: dark ? '#333' : '#fff', 
                            color: 'var(--text)' 
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: '10px 15px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '0 8px 8px 0' }}
                    >
                        {loading ? <FaCheckCircle /> : <FaSearch />}
                    </button>
                    {searchTerm.length > 0 && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            style={{ padding: '10px', background: '#e53e3e', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px', marginLeft: '5px' }}
                        >
                            <FaTimesCircle />
                        </button>
                    )}
                </div>
            </form>

            {/* CONTROLES DE FILTRO Y ORDENAMIENTO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px' }}>
                
                {/* SELECT DE CATEGORÍA */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <FaFilter style={{ marginRight: '5px', color: 'var(--primary)' }} />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#fff', color: 'var(--text)', width: '100%' }}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                {/* SELECT DE ORDEN */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <FaSort style={{ marginRight: '5px', color: 'var(--primary)' }} />
                    <select
                        value={selectedOrder}
                        onChange={(e) => setSelectedOrder(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#fff', color: 'var(--text)', width: '100%' }}
                    >
                        {Object.entries(ORDER_OPTIONS).map(([key, option]) => (
                            <option key={key} value={key}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* RESULTADOS */}
            <div>
                {loading && <p style={{ textAlign: 'center' }}>Buscando historias...</p>}
                
                {error && <p style={{ color: '#e53e3e', textAlign: 'center' }}>{error}</p>}
                
                {!loading && stories.length > 0 && (
                     <p style={{ color: 'var(--nav-link)', marginBottom: '15px' }}>
                         <FaBookOpen style={{marginRight:'5px'}}/> Se encontraron **{stories.length} historias** que coinciden.
                     </p>
                )}
                
                <div className="stories-list">
                    {stories.map(story => (
                        <Link 
                            key={story.id} 
                            to={`/story/${story.id}`} 
                            style={{ 
                                textDecoration: 'none', 
                                color: 'inherit',
                                display: 'block',
                                marginBottom: '15px',
                                padding: '15px',
                                borderRadius: '8px',
                                background: dark ? 'var(--card-bg)' : '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                border: '1px solid var(--card-border)'
                            }}
                        >
                            <h2 style={{fontSize: '1.2rem', margin: '0 0 5px 0', color: 'var(--primary)'}}>{story.title}</h2>
                            <p style={{fontSize: '0.9rem', color: 'var(--nav-link)', marginBottom: '10px'}}>
                              Publicado: {story.publishedDate}
                            </p>
                            <p style={{fontSize: '1rem', margin: '0 0 10px 0', color: 'var(--text)'}}>{story.preview}</p>
                            
                            <div style={{display: 'flex', gap: '15px', fontSize: '0.9rem', color: 'var(--nav-link)'}}>
                                <span><FaHeart style={{color: 'var(--primary)', marginRight: '3px'}} /> {story.likes || 0}</span>
                                <span><FaEye style={{marginRight: '3px'}} /> {story.views || 0}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}