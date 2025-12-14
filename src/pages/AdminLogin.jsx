// src/pages/AdminLogin.jsx - REVISIÓN CRÍTICA

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom"; // Importar useNavigate para la redirección

export default function AdminLogin() {
  const { dark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Inicializar useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Intentar iniciar sesión
      await signInWithEmailAndPassword(auth, email, password);
      
      // Si el login es exitoso, Firebase AuthContext actualizará currentUser.
      // 2. Redirigir al panel de administrador
      // Utilizamos navigate('/', { replace: true }) para que la ruta /adminpanel
      // pueda ser gestionada por el ProtectedRoute, que luego te lleva a /adminpanel
      // si estás logeado. Sin embargo, para simplicidad, redirigimos directamente
      // al panel.
      navigate('/adminpanel', { replace: true });
      
    } catch (err) {
      console.error("Error de login:", err);
      // Asegúrate de que los códigos de error son correctos o usa un genérico
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else {
        setError("Error al iniciar sesión. Revisa la consola para más detalles.");
      }
    } finally {
      // El finally se ejecuta si hay éxito O error. 
      // Si tuvo éxito, la navegación ya se ha activado.
      // Solo restablecer si hubo un error.
      if (error) { // Si hay un error, dejamos el loading en false
        setLoading(false);
      }
    }
  };

  return (
    <div className="page-content" style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '20px' }}>🔑 Acceso de Administrador</h2>
      
      <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px', 
          maxWidth: '300px', 
          margin: '0 auto',
          padding: '20px',
          borderRadius: '8px',
          background: dark ? '#1a1a1a' : '#fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#eee', color: 'var(--text)' }}
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid var(--card-border)', background: dark ? '#333' : '#eee', color: 'var(--text)' }}
        />
        
        <button
          type="submit"
          disabled={loading} // Asegúrate de que el botón está deshabilitado si loading es true
          style={{ 
            padding: '10px', 
            borderRadius: '5px', 
            border: 'none', 
            background: loading ? 'var(--nav-link)' : 'var(--primary)', 
            color: 'white', 
            cursor: loading ? 'default' : 'pointer' 
          }}
        >
          {loading ? "Verificando..." : "Iniciar Sesión"}
        </button>
        
        {error && <p style={{ color: '#e53e3e', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}