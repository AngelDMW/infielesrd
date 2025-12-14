// src/pages/VoiceChat.jsx - UNIFICADO Y CORREGIDO FINALMENTE

import React, { useState, useEffect, useCallback, useMemo } from 'react'; 
import { 
    collection, query, orderBy, limit, getDocs, addDoc, 
    doc, updateDoc, deleteDoc, 
    // 🏆 CORRECCIÓN CRÍTICA: serverTimestamp debe venir de 'firebase/firestore'
    serverTimestamp, arrayUnion, arrayRemove, 
    onSnapshot, 
    where, setDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { FaMicrophone, FaUsers, FaPlus, FaHeadset, FaVolumeUp, FaSignOutAlt, FaSpinner, FaLock, FaUserSecret, FaTrashAlt, FaCrown, FaBan } from 'react-icons/fa'; 
import { useAgoraAudio } from '../hooks/useAgoraAudio'; // Asegúrate de que este hook esté con la corrección de useRef


// 🚨 CONFIGURACIÓN DE ADMIN 
const ADMIN_UIDS = [
    "Anon-SESS-8127", 
    "Anon-SESS-3005"         
]; 


// =========================================================================
// 1. COMPONENTE OPTIMIZADO: UserChip 
// =========================================================================
const UserChip = React.memo(({ user, isCurrentUser, isSpeakingNow, isAdmin, onBan }) => {
    
    const isRoomAdmin = ADMIN_UIDS.includes(user);

    return (
        <span 
            key={user}
            style={{
                background: isSpeakingNow ? 'rgba(206, 17, 38, 0.2)' : 'var(--surface)',
                color: isSpeakingNow ? 'var(--primary)' : 'var(--text-main)',
                padding: '8px 15px', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                fontWeight: 'bold', 
                border: isSpeakingNow || isCurrentUser ? '2px solid var(--primary)' : '1px solid var(--border)',
                marginBottom: '10px' 
            }}
        >
            {isSpeakingNow ? <FaVolumeUp size={12}/> : <FaUserSecret size={12} style={{color: 'var(--accent-blue)'}}/>}
            
            {user} {isCurrentUser && '(Tú)'}
            {isRoomAdmin && <FaCrown style={{color: 'gold', marginLeft: '5px'}} title="Admin Fijo"/>}
            
            {isAdmin && !isCurrentUser && (
                <button 
                    onClick={() => onBan(user)}
                    style={{marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: '0'}}
                    title={`Banear a ${user}`}
                >
                    <FaBan size={14} />
                </button>
            )}
        </span>
    );
});


// =========================================================================
// 2. Componente: VoiceRoom (Sala de Chat Activa)
// =========================================================================

const TEMP_CHANNEL_FOR_AGORA = "TEST_VOICE_CHANNEL_DEV"; 

const VoiceRoom = ({ roomId, roomName, onLeave, isAdmin }) => { 
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const roomRef = doc(db, "voice_rooms", roomId);

    // ID DE USUARIO PERMANENTE 
    const ANONYMOUS_USER = useMemo(() => {
        let storedId = localStorage.getItem('anon_admin_uid');

        if (!storedId) {
            const newId = `Anon-SESS-${Math.floor(Math.random() * 10000)}`;
            localStorage.setItem('anon_admin_uid', newId);
            storedId = newId;
        }
        
        return storedId;
    }, []); 

    // Uso del hook de audio
    const { 
        isConnected: isAgoraConnected, 
        isMuted,                     
        remoteUsers: agoraUsers,     
        toggleMute                  
    } = useAgoraAudio(TEMP_CHANNEL_FOR_AGORA, ANONYMOUS_USER); 
    

    // 🚨 FUNCIÓN DE ADMINISTRADOR: BANEAR USUARIO
    const handleBanUser = async (userIdToBan) => {
        if (!isAdmin) {
            alert("Acceso denegado.");
            return;
        }

        if (window.confirm(`¿Estás seguro de que quieres BANEAR permanentemente a ${userIdToBan}?`)) {
            try {
                await setDoc(doc(db, "banned_users", userIdToBan), {
                    bannedAt: serverTimestamp(),
                    reason: "Admin Ban",
                    adminId: ANONYMOUS_USER
                });

                const banRoomRef = doc(db, "voice_rooms", roomId);
                await updateDoc(banRoomRef, {
                    users: arrayRemove(userIdToBan),
                    // usersCount YA NO SE USA
                });
                
                alert(`Usuario ${userIdToBan} ha sido baneado y expulsado de la sala.`);

            } catch (error) {
                console.error("Error al banear usuario:", error);
                alert("Fallo al banear el usuario.");
            }
        }
    };


    // 🚩 GESTIÓN DE PRESENCIA (Unirse/Salir) - CRÍTICO: Se corrige el bucle de unirse/fallar
    useEffect(() => {

        const joinRoom = async () => {
            try {
                await updateDoc(roomRef, {
                    users: arrayUnion(ANONYMOUS_USER),
                    emptySince: arrayRemove() 
                });
                console.log(`[VOZ] ${ANONYMOUS_USER} se ha unido.`);
            } catch (error) {
                console.error("[VOZ/JOIN_FAIL] Fallo al unirse:", error.code);
            }
        };
        
        const leaveRoom = async () => {
            try {
                // 🚨 CORRECCIÓN CRÍTICA: Usar serverTimestamp()
                await updateDoc(roomRef, {
                    users: arrayRemove(ANONYMOUS_USER),
                    emptySince: serverTimestamp() 
                });
                console.log(`[VOZ] ${ANONYMOUS_USER} ha salido.`);
            } catch (error) {
                // Si este error persiste, verifica el import de serverTimestamp
                console.warn("[VOZ/LEAVE_FAIL] Error al salir:", error); 
            }
        };

        joinRoom();

        // 🛑 CLEANUP: Esta función se ejecuta al desmontar VoiceRoom (al salir)
        return () => {
            leaveRoom();
        };

    }, [roomId, roomRef, ANONYMOUS_USER]); 


    // 🚩 LISTENER DE USUARIOS EN TIEMPO REAL (LECTURA)
    useEffect(() => {
        const unsubscribe = onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                let currentUsers = doc.data().users || [];
                // SINCRO: Filtramos nulos por seguridad
                setUsers(currentUsers.filter(u => u)); 
            }
            setLoading(false);
        }, (error) => {
            console.error("Error en el listener de sala (se ha detenido):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [roomRef]);


    // --- RENDERING DENTRO DE LA SALA ---
    return (
        <div className="admin-container fade-in" style={{maxWidth: '800px', margin: '30px auto'}}>
            <h2 style={{fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <FaMicrophone style={{color: 'var(--accent-blue)'}}/> En la Sala: {roomName}
            </h2>
             <p style={{color: isAgoraConnected ? 'green' : 'var(--accent-red)', fontWeight: 'bold', marginBottom: '30px'}}>
                 {isAgoraConnected ? '✅ Conectado al servicio de audio' : '🟡 Conectando audio...'}
            </p>

            <div className="card" style={{marginBottom: '25px', padding: '20px', textAlign: 'center'}}>
                <button 
                    onClick={toggleMute} 
                    disabled={!isAgoraConnected} 
                    className={!isMuted ? 'is-speaking' : ''} 
                    style={{
                        padding: '15px 30px', 
                        borderRadius: '30px', 
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    <FaMicrophone size={20} style={{marginRight: '10px'}}/> 
                    {isMuted ? 'Silenciado (Toca para hablar)' : '¡Hablando! (Silenciar)'}
                </button>
            </div>
            
            <div className="card" style={{padding: '20px'}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px'}}>
                    <FaUsers /> Participantes ({users.length}) 
                </h3>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px'}}>
                    {agoraUsers.length} personas tienen su micrófono activo (Escuchando audio real).
                </p>
                {loading ? <p><FaSpinner className="spin-icon"/> Cargando lista...</p> : (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                        {/* RENDERIZADO OPTIMIZADO CON UserChip */}
                        {users.map((user) => {
                            const isCurrentUser = user === ANONYMOUS_USER; 
                            const isSpeakingNow = agoraUsers.includes(user) || (isCurrentUser && !isMuted);

                            return (
                                <UserChip 
                                    key={user} 
                                    user={user}
                                    isCurrentUser={isCurrentUser}
                                    isSpeakingNow={isSpeakingNow}
                                    isAdmin={isAdmin}
                                    onBan={handleBanUser} 
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <button 
                onClick={onLeave} 
                className="btn-secondary" 
                style={{marginTop: '30px', width: '100%', padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}
            >
                <FaSignOutAlt /> Salir de la Sala
            </button>
        </div>
    );
};


// =========================================================================
// 3. Componente Principal: VoiceChat 
// =========================================================================

export default function VoiceChat() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRoom, setActiveRoom] = useState(null); 
    const [isBanned, setIsBanned] = useState(false); 
    
    // ID DE USUARIO PERMANENTE
    const ANONYMOUS_USER = useMemo(() => {
        let storedId = localStorage.getItem('anon_admin_uid');

        if (!storedId) {
            const newId = `Anon-SESS-${Math.floor(Math.random() * 10000)}`;
            localStorage.setItem('anon_admin_uid', newId);
            storedId = newId;
        }
        
        return storedId;
    }, []); 

    // VERIFICACIÓN DE ADMIN
    const isAdmin = useMemo(() => ADMIN_UIDS.includes(ANONYMOUS_USER), [ANONYMOUS_USER]);


    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            // ===================================================
            // PASO 1: VERIFICACIÓN DE BANEO
            // ===================================================
            const banDoc = await getDocs(query(collection(db, "banned_users"), where("__name__", "==", ANONYMOUS_USER)));
            
            if (!isAdmin && !banDoc.empty) {
                 setIsBanned(true);
                 setLoading(false);
                 return;
            }
            setIsBanned(false);
            
            // ===================================================
            // 🛑 PASO 2: LIMPIEZA DE SALAS VACÍAS (BLOQUE COMENTADO PARA EVITAR BORRADO)
            // ===================================================
            /*
            const emptyRoomsQuery = query(collection(db, "voice_rooms"), where("users", "==", [])); 
            const emptySnap = await getDocs(emptyRoomsQuery);
            
            const now = Date.now();
            const TWENTY_FOUR_HOURS_MS = 86400000; 

            for (const doc of emptySnap.docs) {
                const roomData = doc.data();
                const emptySinceMs = roomData.emptySince?.toDate().getTime();

                if (emptySinceMs && (now - emptySinceMs > TWENTY_FOUR_HOURS_MS)) {
                    console.log(`[CLEANUP] Eliminando sala vacía antigua: ${doc.id}`);
                    await deleteDoc(doc.ref);
                }
            }
            */
            
            // ===================================================
            // PASO 3: CARGAR LA LISTA DE SALAS
            // ===================================================
            // Ordenar por el array 'users' (tamaño descendente) y luego por fecha
            const q = query(collection(db, "voice_rooms"), orderBy("users", "desc"), orderBy("createdAt", "desc"), limit(20));
            const snap = await getDocs(q);
            setRooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        

        } catch (error) {
            console.error("Error cargando/limpiando salas de voz:", error);
        } finally {
            setLoading(false);
        }
    }, [ANONYMOUS_USER, isAdmin]); 


    useEffect(() => {
        // Ejecutar la carga inicial (y limpieza, aunque esté desactivada)
        fetchRooms();
        
        // Listener en tiempo real para mantener la lista actualizada
        const q = query(collection(db, "voice_rooms"), orderBy("users", "desc"), orderBy("createdAt", "desc"), limit(20));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error en el listener de salas:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchRooms]);


    const handleJoinRoom = (id) => {
        const roomToJoin = rooms.find(r => r.id === id);
        if (roomToJoin) {
            setActiveRoom({ id: id, name: roomToJoin.name });
        }
    };
    
    const handleLeaveRoom = () => {
        setActiveRoom(null);
    };
    
    // Función para eliminar una sala (Admin)
    const handleDeleteRoom = async (roomId) => {
        if (!isAdmin) return alert("Solo los administradores pueden eliminar salas.");
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta sala de forma permanente?")) return;

        try {
            await deleteDoc(doc(db, "voice_rooms", roomId));
            alert("Sala eliminada con éxito.");
            fetchRooms(); // Recargar la lista
        } catch (error) {
            console.error("Error al eliminar la sala:", error);
            alert("Fallo al eliminar la sala.");
        }
    };


    if (isBanned) {
         return (
             <div style={{textAlign: 'center', padding: '50px', color: 'var(--accent-red)'}}>
                <FaBan size={40} style={{marginBottom: '20px'}}/>
                <h2>🚫 Has sido baneado.</h2>
                <p>Tu ID ({ANONYMOUS_USER}) está en la lista de usuarios bloqueados.</p>
            </div>
         );
    }
    
    if (activeRoom) {
        return <VoiceRoom roomId={activeRoom.id} roomName={activeRoom.name} onLeave={handleLeaveRoom} isAdmin={isAdmin} />;
    }
    
    return (
        <div className="app-container" style={{paddingBottom: '100px', padding: '0 25px'}}>
            
            <header style={{padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h1 style={{fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <FaHeadset style={{color: 'var(--accent-blue)'}}/> Salas de Voz Anónimas
                    </h1>
                    <p style={{color: 'var(--text-secondary)', fontSize: '1rem'}}>
                        Únete a un grupo para comentar los chismes en vivo y anónimamente.
                    </p>
                </div>
                {isAdmin && (
                     <span style={{background: 'var(--accent-red)', color: 'white', padding: '5px 15px', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <FaCrown /> MODO ADMINISTRADOR
                     </span>
                )}
            </header>
            
            <CreateRoomForm fetchRooms={fetchRooms} />
            
            <button 
                onClick={fetchRooms} 
                className="btn-secondary" 
                disabled={loading}
                style={{marginBottom: '20px', width: '100%', padding: '10px'}}
            >
                {loading ? <FaSpinner className="spin-icon"/> : 'Refrescar Lista'}
            </button>

            <h2 style={{fontSize: '1.4rem', marginBottom: '20px', padding: '0 10px'}}>Salas Disponibles</h2>

            {loading ? (
                <div style={{textAlign: 'center', padding: '30px'}}><FaSpinner className="spin-icon" size={24}/> Buscando salas...</div>
            ) : rooms.length === 0 ? (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No hay salas activas. ¡Crea la primera!</p>
            ) : (
                rooms.map(room => (
                    <VoiceRoomCard 
                        key={room.id} 
                        room={room} 
                        onJoin={handleJoinRoom}
                        isAdmin={isAdmin} 
                        onDelete={handleDeleteRoom} 
                    />
                ))
            )}
            
        </div>
    );
}

// =========================================================================
// 4. Componentes Auxiliares (VoiceRoomCard y CreateRoomForm)
// =========================================================================
const VoiceRoomCard = ({ room, onJoin, isAdmin, onDelete }) => ( 
    <div className="card" style={{marginBottom: '15px', padding: '20px', borderLeft: room.isLocked ? '5px solid var(--accent-red)' : '5px solid var(--accent-blue)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <FaVolumeUp style={{color: 'var(--accent-blue)'}}/> 
                {room.name}
            </h3>
            {room.isLocked && <FaLock style={{color: 'var(--accent-red)'}} title="Sala Privada"/>}
        </div>
        
        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px', marginBottom: '15px'}}>
            {room.description || "Conversación anónima general."}
        </p>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '15px'}}>
            {/* 🏆 CONTEO CORREGIDO: Usando room.users.length */}
            <span style={{fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <FaUsers /> {room.users?.length || 0} en línea 
            </span>
            
            <div style={{display: 'flex', gap: '10px'}}>
                {isAdmin && (
                    <button 
                        onClick={() => onDelete(room.id)} 
                        className="btn-danger" 
                        style={{padding: '8px 10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'}}
                        title="Eliminar Sala (Admin)"
                    >
                        <FaTrashAlt />
                    </button>
                )}
                
                <button 
                    onClick={() => onJoin(room.id)} 
                    className="btn-primary" 
                    style={{padding: '8px 15px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                    <FaHeadset /> {isAdmin ? 'Unirse como Admin' : 'Unirse'}
                </button>
            </div>
        </div>
    </div>
);


const CreateRoomForm = ({ fetchRooms }) => {
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (name.trim() === '') return alert("El nombre de la sala es obligatorio.");

        try {
            await addDoc(collection(db, "voice_rooms"), {
                name: name.trim(),
                description: description.trim(),
                isLocked: isLocked,
                // 🏆 CREACIÓN CORREGIDA: Usando serverTimestamp
                createdAt: serverTimestamp(), 
                users: [], 
            });
            alert(`Sala "${name}" creada con éxito.`);
            setName('');
            setDescription('');
            setIsLocked(false);
            fetchRooms(); 
        } catch (error) {
            console.error("Error al crear la sala:", error);
            // Mostrar error específico, si es posible
            alert(`Fallo al crear la sala. Error: ${error.message || 'Desconocido'}`);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="card fade-in" style={{padding: '25px', marginBottom: '30px', borderLeft: '5px solid var(--primary)'}}>
            <h3 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}><FaPlus/> Crear Nueva Sala</h3>
            
            <input 
                type="text" 
                placeholder="Nombre de la Sala (Ej: El Bochinche de la Noche)" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                style={{marginBottom: '10px', padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)'}}
            />
            <textarea
                placeholder="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
                 style={{marginBottom: '15px', padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', resize: 'none'}}
            />
            
            <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold', color: isLocked ? 'var(--accent-red)' : 'var(--text-main)'}}>
                <input 
                    type="checkbox" 
                    checked={isLocked} 
                    onChange={(e) => setIsLocked(e.target.checked)}
                    style={{width: '20px', height: '20px'}}
                />
                <FaLock /> Sala Privada
            </label>
            
            <button type="submit" className="btn-primary" style={{width: '100%', padding: '12px'}}>
                Crear Sala
            </button>
        </form>
    );
};