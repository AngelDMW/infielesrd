import { Outlet, useLocation } from "react-router-dom";
import BottomBar from "./BottomBar";
import Sidebar from "./Sidebar";
import BrandLogo from "./BrandLogo";
import { useTheme } from "../context/ThemeContext";
import { getAnonymousID } from "../utils/identity";
import { FaMoon, FaSun, FaUserSecret } from "react-icons/fa";
import "../styles/layout.css";

export default function Layout() {
  const location = useLocation();
  const { toggleDark, dark } = useTheme();
  
  // Obtener ID para mostrar en móvil
  const fullID = getAnonymousID();
  const shortID = fullID ? fullID.split('-')[2] : "???"; // Mostramos solo los números en móvil para ahorrar espacio

  // Lógica para ocultar la barra de abajo en ciertas pantallas
  // Ocultamos la barra en: Historias individuales (para ver el input) y en Chat de Voz
  const isStoryView = location.pathname.includes('/story/');
  const isVoiceChat = location.pathname.includes('/voice-chat');
  const shouldHideBottomNav = isStoryView || isVoiceChat;

  return (
    <div className="layout-container">
      
      {/* 1. HEADER MÓVIL (Mejorado con Usuario y Tema) */}
      <header className="mobile-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: '60px',
          background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999
      }}>
        {/* Logo (Versión Icono para ahorrar espacio) */}
        <BrandLogo variant="icon" />

        {/* Controles Móviles (Usuario + Tema) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            {/* Badge de Usuario */}
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                background: 'var(--bg-body)', padding: '6px 12px', borderRadius: '20px',
                border: '1px solid var(--border-subtle)'
            }}>
                <FaUserSecret color="var(--primary)" size={14} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    {shortID}
                </span>
            </div>

            {/* Toggle Modo Oscuro */}
            <button 
                onClick={toggleDark}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-main)', display: 'flex', alignItems: 'center'
                }}
            >
                {dark ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
        </div>
      </header>

      {/* 2. SIDEBAR PC (Se mantiene igual, oculto en móvil por CSS) */}
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 4. BOTTOM BAR MÓVIL (Condicional) */}
      {/* Solo se muestra si NO estamos viendo una historia */}
      {!shouldHideBottomNav && (
        <nav className="mobile-bottom-bar">
            <BottomBar />
        </nav>
      )}

    </div>
  );
}