// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer style={{
            textAlign: 'center', 
            padding: '20px', 
            marginTop: '40px', 
            borderTop: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem'
        }}>
            <p>© 2025 InfielesRD.</p>
            <div style={{ margin: '10px 0' }}>
                {/* TODO: Crear páginas de Términos y Política.
                  Por ahora deshabilitados para no generar 404
                */}
                <span style={{opacity: 0.5}}>Términos de Uso</span> 
                {' | '} 
                <span style={{opacity: 0.5}}>Política de Privacidad</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                El contenido es generado anónimamente por usuarios.<br/>
                No nos hacemos responsables de las historias publicadas.
            </p>
        </footer>
    );
}