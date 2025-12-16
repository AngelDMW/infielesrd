import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { PROVINCES } from "../utils/constants";
import { FaMapMarkedAlt, FaTrophy, FaCity, FaTemperatureHigh, FaSpinner } from "react-icons/fa";
import Loader from "../components/Loader";

export default function Heatmap() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [totalStories, setTotalStories] = useState(0);
  const [topProvince, setTopProvince] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtenemos solo las historias aprobadas
        const q = query(collection(db, "stories"), where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        
        const counts = {};
        let total = 0;

        // Inicializar contadores en 0
        PROVINCES.forEach(p => counts[p.value] = 0);

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.province && counts[data.province] !== undefined) {
            counts[data.province]++;
            total++;
          }
        });

        // Convertir a array y ordenar
        const sortedStats = PROVINCES.map(p => ({
          ...p,
          count: counts[p.value] || 0,
          percentage: total > 0 ? ((counts[p.value] || 0) / total) * 100 : 0
        })).sort((a, b) => b.count - a.count);

        setStats(sortedStats);
        setTotalStories(total);
        setTopProvince(sortedStats[0]); // La #1
      } catch (error) {
        console.error("Error cargando mapa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="fade-in page-content" style={{ paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '15px', color: 'white', boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)' }}>
           <FaMapMarkedAlt size={28} />
        </div>
        <div>
           <h1 className="section-title" style={{marginBottom: 0}}>Mapa del Cuerno</h1>
           <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Ranking oficial de infidelidad por provincia.</p>
        </div>
      </div>

      {/* 🏆 TARJETA DESTACADA: LA CAPITAL DEL CUERNO */}
      {topProvince && (
        <div style={{ 
            background: 'linear-gradient(135deg, #1e1e1e 0%, #2d0005 100%)', 
            padding: '30px', borderRadius: '25px', marginBottom: '40px',
            border: '2px solid #e11d48', boxShadow: '0 10px 30px rgba(225, 29, 72, 0.2)',
            textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.1 }}>🔥</div>
            
            <div style={{ display: 'inline-block', background: '#e11d48', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '15px' }}>
                👑 LÍDER ACTUAL
            </div>
            
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 5px 0', color: 'white' }}>{topProvince.label}</h2>
            <p style={{ color: '#fda4af', margin: 0, fontSize: '1.1rem' }}>La provincia más caliente</p>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{topProvince.count}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Historias</div>
                </div>
                <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{Math.round(topProvince.percentage)}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Del Total</div>
                </div>
            </div>
        </div>
      )}

      {/* 📊 LISTA RANKING (Estilo Barras) */}
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaTemperatureHigh color="var(--primary)" /> Tabla de Posiciones
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {stats.map((prov, index) => {
              // Calculamos intensidad del color rojo basado en el porcentaje
              const isTop3 = index < 3;
              const intensity = Math.max(0.2, prov.percentage / (stats[0]?.percentage || 1));
              
              return (
                  <div key={prov.value} style={{ 
                      background: 'var(--surface)', padding: '15px 20px', borderRadius: '16px',
                      border: isTop3 ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', overflow: 'hidden'
                  }}>
                      {/* Barra de Fondo */}
                      <div style={{ 
                          position: 'absolute', left: 0, top: 0, bottom: 0, 
                          width: `${prov.percentage}%`, 
                          background: isTop3 ? 'var(--primary)' : 'var(--text-main)', 
                          opacity: isTop3 ? 0.1 : 0.05,
                          zIndex: 0
                      }} />

                      {/* Posición # */}
                      <div style={{ 
                          fontSize: '1.2rem', fontWeight: 900, 
                          color: isTop3 ? 'var(--primary)' : 'var(--text-secondary)',
                          width: '30px', zIndex: 1
                      }}>
                          #{index + 1}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, zIndex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{prov.label}</div>
                          {isTop3 && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>¡Muy Caliente! 🔥</div>}
                      </div>

                      {/* Cantidad */}
                      <div style={{ textAlign: 'right', zIndex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{prov.count}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>casos</div>
                      </div>
                  </div>
              );
          })}
      </div>

    </div>
  );
}