// src/utils/timeFormat.js
export const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Hace un ratico';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    // Menos de 1 minuto
    if (seconds < 60) return 'Hace un instante';
    
    // Menos de 1 hora
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `Hace ${minutes} min`;
    }
    
    // Menos de 24 horas (Muestra hora relativa "Hace X horas")
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `Hace ${hours}h`;
    }

    // Fecha Completa (Día Mes Año, Hora)
    // Ejemplo: 15 dic 2023, 4:30 PM
    return date.toLocaleDateString('es-DO', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
};