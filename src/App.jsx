import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout"; // ✅ Importar Layout
import Home from "./pages/Home";
import Stories from "./pages/Stories";
import StoryView from "./pages/StoryView";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Submit from "./pages/Submit";
import VoiceChat from "./pages/VoiceChat";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/adminlogin" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Rutas Públicas dentro del Layout Responsivo */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/story/:id" element={<StoryView />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/voice-chat" element={<VoiceChat />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Rutas de Admin (Pantalla completa, sin Layout social) */}
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/adminpanel" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
      } />
    </Routes>
  );
}