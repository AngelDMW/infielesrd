import { Link, useLocation } from "react-router-dom";
import { FaHome, FaCompass, FaPlusCircle, FaMicrophone } from "react-icons/fa";

export default function BottomBar() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: FaHome },
    { path: "/stories", icon: FaCompass }, // Explorar
    { path: "/submit", icon: FaPlusCircle }, // Botón central
    { path: "/voice-chat", icon: FaMicrophone },
  ];

  return (
    <>
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={index}
            to={item.path}
            style={{
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50px",
              height: "50px",
            }}
          >
            <item.icon size={24} />
          </Link>
        );
      })}
    </>
  );
}
