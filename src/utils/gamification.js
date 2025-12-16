// src/utils/gamification.js

export const RANKS = [
  { min: 0, label: "Inocente", emoji: "😇", color: "#64748b" },
  { min: 5, label: "Curioso", emoji: "👀", color: "#3b82f6" },
  { min: 20, label: "Chismoso", emoji: "🕵️", color: "#8b5cf6" },
  { min: 50, label: "Doña del Barrio", emoji: "👵", color: "#f59e0b" },
  { min: 100, label: "Agente del FBI", emoji: "🕶️", color: "#d90429" },
  { min: 200, label: "Leyenda Tóxica", emoji: "👑", color: "#000000" }
];

// Obtener estadísticas del usuario
export const getUserStats = () => {
  const reads = parseInt(localStorage.getItem('stories_read') || '0');
  const currentRank = RANKS.slice().reverse().find(r => reads >= r.min) || RANKS[0];
  
  // Calcular siguiente nivel
  const nextRankIndex = RANKS.indexOf(currentRank) + 1;
  const nextRank = RANKS[nextRankIndex];
  const progress = nextRank 
    ? Math.min(100, Math.round(((reads - currentRank.min) / (nextRank.min - currentRank.min)) * 100))
    : 100;

  return { reads, currentRank, nextRank, progress };
};

// Registrar una lectura (Llamar al entrar a una historia)
export const incrementStoryRead = (storyId) => {
  const readHistory = JSON.parse(localStorage.getItem('read_history') || '[]');
  
  if (!readHistory.includes(storyId)) {
    const newCount = parseInt(localStorage.getItem('stories_read') || '0') + 1;
    localStorage.setItem('stories_read', newCount);
    
    // Guardamos ID para no contar doble la misma historia
    readHistory.push(storyId);
    // Limitamos el historial a los últimos 500 IDs para no llenar memoria
    if(readHistory.length > 500) readHistory.shift(); 
    localStorage.setItem('read_history', JSON.stringify(readHistory));
    
    return true; // Fue una lectura nueva
  }
  return false;
};