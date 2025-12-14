// src/main.jsx (o index.js) - CÓDIGO CRÍTICO

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css'; // Asegúrate de que tu CSS global está importado aquí

// IMPORTACIONES DE CONTEXTO
import { ThemeProvider } from './context/ThemeContext.jsx';
// Asegúrate de que el AuthContext también esté aquí si lo usas
import { AuthProvider } from './context/AuthContext.jsx'; 


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* CRÍTICO: ThemeProvider debe envolver todo */}
      <ThemeProvider> 
        {/* AuthProvider también si lo tienes */}
        <AuthProvider> 
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);