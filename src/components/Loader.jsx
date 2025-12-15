// src/components/Loader.jsx - ACCESIBLE
export default function Loader({ message = "Cargando contenido..." }) {
    return (
        <div className="loader-container" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p style={{color: 'var(--nav-link)', marginTop: '10px'}}>{message}</p>
            <span className="sr-only">Cargando...</span>
        </div>
    );
}