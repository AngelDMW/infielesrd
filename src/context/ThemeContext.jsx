// src/context/ThemeContext.jsx - CÓDIGO COMPLETO Y CORREGIDO

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // Inicializa el estado 'dark' basándose en localStorage o prefiere false (modo claro)
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem('isDarkTheme');
    // Convierte 'true'/'false' a booleano, si no existe, usa false por defecto.
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Efecto para aplicar el tema al <body> y guardar en localStorage
  useEffect(() => {
    document.body.classList.toggle('dark-theme', dark);
    localStorage.setItem('isDarkTheme', dark);
  }, [dark]);

  // Función para alternar el tema
  const toggleDark = () => {
    setDark(prevDark => !prevDark);
  };

  const value = {
    dark,
    toggleDark, // Exportamos la función para que Home.jsx la pueda usar
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};