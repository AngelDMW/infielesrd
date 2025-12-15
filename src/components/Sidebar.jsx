import { Link, useLocation } from "react-router-dom";
import { FaHome, FaCompass, FaMicrophone, FaPlusCircle, FaMoon, FaSun, FaUserSecret } from "react-icons/fa";
import { getAnonymousID } from "../utils/identity";
import { useTheme } from "../context/ThemeContext";
import BrandLogo from "./BrandLogo";

export default function Sidebar() {
  const location = useLocation();
  const { toggleDark, dark } = useTheme();
  
  // CORRECCIÓN: Usamos el ID completo, sin cortar
  const fullID = getAnonymousID(); 
  // Si por alguna razón es null, mostramos un fallback
  const displayID = fullID || "Anon-???";

  const navItems = [
    { path: "/", icon: FaHome, label: "Inicio" },
    { path: "/stories", icon: FaCompass, label: "Explorar" },
    { path: "/voice-chat", icon: FaMicrophone, label: "Salas de Voz" },
  ];

  return (
    <aside style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Logo */}
      <div style={{ paddingLeft: '10px', marginBottom: '40px' }}>
        <BrandLogo />
      </div>

      {/* 2. Navegación Principal */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="active-press"
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 16px',
                borderRadius: '16px',
                textDecoration: 'none',
                color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface-alt)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              <item.icon size={26} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              <span style={{ fontSize: '1.1rem' }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Botón CTA Destacado */}
        <Link to="/submit" className="active-press" style={{
            marginTop: '20px',
            display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
            background: 'var(--primary)', color: 'white',
            padding: '16px', borderRadius: '50px',
            textDecoration: 'none', fontWeight: 700,
            boxShadow: 'var(--shadow-glow)'
        }}>
            <FaPlusCircle size={20} />
            <span>Contar Historia</span>
        </Link>
      </nav>

      {/* 3. Footer Usuario */}
      <div style={{ 
          marginTop: 'auto', 
          background: 'var(--surface-alt)', 
          padding: '16px', 
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ 
               background: 'var(--text-main)', color: 'var(--surface)', 
               width: 38, height: 38, borderRadius: '50%', 
               display: 'flex', alignItems: 'center', justifyContent: 'center' 
           }}>
             <FaUserSecret size={20} />
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Usuario Anónimo</span>
             <span style={{ 
                 fontFamily: 'monospace', 
                 fontSize: '0.75rem', 
                 color: 'var(--text-secondary)',
                 whiteSpace: 'nowrap',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 maxWidth: '140px'
             }}>
                {displayID}
             </span>
           </div>
        </div>
        
        <button 
          onClick={toggleDark}
          className="active-press"
          style={{ 
            background: 'var(--surface)', border: '1px solid var(--border-subtle)', 
            padding: '10px', borderRadius: '10px', cursor: 'pointer',
            color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%'
          }}
        >
          {dark ? <FaSun size={14}/> : <FaMoon size={14}/>} 
          {dark ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
      </div>
    </aside>
  );
}