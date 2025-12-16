import { Link, useLocation } from "react-router-dom";
import { FaHome, FaCompass, FaMicrophone, FaPlusCircle, FaMoon, FaSun, FaUserSecret } from "react-icons/fa";
import { getAnonymousID } from "../utils/identity";
import { useTheme } from "../context/ThemeContext";
import BrandLogo from "./BrandLogo";

export default function Sidebar() {
  const location = useLocation();
  const { toggleDark, dark } = useTheme();
  
  const fullID = getAnonymousID(); 
  const displayID = fullID || "Anon-???";

  const navItems = [
    { path: "/", icon: FaHome, label: "Inicio" },
    { path: "/stories", icon: FaCompass, label: "Explorar" },
    { path: "/voice-chat", icon: FaMicrophone, label: "Salas de Voz" },
  ];

  return (
    <aside style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 15px' }}>
      
      {/* 1. Logo */}
      <div style={{ paddingLeft: '5px', marginBottom: '30px' }}>
        <BrandLogo />
      </div>

      {/* 2. Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="active-press"
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 20px', // Buen espacio interno
                borderRadius: '16px', 
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface)' : 'transparent',
                fontWeight: isActive ? 800 : 600,
                fontSize: '1.05rem', // Letra un poco más grande
                transition: 'all 0.2s',
                borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent'
              }}
            >
              {/* ✅ ÍCONOS MÁS GRANDES (26px) */}
              <item.icon size={26} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* BOTÓN PRINCIPAL: Contar Historia */}
        <Link
          to="/submit"
          className="active-press"
          style={{
            marginTop: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '16px',
            borderRadius: '50px', 
            textDecoration: 'none',
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(217, 4, 41, 0.3)'
          }}
        >
          {/* ✅ ÍCONO GRANDE (24px) */}
          <FaPlusCircle size={24} />
          <span>Contar Historia</span>
        </Link>
      </nav>

      {/* 3. Footer: Tarjeta Usuario + Dark Mode */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
         
         {/* Tarjeta de Usuario */}
         <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '14px',
             background: 'var(--bg-body)',
             padding: '14px',
             borderRadius: '16px',
             marginBottom: '15px'
         }}>
            <div style={{ 
               width: 42, height: 42, borderRadius: '50%', background: 'var(--surface)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               color: 'var(--text-main)',
               boxShadow: 'var(--shadow-sm)'
            }}>
               {/* ✅ ÍCONO USUARIO GRANDE (22px) */}
               <FaUserSecret size={22} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
               <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                 Usuario Anónimo
               </span>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {displayID}
               </span>
            </div>
         </div>
        
        {/* Botón Toggle Tema */}
        <button 
          onClick={toggleDark}
          className="active-press"
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--border-subtle)', 
            padding: '12px', borderRadius: '12px', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%'
          }}
        >
          {dark ? <><FaSun size={20} color="#fbbf24"/> Modo Claro</> : <><FaMoon size={20} color="#64748b"/> Modo Oscuro</>}
        </button>
      </div>
    </aside>
  );
}