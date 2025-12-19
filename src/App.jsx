import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import StoryView from "./pages/StoryView";
import SubmitStory from "./pages/SubmitStory";
import Stories from "./pages/Stories";
import VoiceChat from "./pages/VoiceChat";
import Heatmap from "./pages/Heatmap"; 
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ 1. IMPORTAMOS LAS PÁGINAS DE ADMIN
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* --- RUTAS PÚBLICAS (Con Barra de Navegación) --- */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="stories" element={<Stories />} />
            <Route path="story/:id" element={<StoryView />} />
            <Route path="ranking" element={<Heatmap />} />
            <Route path="voice-chat" element={<VoiceChat />} />
            <Route
              path="submit"
              element={
                <ProtectedRoute>
                  <SubmitStory />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* --- RUTAS DE ADMIN (Sin Barra de Navegación Pública) --- */}
          {/* Las ponemos fuera del Layout para que tengan su propio diseño limpio */}
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/adminpanel" element={<Admin />} />

        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;