// src/context/AuthContext.jsx - NUEVO ARCHIVO

import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha los cambios de estado de autenticación (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    // Se limpia el listener al desmontar el componente
    return unsubscribe;
  }, []);

  // Función de cierre de sesión
  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    logout,
    loading,
  };

  // Renderiza los hijos solo si el estado de autenticación se ha cargado
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}