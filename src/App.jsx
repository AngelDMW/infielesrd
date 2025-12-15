// src/App.jsx - VERSIÓN FINAL CON RUTAS ESENCIALES

import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Stories from "./pages/Stories";
import StoryView from "./pages/StoryView";
// import Categories from "./pages/Categories"  <-- ELIMINADA
// import Search from "./pages/Search"          <-- ELIMINADA
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Submit from "./pages/Submit";
import BottomBar from "./components/BottomBar";
import { useAuth } from "./context/AuthContext";
import VoiceChat from "./pages/VoiceChat";

// Componente de Ruta Protegida (HOC)
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // 1. Mostrar carga mientras se verifica el estado de autenticación
  if (loading) {
    return (
      <div
        className="page-content"
        style={{ textAlign: "center", padding: "20px" }}
      >
        Cargando sesión...
      </div>
    );
  }

  // 2. Si no hay usuario logeado, redirigir al login
  if (!currentUser) {
    return <Navigate to="/adminlogin" replace />;
  }

  // 3. Si hay usuario, renderizar el componente solicitado
  return children;
};

export default function App() {
  return (
    <div className="app-layout">
      <BottomBar />

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/story/:id" element={<StoryView />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/voice-chat" element={<VoiceChat />} />
          <Route path="/adminlogin" element={<AdminLogin />} />

          <Route
            path="/adminpanel"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
