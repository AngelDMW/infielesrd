import { useTheme } from "../context/ThemeContext";

export default function BrandLogo({ variant = "full", className = "" }) {
  const { dark } = useTheme();
  
  // Colores Oficiales
  const RD_BLUE = "#002D62";
  const RD_RED = "#CE1126";
  const RD_WHITE = "#FFFFFF"; 
  const TEXT_COLOR = dark ? "#FFFFFF" : "#111111";

  // --- VARIANTE ÍCONO SOLITO (Solo el dibujo) ---
  if (variant === "icon") {
    return (
      <svg width="36" height="36" viewBox="0 0 26 26" fill="none" className={className}>
        <rect x="1" y="1" width="11" height="11" fill={RD_BLUE} rx="3"/>
        <rect x="14" y="1" width="11" height="11" fill={RD_RED} rx="3"/>
        <rect x="1" y="14" width="11" height="11" fill={RD_RED} rx="3"/>
        <rect x="14" y="14" width="11" height="11" fill={RD_BLUE} rx="3"/>
        <rect x="12" y="0" width="2" height="26" fill={RD_WHITE} />
        <rect x="0" y="12" width="26" height="2" fill={RD_WHITE} />
      </svg>
    );
  }

  // --- VARIANTE LOGO COMPLETO (Texto + Icono) ---
  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      
      {/* Icono */}
      <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
        <rect x="1" y="1" width="11" height="11" fill={RD_BLUE} rx="2"/>
        <rect x="14" y="1" width="11" height="11" fill={RD_RED} rx="2"/>
        <rect x="1" y="14" width="11" height="11" fill={RD_RED} rx="2"/>
        <rect x="14" y="14" width="11" height="11" fill={RD_BLUE} rx="2"/>
        <rect x="12" y="0" width="2" height="26" fill={RD_WHITE} />
        <rect x="0" y="12" width="26" height="2" fill={RD_WHITE} />
      </svg>

      {/* Texto - Asegurado que sea visible */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontWeight: 900, 
          fontSize: '1.3rem', // Ajustado ligeramente para móvil
          letterSpacing: '-0.5px',
          lineHeight: '1',
          color: TEXT_COLOR,
          whiteSpace: 'nowrap' // Evita que se parta en dos líneas
        }}>
          INFIELES<span style={{ color: RD_RED }}>.RD</span>
        </span>
      </div>
    </div>
  );
}