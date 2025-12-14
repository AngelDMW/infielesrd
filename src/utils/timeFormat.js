// src/utils/timeFormat.js - CÓDIGO FINAL

// Transforma el timestamp de Firebase en un string legible y con hora.
export const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Hace un ratico';
    
    // Convertir el objeto Timestamp de Firebase a objeto Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    // Si es reciente (menos de 1 hora), usamos la hora exacta y "Hoy"
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 1) return 'Hace un instante';
        if (minutes < 60) return `Hace ${minutes} min`;
    }
    
    // Si es hoy, mostramos la hora (Ej: 10:30 PM)
    if (date.toDateString() === now.toDateString()) {
        return `Hoy a las ${date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si es ayer
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Ayer a las ${date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Para fechas más viejas, mostramos la fecha completa
    return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
};