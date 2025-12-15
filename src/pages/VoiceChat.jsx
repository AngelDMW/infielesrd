import { useState, useEffect } from 'react'; 
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaMicrophone, FaUsers, FaPlus, FaHeadset, FaSignOutAlt, FaLock } from 'react-icons/fa'; 
import { useAgoraAudio } from '../hooks/useAgoraAudio';
import { getAnonymousID } from '../utils/identity';
import Loader from '../components/Loader';

// TARJETA DE SALA
const RoomCard = ({ room, onJoin }) => (
    <div onClick={() => onJoin(room)} className="active-press" style={{
        background: 'var(--surface)', borderRadius: '16px', padding: '20px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
        marginBottom: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(0, 45, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <FaHeadset size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{room.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{room.description || "Sala pública"}</span>
                </div>
            </div>
            {room.isLocked && <FaLock color="var(--text-secondary)" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            <FaUsers /> {room.users ? room.users.length : 0} escuchando
        </div>
    </div>
);

// VISTA DE SALA ACTIVA
const ActiveRoom = ({ room, onLeave }) => {
    const anonID = getAnonymousID();
    // Hook de Agora: se conecta automáticamente al montar
    const { isConnected, isMuted, toggleMute } = useAgoraAudio(room.id, anonID);

    return (
        <div className="fade-in" style={{ 
            position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ 
                width: 120, height: 120, borderRadius: '50%', 
                background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isConnected ? '0 0 0 4px var(--primary)' : 'none',
                marginBottom: '30px', transition: '0.3s'
            }}>
                <FaMicrophone size={50} color={isConnected ? 'var(--primary)' : 'var(--text-secondary)'} />
            </div>
            
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--text-main)' }}>{room.name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
                {isConnected ? "🔴 En vivo - Conectado" : "Conectando..."}
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={toggleMute} style={{ 
                    padding: '15px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isMuted ? 'var(--bg-body)' : 'var(--primary)',
                    color: isMuted ? 'var(--text-main)' : 'white'
                }}>
                    <FaMicrophone size={24} />
                </button>
                <button onClick={onLeave} style={{ 
                    padding: '15px 30px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                    background: '#e74c3c', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <FaSignOutAlt /> Salir
                </button>
            </div>
        </div>
    );
};

export default function VoiceChat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query de salas
        const q = query(collection(db, "voice_rooms"), orderBy("users", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleCreateRoom = async () => {
        const name = prompt("Nombre de la sala:");
        if (!name) return;
        try {
            await addDoc(collection(db, "voice_rooms"), {
                name, description: "Sala creada por usuario",
                createdAt: serverTimestamp(), users: []
            });
        } catch (e) { alert("Error creando sala"); }
    };

    if (activeRoom) return <ActiveRoom room={activeRoom} onLeave={() => setActiveRoom(null)} />;

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Salas de Voz</h1>
                <button onClick={handleCreateRoom} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaPlus /> Crear
                </button>
            </div>

            {loading ? <Loader /> : (
                <div>
                    {rooms.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
                            No hay salas activas. ¡Crea una!
                        </div>
                    ) : (
                        rooms.map(room => (
                            <RoomCard key={room.id} room={room} onJoin={setActiveRoom} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}