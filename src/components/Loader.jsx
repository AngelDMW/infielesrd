// src/components/Loader.jsx - CÓDIGO COMPLETO
export default function Loader({ message = "Cargando contenido..." }) {
    return (
        <div className="loader-container">
            <div className="spinner"></div>
            <p style={{color: 'var(--nav-link)'}}>{message}</p>
        </div>
    );
}