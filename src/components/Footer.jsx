// src/components/Footer.jsx - CÓDIGO COMPLETO (NUEVO ARCHIVO)

import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer>
            <span>© 2025 InfielesRD.</span>
            <Link to="/about">Términos de Uso</Link> 
            | 
            <Link to="/policy">Política de Privacidad</Link>
            <p style={{margin: '5px 0 0', fontSize: '0.7rem', color: 'var(--error-color)'}}>
                El contenido es generado por usuarios y no refleja la opinión del sitio.
            </p>
        </footer>
    );
}