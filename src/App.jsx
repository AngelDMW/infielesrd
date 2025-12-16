import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import StoryView from "./pages/StoryView";
import SubmitStory from "./pages/SubmitStory";
import Stories from "./pages/Stories";
import VoiceChat from "./pages/VoiceChat";
import Heatmap from "./pages/Heatmap"; // ✅ IMPORTADO
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="stories" element={<Stories />} />
            <Route path="story/:id" element={<StoryView />} />
            <Route path="ranking" element={<Heatmap />} /> {/* ✅ RUTA AGREGADA */}
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
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;