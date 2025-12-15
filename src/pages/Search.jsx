// src/pages/Search.jsx

import { useState, useCallback, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaSearch, FaTimesCircle, FaBookOpen, FaHeart, FaEye, FaFilter, FaSort, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { formatTimeAgo } from '../utils/timeFormat';

const ORDER_OPTIONS = {
    'publishedAt_desc': { label: 'Más Recientes', field: 'publishedAt', direction: 'desc' },
    'publishedAt_asc': { label: 'Más Antiguas', field: 'publishedAt', direction: 'asc' },
    'likes_desc': { label: 'Más Gustadas', field: 'likes', direction: 'desc' },
};

const CATEGORIES = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'infidelity', label: 'Infidelidad' },
    { value: 'confession', label: 'Confesiones' },
    { value: 'dating', label: 'Citas' },
    { value: 'other', label: 'Varios' },
];

export default function Search() {
    const { dark } = useTheme();
    const [searchTerm, setSearchTerm] = useState("");
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState('publishedAt_desc');

    const handleSearch = useCallback(async () => {
        // Validación para evitar consultas vacías muy costosas
        if (searchTerm.trim().length === 0 && selectedCategory === 'all' && selectedOrder === 'publishedAt_desc') {
            return;
        }

        setLoading(true);
        setError(null);
        setStories([]);
        
        try {
            const collectionRef = collection(db, "stories");
            const constraints = [where("status", "==", "approved")];
            
            // 1. Filtro de Categoría
            if (selectedCategory !== 'all') {
                constraints.push(where("category", "==", selectedCategory));
            }

            // 2. Búsqueda por Título (Prefijo)
            if (searchTerm.trim().length >= 3) {
                 const start = searchTerm.trim();
                 const end = start + '\uf8ff';
                 constraints.push(where("title", ">=", start));
                 constraints.push(where("title", "<=", end));
                 // Nota: Firestore requiere que el orderBy coincida con el campo de rango.
                 // Si buscamos por título, debemos ordenar por título primero.
                 constraints.push(orderBy("title", "asc"));
            } else {
                // Si no hay búsqueda de texto, usamos el orden seleccionado
                const order = ORDER_OPTIONS[selectedOrder];
                constraints.push(orderBy(order.field, order.direction));
            }

            constraints.push(limit(20));
            
            const q = query(collectionRef, ...constraints);
            const snap = await getDocs(q);

            const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (results.length === 0) setError("No se encontraron historias.");
            setStories(results);

        } catch (err) {
            console.error("Error búsqueda:", err);
            // Mensaje amigable para errores de índice
            if (err.message.includes("index")) {
                setError("Error de configuración de índices en Firebase. Contacta al admin.");
            } else {
                setError("Ocurrió un error. Intenta simplificar tu búsqueda.");
            }
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, selectedOrder]);

    // Debounce para búsqueda automática al escribir
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 3 || selectedCategory !== 'all') {
                handleSearch();
            }
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCategory, selectedOrder, handleSearch]);

    const clearSearch = () => {
        setSearchTerm("");
        setStories([]);
        setError(null);
        setSelectedCategory('all');
    };

    return (
        <div className="page-content">
            <h1 className="section-title"><FaSearch /> Buscador</h1>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <div style={{flex: 1, position: 'relative'}}>
                     <input
                        type="text"
                        placeholder="Escribe el título (min 3 letras)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#fff', color: 'var(--text)' }}
                    />
                    {searchTerm && <FaTimesCircle onClick={clearSearch} style={{position: 'absolute', right: 10, top: 12, cursor: 'pointer', color: 'var(--text-secondary)'}}/>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 1 }}>
                    {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)} disabled={searchTerm.length >= 3} style={{ padding: '10px', borderRadius: '8px', flex: 1, opacity: searchTerm.length >= 3 ? 0.5 : 1 }}>
                    {Object.entries(ORDER_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {loading && <p style={{textAlign: 'center'}}><FaSpinner className="spin-icon"/> Buscando...</p>}
            {error && <p style={{textAlign: 'center', color: 'var(--error-color)'}}>{error}</p>}

            <div className="stories-list">
                {stories.map(story => (
                    <Link key={story.id} to={`/story/${story.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card" style={{ marginBottom: '15px', padding: '15px', borderLeft: '4px solid var(--primary)' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>{story.title}</h3>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>{formatTimeAgo(story.publishedAt)}</span>
                                <span><FaHeart /> {story.likes || 0}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}