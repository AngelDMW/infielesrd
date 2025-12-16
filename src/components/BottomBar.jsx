import { Link, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaCompass, 
  FaPlusCircle, 
  FaMicrophone, 
  FaMapMarkedAlt // ✅ IMPORTADO
} from "react-icons/fa";

export default function BottomBar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: FaHome, label: "Inicio" },
    { path: "/stories", icon: FaCompass, label: "Explorar" },
    { path: "/ranking", icon: FaMapMarkedAlt, label: "Ranking" }, // ✅ AGREGADO
    { path: "/voice-chat", icon: FaMicrophone, label: "Voz" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        position: "relative",
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="active-press"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              gap: "4px",
              transition: "all 0.2s"
            }}
          >
            <item.icon size={24} />
            <span style={{ fontSize: "0.7rem", fontWeight: isActive ? 700 : 500 }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Botón Flotante Central (Móvil) */}
      <Link
        to="/submit"
        className="active-press"
        style={{
          position: "absolute",
          top: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "55px",
          height: "55px",
          borderRadius: "50%",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 4px 15px rgba(225, 29, 72, 0.4)",
          textDecoration: "none",
          border: "4px solid var(--surface)" // Borde para separar del fondo
        }}
      >
        <FaPlusCircle size={28} />
      </Link>
    </div>
  );
}