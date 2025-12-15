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
  
  const fullID = getAnonymousID();
  const shortID = fullID ? fullID.split('-')[2] : "???";

  // Lógica Corregida: Solo ocultar barra en Historias individuales
  // (En salas de voz la barra se mantiene visible)
  const isStoryView = location.pathname.includes('/story/');
  const shouldHideBottomNav = isStoryView; 

  return (
    <div className="layout-container">
      
      {/* 1. HEADER MÓVIL */}
      <header className="mobile-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 15px', height: '60px', // Padding ajustado
          background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999
      }}>
        {/* LOGO COMPLETO (Sin variant="icon", para que salga el nombre) */}
        <BrandLogo /> 

        {/* Controles Móviles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', 
                background: 'var(--bg-body)', padding: '6px 10px', borderRadius: '20px',
                border: '1px solid var(--border-subtle)'
            }}>
                <FaUserSecret color="var(--primary)" size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    {shortID}
                </span>
            </div>

            <button 
                onClick={toggleDark}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-main)', display: 'flex', alignItems: 'center',
                    padding: '5px'
                }}
            >
                {dark ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>
        </div>
      </header>

      {/* 2. SIDEBAR PC */}
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 4. BOTTOM BAR MÓVIL */}
      {!shouldHideBottomNav && (
        <nav className="mobile-bottom-bar">
            <BottomBar />
        </nav>
      )}

    </div>
  );
}