import { useState, useEffect, useRef } from 'react'; 
import { 
    collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
    doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { FaMicrophone, FaUsers, FaPlus, FaHeadset, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; 
import useAgora from '../hooks/useAgora';
import { getAnonymousID } from '../utils/identity';
import Loader from '../components/Loader';

const MY_ID = getAnonymousID();

// --- FUNCIONALIDAD PURA DE SALIDA (Fuera del componente para evitar closures) ---
const performLeaveRoom = async (roomId) => {
    if (!roomId) return;
    try {
        const roomRef = doc(db, "voice_rooms", roomId);
        
        // 1. INTENTO RÁPIDO: Sacar al usuario (arrayRemove es atómico y rápido)
        await updateDoc(roomRef, {
            users: arrayRemove(MY_ID)
        });

        // 2. LIMPIEZA: Verificar si quedó vacía para borrarla
        // (Esto podría fallar si cierras la pestaña muy rápido, pero el paso 1 suele pasar)
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
            const users = snap.data().users || [];
            if (users.length === 0) {
                await deleteDoc(roomRef);
            }
        }
    } catch (e) {
        console.error("Error saliendo de la sala:", e);
    }
};

// --- VISTA SALA ACTIVA ---
const ActiveRoom = ({ roomInitialData, onLeave }) => {
    const [roomData, setRoomData] = useState(roomInitialData);
    const { isConnected, toggleMute } = useAgora(roomInitialData.id, MY_ID);
    const [isMuted, setIsMuted] = useState(false);
    
    // Referencia para saber si ya salimos y evitar doble ejecución
    const hasLeft = useRef(false);

    // Escuchar cambios REALES en la lista de participantes
    useEffect(() => {
        const roomRef = doc(db, "voice_rooms", roomInitialData.id);
        const unsub = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                setRoomData({ id: docSnap.id, ...docSnap.data() });
            } else {
                // Si la sala se borra externamente, nos saca
                if (!hasLeft.current) onLeave(); 
            }
        });
        return unsub;
    }, [roomInitialData.id, onLeave]);

    // --- MANEJO ROBUSTO DE SALIDA Y DESMONTAJE ---
    useEffect(() => {
        const roomId = roomInitialData.id;

        // 1. Manejador para Cierre de Pestaña / Recarga (beforeunload)
        const handleTabClose = (e) => { 
            // Intentamos enviar la orden de salida antes de morir
            performLeaveRoom(roomId);
            // Nota: Los navegadores modernos a veces bloquean esto, pero es el mejor intento posible.
        };

        window.addEventListener('beforeunload', handleTabClose);

        // 2. Cleanup cuando el componente muere (Navegar atrás, Ir a Home, etc.)
        return () => {
            window.removeEventListener('beforeunload', handleTabClose);
            if (!hasLeft.current) {
                performLeaveRoom(roomId);
            }
        };
    }, [roomInitialData.id]);

    const handleManualLeave = async () => {
        hasLeft.current = true; // Marcar que salimos voluntariamente
        onLeave(); // Desmontar UI
        await performLeaveRoom(roomInitialData.id); // Ejecutar lógica DB
    };

    const handleMute = () => {
        const newState = toggleMute();
        setIsMuted(newState);
    };

    return (
        <div className="fade-in" style={{ 
            position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px',
            overflowY: 'auto'
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)', textAlign: 'center' }}>
                {roomData.name}
            </h2>
            
            {/* Estado Conexión */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? '#2ecc71' : '#f1c40f' }}></div>
                {isConnected ? "En vivo" : "Conectando..."}
            </div>

            {/* Círculo Principal */}
            <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div style={{ 
                    width: 100, height: 100, borderRadius: '50%', 
                    background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isConnected ? '0 0 0 4px var(--primary)' : 'none',
                }}>
                    <FaMicrophone size={40} color={isMuted ? 'gray' : 'var(--primary)'} />
                </div>
            </div>

            {/* Controles */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <button onClick={handleMute} style={{ padding: '15px', borderRadius: '50%', border: 'none', background: isMuted ? 'var(--text-secondary)' : 'var(--bg-body)', color: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                    <FaMicrophone size={20} />
                </button>
                <button onClick={handleManualLeave} style={{ padding: '15px 30px', borderRadius: '30px', border: 'none', background: '#e74c3c', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                    <FaSignOutAlt /> Salir
                </button>
            </div>

            {/* LISTA DE PARTICIPANTES EN VIVO */}
            <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-body)', borderRadius: '16px', padding: '20px', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUsers /> Participantes ({roomData.users?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {roomData.users && roomData.users.map((uid) => (
                        <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                            <FaUserCircle size={24} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: uid === MY_ID ? 700 : 400 }}>
                                {uid === MY_ID ? "Tú" : "Anónimo"}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '5px', fontFamily: 'monospace' }}>
                                    #{uid.slice(-4)}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function VoiceChat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ordenar por fecha de creación para que las nuevas salgan arriba
        const q = query(collection(db, "voice_rooms"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const validRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRooms(validRooms);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const joinRoom = async (room) => {
        // Evitar unirse si ya estoy dentro (aunque la UI lo previene, es doble seguridad)
        if (room.users && room.users.includes(MY_ID)) {
             setActiveRoomId(room.id); // Solo abrir la vista
             return;
        }

        try {
            const roomRef = doc(db, "voice_rooms", room.id);
            await updateDoc(roomRef, { users: arrayUnion(MY_ID) });
            setActiveRoomId(room.id);
        } catch (e) { 
            console.error(e); 
            alert("No se pudo entrar. Tal vez la sala ya no existe."); 
        }
    };

    const createRoom = async () => {
        const name = prompt("Nombre de la sala:");
        if (!name) return;
        try {
            const docRef = await addDoc(collection(db, "voice_rooms"), {
                name: name.trim(),
                createdAt: serverTimestamp(),
                users: [MY_ID] // Me agrego automáticamente
            });
            setActiveRoomId(docRef.id);
        } catch (e) { alert("Error creando sala"); }
    };

    // Renderizar Sala Activa si estoy en una
    const activeRoomData = rooms.find(r => r.id === activeRoomId);
    
    if (activeRoomData) {
        return (
            <ActiveRoom 
                roomInitialData={activeRoomData} 
                onLeave={() => setActiveRoomId(null)} 
            />
        );
    }

    return (
        <div className="fade-in" style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Salas de Voz</h1>
                <button onClick={createRoom} className="active-press" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-glow)' }}>
                    <FaPlus /> Crear
                </button>
            </div>

            {loading ? <Loader /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {rooms.length === 0 ? (
                         <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                            <FaHeadset size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <p>No hay salas activas.<br/>¡Crea la primera y empieza el chisme! 🤫</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} onClick={() => joinRoom(room)} className="active-press" style={{ background: 'var(--surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 45, height: 45, borderRadius: '12px', background: 'rgba(2, 136, 209, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0288d1' }}><FaHeadset size={22} /></div>
                                        <div><h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{room.name}</h3></div>
                                    </div>
                                    {/* Badge LIVE */}
                                    <div style={{ background: '#e0f2f1', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', height: 'fit-content' }}>
                                        <div style={{width:6, height:6, background:'#00b894', borderRadius:'50%'}}></div>
                                        <span style={{fontSize:'0.65rem', fontWeight:700, color:'#00695c'}}>LIVE</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaUsers /> {room.users ? room.users.length : 0} usuarios
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}