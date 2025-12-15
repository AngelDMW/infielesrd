import { useTheme } from "../context/ThemeContext";

export default function BrandLogo({ variant = "full", className = "" }) {
  const { dark } = useTheme();
  
  // Colores Oficiales
  const RD_BLUE = "#002D62";
  const RD_RED = "#CE1126";
  // La cruz SIEMPRE es blanca pura para contrastar en ambos modos
  const RD_WHITE = "#FFFFFF"; 
  const TEXT_COLOR = dark ? "#FFFFFF" : "#111111";

  // --- VARIANTE ÍCONO GRANDE (Ej. para móvil o login) ---
  if (variant === "icon") {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={className}>
        {/* Fondo del contenedor (se adapta al tema para suavizar bordes) */}
        <rect width="40" height="40" rx="12" fill={dark ? "#2a2a2a" : "#f0f0f0"} />
        
        {/* La Bandera: Dibujamos los cuadrantes y la cruz blanca encima */}
        <g transform="translate(4, 4)"> {/* Margen interno */}
            {/* Cuadrantes */}
            <rect x="0" y="0" width="14" height="14" fill={RD_BLUE} rx="2" />
            <rect x="18" y="0" width="14" height="14" fill={RD_RED} rx="2" />
            <rect x="0" y="18" width="14" height="14" fill={RD_RED} rx="2" />
            <rect x="18" y="18" width="14" height="14" fill={RD_BLUE} rx="2" />
            
            {/* La Cruz Blanca (Barras sólidas) */}
            <rect x="14" y="0" width="4" height="32" fill={RD_WHITE} />
            <rect x="0" y="14" width="32" height="4" fill={RD_WHITE} />
        </g>
      </svg>
    );
  }

  // --- VARIANTE LOGO COMPLETO (Header / Sidebar) ---
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      
      {/* Icono Minimalista Geométrico */}
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        {/* Base: Cuadrantes Rojo y Azul */}
        <rect x="1" y="1" width="11" height="11" fill={RD_BLUE} rx="1"/>
        <rect x="14" y="1" width="11" height="11" fill={RD_RED} rx="1"/>
        <rect x="1" y="14" width="11" height="11" fill={RD_RED} rx="1"/>
        <rect x="14" y="14" width="11" height="11" fill={RD_BLUE} rx="1"/>
        
        {/* La Cruz Blanca Sólida (Crucial para el modo oscuro) */}
        <rect x="12" y="0" width="2" height="26" fill={RD_WHITE} />
        <rect x="0" y="12" width="26" height="2" fill={RD_WHITE} />
      </svg>

      {/* Tipografía */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontWeight: 900, 
          fontSize: '1.4rem',
          letterSpacing: '-1px',
          lineHeight: '1',
          color: TEXT_COLOR
        }}>
          INFIELES<span style={{ color: RD_RED }}>.RD</span>
        </span>
      </div>
    </div>
  );
}