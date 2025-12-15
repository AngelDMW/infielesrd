// src/components/BottomBar.jsx - CÓDIGO FINAL CON CHAT DE VOZ

import { Link, useLocation } from "react-router-dom";
import { FaUserSecret } from "react-icons/fa";
import {
  FaHome,
  FaMicrophone,
  FaPencilAlt,
  FaClipboardList,
} from "react-icons/fa";
import { useMemo } from "react";

export default function BottomBar() {
  const location = useLocation();

  // Define los ítems de navegación
  const navItems = [
    { path: "/", icon: FaHome, label: "Inicio" },
    { path: "/stories", icon: FaClipboardList, label: "Archivo" },
    { path: "/voice-chat", icon: FaMicrophone, label: "Voz" },
    { path: "/submit", icon: FaPencilAlt, label: "Enviar" },
  ];

  const ANONYMOUS_USER = useMemo(() => {
    let storedId = localStorage.getItem("anon_admin_uid");

    if (!storedId) {
      const newId = `Anon-SESS-${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("anon_admin_uid", newId);
      storedId = newId;
    }

    return storedId;
  }, []);

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
      <p className="UserShow">
        <FaUserSecret /> {ANONYMOUS_USER}
      </p>
    </div>
  );
}
