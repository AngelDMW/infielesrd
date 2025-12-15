import { useTheme } from "../context/ThemeContext";
import { FaMoon, FaSun, FaSearch } from "react-icons/fa";
import { getAnonymousID } from "../utils/identity";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function TopBar() {
  const { dark, toggleDark } = useTheme();
  // Obtener ID corto
  const fullID = getAnonymousID();
  const displayID = fullID ? fullID.split('-')[2] : "???";

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      /* ESTO ES LO QUE ARREGLA EL CENTRADO: */
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 'var(--max-width)',
      
      height: 'var(--header-height)',
      background: 'var(--glass)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 16px',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
         <BrandLogo />
      </Link>

      {/* Acciones Derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/search" style={{ color: 'var(--text-main)', display: 'flex' }}>
           <FaSearch size={18} />
        </Link>
        
        <div onClick={toggleDark} style={{
            cursor: 'pointer',
            padding: '6px 10px',
            background: dark ? '#333' : '#f0f2f5',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)'
        }}>
            <span>{displayID}</span>
            {dark ? <FaSun size={12} color="#fbbf24"/> : <FaMoon size={12} />}
        </div>
      </div>
    </header>
  );
}