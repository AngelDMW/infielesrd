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
    <aside style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      {/* 1. Logo */}
      <div style={{ paddingLeft: '15px', marginBottom: '40px', marginTop: '10px' }}>
        <BrandLogo />
      </div>

      {/* 2. Navegación Principal */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="active-press"
              style={{
                display: 'flex', alignItems: 'center', gap: '15px',
                // AUMENTADO EL TAMAÑO (Padding más grande)
                padding: '16px 20px', 
                borderRadius: '16px', 
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface)' : 'transparent',
                fontWeight: isActive ? 800 : 600, // Fuente un poco más gruesa
                fontSize: '1.05rem', // Letra un poco más grande
                transition: 'all 0.2s',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* BOTÓN GRANDE: CONTAR HISTORIA */}
        <Link
          to="/submit"
          className="active-press"
          style={{
            marginTop: '25px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '18px', // Más grande
            borderRadius: '50px', 
            textDecoration: 'none',
            // COLOR FIJO: Rojo con letras blancas (Visible en Dark y Light mode)
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            fontSize: '1.1rem',
            boxShadow: '0 8px 20px rgba(217, 4, 41, 0.4)'
          }}
        >
          <FaPlusCircle size={22} />
          <span>Contar Historia</span>
        </Link>
      </nav>

      {/* 3. Footer Sidebar (Estilo Tarjeta Antigua) */}
      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
         
         {/* Tarjeta de Usuario */}
         <div style={{ 
             background: 'var(--surface)', 
             padding: '15px', 
             borderRadius: '16px',
             border: '1px solid var(--border-subtle)',
             boxShadow: 'var(--shadow-sm)',
             marginBottom: '15px',
             display: 'flex',
             alignItems: 'center',
             gap: '12px'
         }}>
            <div style={{ 
               width: 45, height: 45, borderRadius: '50%', background: 'var(--bg-body)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)'
            }}>
               <FaUserSecret size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
               <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                 Usuario Anónimo
               </span>
               <span style={{ 
                   fontFamily: 'monospace', 
                   fontSize: '0.8rem', 
                   color: 'var(--primary)',
                   fontWeight: 600
               }}>
                  ID: {displayID}
               </span>
            </div>
         </div>
        
        {/* Botón Dark Mode */}
        <button 
          onClick={toggleDark}
          className="active-press"
          style={{ 
            background: 'transparent', 
            border: '2px solid var(--border-subtle)', 
            padding: '12px', borderRadius: '12px', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%'
          }}
        >
          {dark ? <><FaSun color="#fbbf24"/> Modo Claro</> : <><FaMoon color="#64748b"/> Modo Oscuro</>}
        </button>
      </div>
    </aside>
  );
}