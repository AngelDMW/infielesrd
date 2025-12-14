// src/pages/NotFound.jsx - CÓDIGO COMPLETO (NUEVO ARCHIVO)

import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="page-content not-found">
            <h1>404 😔</h1>
            <h2 style={{color: 'var(--text)'}}>¡Chisme perdido!</h2>
            <p>La historia o página que buscas no existe o fue eliminada.</p>
            <Link to="/" className="call-to-action-btn">
                Volver al Inicio Seguro
            </Link>
        </div>
    );
}