// src/pages/Categories.jsx - NUEVO ARCHIVO

import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaTags, FaLock, FaHandsHelping, FaRegLightbulb } from 'react-icons/fa';

// Definición manual de categorías (idealmente, esto se cargaría desde Firestore si fueran muchas)
const CATEGORIES = [
    { name: 'infidelity', label: 'Infidelidad', icon: FaLock, description: 'Historias sobre engaños, celos y relaciones secretas.' },
    { name: 'confession', label: 'Confesiones', icon: FaHandsHelping, description: 'Relatos donde el escritor admite sus faltas o secretos.' },
    { name: 'dating', label: 'Citas', icon: FaRegLightbulb, description: 'Experiencias de citas, aplicaciones y encuentros casuales.' },
    { name: 'uncategorized', label: 'Otros', icon: FaTags, description: 'Historias que no encajan en las categorías principales.' },
];

export default function Categories() {
    const { dark } = useTheme();

    return (
        <div className="page-content">
            <h1 className="section-title"><FaTags /> Explorar Categorías</h1>
            
            <p style={{color: 'var(--nav-link)', marginBottom: '20px'}}>Navega por los temas principales de las historias de la comunidad.</p>

            <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                {CATEGORIES.map(category => (
                    // El enlace dirige a la página /stories con el parámetro de filtro
                    <Link 
                        key={category.name}
                        to={`/stories?category=${category.name}`}
                        style={{ 
                            textDecoration: 'none', 
                            color: 'inherit',
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '15px',
                            borderRadius: '12px',
                            background: dark ? 'var(--card-bg)' : '#fff',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '2px solid var(--primary)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <category.icon style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '10px' }} />
                        <h3 style={{ fontSize: '1rem', margin: '0', color: 'var(--text)' }}>{category.label}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--nav-link)', marginTop: '5px' }}>
                            {category.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}