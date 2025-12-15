import { Outlet } from "react-router-dom";
import BottomBar from "./BottomBar";
import Sidebar from "./Sidebar"; // Importación correcta
import BrandLogo from "./BrandLogo";
import "../styles/layout.css";

export default function Layout() {
  return (
    <div className="layout-container">
      
      {/* 1. HEADER MÓVIL (Solo visible en celular) */}
      <header className="mobile-header">
        <BrandLogo />
      </header>

      {/* 2. SIDEBAR PC (A LA IZQUIERDA) */}
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>

      {/* 3. CONTENIDO PRINCIPAL (El Feed) */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 4. BOTTOM BAR MÓVIL (Solo visible en celular) */}
      <nav className="mobile-bottom-bar">
        <BottomBar />
      </nav>

    </div>
  );
}