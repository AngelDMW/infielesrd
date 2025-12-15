import { useState, useEffect } from 'react'; 
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

// --- VISTA SALA ACTIVA ---
const ActiveRoom = ({ roomInitialData, onLeave }) => {
    const [roomData, setRoomData] = useState(roomInitialData);
    const { isConnected, toggleMute } = useAgora(roomInitialData.id, MY_ID);
    const [isMuted, setIsMuted] = useState(false);

    // Escuchar cambios REALES en la lista de participantes de Firebase
    useEffect(() => {
        const roomRef = doc(db, "voice_rooms", roomInitialData.id);
        const unsub = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                setRoomData({ id: docSnap.id, ...docSnap.data() });
            } else {
                onLeave(); // Si la sala se borra, salir
            }
        });
        return unsub;
    }, [roomInitialData.id, onLeave]);

    // Limpieza al cerrar pestaña
    useEffect(() => {
        const handleTabClose = (e) => { e.preventDefault(); onLeave(); };
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
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px',
            overflowY: 'auto'
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)' }}>{roomData.name}</h2>
            
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
                <button onClick={handleMute} style={{ padding: '15px', borderRadius: '50%', border: 'none', background: isMuted ? 'var(--text-secondary)' : 'var(--bg-body)', color: 'white', cursor: 'pointer' }}>
                    <FaMicrophone size={20} />
                </button>
                <button onClick={onLeave} style={{ padding: '15px 30px', borderRadius: '30px', border: 'none', background: '#e74c3c', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaSignOutAlt /> Salir
                </button>
            </div>

            {/* LISTA DE PARTICIPANTES EN VIVO */}
            <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-body)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUsers /> Participantes ({roomData.users?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {roomData.users && roomData.users.map((uid) => (
                        <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--surface)', borderRadius: '10px' }}>
                            <FaUserCircle size={24} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: uid === MY_ID ? 700 : 400 }}>
                                {uid === MY_ID ? "Tú" : "Anónimo"}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '5px' }}>
                                    {uid.slice(-4)}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function VoiceChat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "voice_rooms"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const validRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRooms(validRooms);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const joinRoom = async (room) => {
        try {
            const roomRef = doc(db, "voice_rooms", room.id);
            await updateDoc(roomRef, { users: arrayUnion(MY_ID) });
            setActiveRoomId(room.id);
        } catch (e) { console.error(e); alert("No se pudo entrar."); }
    };

    const leaveRoom = async () => {
        if (!activeRoomId) return;
        const roomId = activeRoomId;
        setActiveRoomId(null); 

        try {
            const roomRef = doc(db, "voice_rooms", roomId);
            // Usamos runTransaction para asegurar que el conteo y borrado sea atómico
            await db.runTransaction(async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) return;

                const currentUsers = roomDoc.data().users || [];
                const newUsers = currentUsers.filter(uid => uid !== MY_ID);

                if (newUsers.length === 0) {
                    transaction.delete(roomRef); // Borrar si vacío
                } else {
                    transaction.update(roomRef, { users: newUsers });
                }
            });
        } catch (e) { console.error("Error saliendo:", e); }
    };

    const createRoom = async () => {
        const name = prompt("Nombre de la sala:");
        if (!name) return;
        try {
            const docRef = await addDoc(collection(db, "voice_rooms"), {
                name: name.trim(),
                createdAt: serverTimestamp(),
                users: [MY_ID]
            });
            setActiveRoomId(docRef.id);
        } catch (e) { alert("Error creando sala"); }
    };

    const activeRoomData = rooms.find(r => r.id === activeRoomId);
    if (activeRoomData) {
        return <ActiveRoom roomInitialData={activeRoomData} onLeave={leaveRoom} />;
    }

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Salas de Voz</h1>
                <button onClick={createRoom} className="active-press" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaPlus /> Crear
                </button>
            </div>

            {loading ? <Loader /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {rooms.map(room => (
                        <div key={room.id} onClick={() => joinRoom(room)} className="active-press" style={{ background: 'var(--surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 45, height: 45, borderRadius: '12px', background: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0288d1' }}><FaHeadset size={22} /></div>
                                    <div><h3 style={{ margin: 0, fontSize: '1rem' }}>{room.name}</h3></div>
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <FaUsers /> {room.users ? room.users.length : 0} usuarios
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}