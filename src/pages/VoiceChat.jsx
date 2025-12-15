import { useState, useEffect } from 'react'; 
import { 
    collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
    doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { FaMicrophone, FaUsers, FaPlus, FaHeadset, FaSignOutAlt, FaLock, FaTrash } from 'react-icons/fa'; 
import useAgora from '../hooks/useAgora'; // Usamos el hook nuevo
import { getAnonymousID } from '../utils/identity';
import Loader from '../components/Loader';

const MY_ID = getAnonymousID();

// --- VISTA: SALA ACTIVA (CONECTADO) ---
const ActiveRoom = ({ room, onLeave }) => {
    // Conexión real de Audio
    const { isConnected, toggleMute } = useAgora(room.id, MY_ID);
    const [isMuted, setIsMuted] = useState(false);

    // Manejar cierre de pestaña (Para no dejar fantasmas)
    useEffect(() => {
        const handleTabClose = (e) => {
            e.preventDefault();
            onLeave(); // Intentar salir en Firebase
        };
        window.addEventListener('beforeunload', handleTabClose);
        return () => window.removeEventListener('beforeunload', handleTabClose);
    }, [onLeave]);

    const handleMute = () => {
        const newState = toggleMute();
        setIsMuted(newState);
    };

    return (
        <div className="fade-in" style={{ 
            position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Animación de Ondas si está conectado */}
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                {isConnected && !isMuted && (
                    <div style={{
                        position: 'absolute', inset: -20, borderRadius: '50%',
                        border: '2px solid var(--primary)', opacity: 0.5,
                        animation: 'pulse 1.5s infinite'
                    }} />
                )}
                <div style={{ 
                    width: 120, height: 120, borderRadius: '50%', 
                    background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isConnected ? '0 0 0 4px var(--primary)' : 'none',
                    transition: '0.3s'
                }}>
                    <FaMicrophone size={50} color={isConnected ? (isMuted ? 'gray' : 'var(--primary)') : 'var(--text-secondary)'} />
                </div>
            </div>
            
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--text-main)', textAlign: 'center' }}>{room.name}</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? '#2ecc71' : '#f1c40f' }}></div>
                {isConnected ? "En vivo • Hablando" : "Conectando audio..."}
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={handleMute} style={{ 
                    padding: '15px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isMuted ? 'var(--text-secondary)' : 'var(--bg-body)',
                    color: isMuted ? 'white' : 'var(--text-main)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <FaMicrophone size={24} />
                </button>
                <button onClick={onLeave} style={{ 
                    padding: '15px 30px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                    background: '#e74c3c', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)'
                }}>
                    <FaSignOutAlt /> Salir
                </button>
            </div>
            
            <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }`}</style>
        </div>
    );
};

// --- VISTA PRINCIPAL ---
export default function VoiceChat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Escuchar salas en tiempo real
    useEffect(() => {
        const q = query(collection(db, "voice_rooms"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Filtrar salas vacías "Zombie" localmente por si acaso, aunque el backend debería borrarlas
            const validRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRooms(validRooms);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // 1. UNIRSE A SALA (Transacción Segura)
    const joinRoom = async (room) => {
        try {
            const roomRef = doc(db, "voice_rooms", room.id);
            // Usamos arrayUnion para evitar duplicados del mismo usuario
            await updateDoc(roomRef, {
                users: arrayUnion(MY_ID)
            });
            setActiveRoomId(room.id);
        } catch (e) {
            console.error(e);
            alert("No se pudo entrar a la sala.");
        }
    };

    // 2. SALIR DE SALA (Y borrar si está vacía)
    const leaveRoom = async () => {
        if (!activeRoomId) return;
        const roomId = activeRoomId;
        setActiveRoomId(null); // Desmontar UI inmediatamente

        try {
            const roomRef = doc(db, "voice_rooms", roomId);
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const currentUsers = roomSnap.data().users || [];
                const newUsers = currentUsers.filter(uid => uid !== MY_ID);

                if (newUsers.length === 0) {
                    // SI NO QUEDA NADIE, BORRAMOS LA SALA
                    await deleteDoc(roomRef);
                } else {
                    // SI QUEDA ALGUIEN, SOLO NOS QUITAMOS
                    await updateDoc(roomRef, {
                        users: arrayRemove(MY_ID)
                    });
                }
            }
        } catch (e) {
            console.error("Error saliendo:", e);
        }
    };

    // 3. CREAR SALA
    const createRoom = async () => {
        const name = prompt("Nombre de la sala:");
        if (!name) return;
        
        try {
            const docRef = await addDoc(collection(db, "voice_rooms"), {
                name: name.trim(),
                createdAt: serverTimestamp(),
                users: [MY_ID] // Entras automáticamente
            });
            setActiveRoomId(docRef.id);
        } catch (e) { alert("Error creando sala"); }
    };

    // Si estoy en una sala, mostrar la UI de sala activa
    const activeRoomData = rooms.find(r => r.id === activeRoomId);
    if (activeRoomData) {
        return <ActiveRoom room={activeRoomData} onLeave={leaveRoom} />;
    }

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Salas de Voz</h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Habla anónimamente en vivo</p>
                </div>
                <button onClick={createRoom} className="active-press" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(206, 17, 38, 0.3)' }}>
                    <FaPlus /> Crear Sala
                </button>
            </div>

            {loading ? <Loader /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {rooms.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                            <FaHeadset size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <p>Todo está muy callado...<br/>¡Crea la primera sala!</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} onClick={() => joinRoom(room)} className="active-press" style={{
                                background: 'var(--surface)', borderRadius: '16px', padding: '20px',
                                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
                                transition: '0.2s', position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 45, height: 45, borderRadius: '12px', background: 'linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0288d1' }}>
                                            <FaHeadset size={22} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{room.name}</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sala Pública</span>
                                        </div>
                                    </div>
                                    {/* Indicador en vivo */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2f1', padding: '4px 8px', borderRadius: '10px' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b894' }}></div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00695c' }}>LIVE</span>
                                    </div>
                                </div>
                                
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        <FaUsers /> {room.users ? room.users.length : 0} usuarios
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Unirme &rarr;</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}