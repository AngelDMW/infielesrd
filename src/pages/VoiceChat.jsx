import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDoc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaUsers,
  FaPlus,
  FaHeadset,
  FaSignOutAlt,
  FaUserSecret,
  FaWaveSquare,
  FaTimes,
  FaLock,
  FaUnlock,
  FaShieldAlt,
  FaCircle
} from "react-icons/fa";
import useAgora from "../hooks/useAgora";
import { getAnonymousID } from "../utils/identity";
import Loader from "../components/Loader";

const MY_ID = getAnonymousID();

// --- CONFIGURACIÓN DE SALAS PERMANENTES ---
const OFFICIAL_ROOMS = [
  { id: "official_patio", title: "El Patio 🌴", theme: "chill", isPermanent: true },
  { id: "official_toxic", title: "Tóxicos Anónimos 🎭", theme: "toxic", isPermanent: true },
  { id: "official_debate", title: "Debate Caliente 🔥", theme: "debate", isPermanent: true }
];

const ROOM_THEMES = {
  chill: { color: "#3b82f6", label: "Chill & Hablar", icon: FaHeadset },
  debate: { color: "#f59e0b", label: "Debate", icon: FaMicrophone },
  toxic: { color: "#ef4444", label: "Tóxico", icon: FaWaveSquare },
};

export default function VoiceChat() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Interacción
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para Sala Privada (Join)
  const [passwordPromptRoom, setPasswordPromptRoom] = useState(null);
  const [inputPassword, setInputPassword] = useState("");

  // Inputs Creación
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomTheme, setNewRoomTheme] = useState("chill");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createPassword, setCreatePassword] = useState("");

  // Hook Agora
  const { isConnected, remoteUsers, toggleMute, isMuted } = useAgora(activeRoomId, MY_ID);

  // --- 1. INICIALIZACIÓN Y LIMPIEZA ---
  useEffect(() => {
    const initRooms = async () => {
      // A. Crear Salas Oficiales si no existen
      for (const room of OFFICIAL_ROOMS) {
        const roomRef = doc(db, "voice_rooms", room.id);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) {
          await setDoc(roomRef, {
            title: room.title,
            theme: room.theme,
            isPermanent: true,
            createdAt: serverTimestamp(),
            users: []
          });
        }
      }

      // B. Limpiar Salas de Usuarios Vacías
      const q = query(collection(db, "voice_rooms"));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (!data.isPermanent && (!data.users || data.users.length === 0)) {
          await deleteDoc(doc(db, "voice_rooms", docSnap.id));
        }
      });
    };

    initRooms();

    // C. Escuchar Cambios en Tiempo Real
    const q = query(collection(db, "voice_rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. LOGICA DE UNIÓN Y CREACIÓN ---

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    if (isPrivate && !createPassword.trim()) return alert("Pon una contraseña si es privada.");

    try {
      const docData = {
        title: newRoomTitle,
        theme: newRoomTheme,
        createdAt: serverTimestamp(),
        users: [MY_ID],
        hostId: MY_ID,
        isPermanent: false,
        isPrivate: isPrivate,
        password: isPrivate ? createPassword : null
      };

      const docRef = await addDoc(collection(db, "voice_rooms"), docData);
      
      setIsCreating(false);
      setNewRoomTitle("");
      setCreatePassword("");
      setIsPrivate(false);
      setActiveRoomId(docRef.id);
    } catch (error) {
      console.error("Error creando:", error);
    }
  };

  const handleTryJoin = (room) => {
    if (activeRoomId) return alert("Sal de la sala actual primero.");

    if (room.isPrivate) {
      setPasswordPromptRoom(room);
    } else {
      joinRoomDirectly(room.id);
    }
  };

  const submitPassword = () => {
    if (inputPassword === passwordPromptRoom.password) {
      joinRoomDirectly(passwordPromptRoom.id);
      setPasswordPromptRoom(null);
      setInputPassword("");
    } else {
      alert("Contraseña incorrecta 🚫");
    }
  };

  const joinRoomDirectly = async (roomId) => {
    try {
      const roomRef = doc(db, "voice_rooms", roomId);
      await updateDoc(roomRef, { users: arrayUnion(MY_ID) });
      setActiveRoomId(roomId);
    } catch (error) {
      console.error("Error uniéndose:", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoomId) return;
    const tempId = activeRoomId;
    setActiveRoomId(null);

    try {
      const roomRef = doc(db, "voice_rooms", tempId);
      await updateDoc(roomRef, { users: arrayRemove(MY_ID) });

      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.isPermanent && (!data.users || data.users.length === 0)) {
          await deleteDoc(roomRef);
        }
      }
    } catch (error) {
      console.error("Error saliendo:", error);
    }
  };

  // --- 3. VISTA: DENTRO DE LA SALA (OVERLAY) ---
  if (activeRoomId) {
    const currentRoom = rooms.find(r => r.id === activeRoomId) || { title: "Sala", theme: "chill", users: [] };
    const theme = ROOM_THEMES[currentRoom.theme || 'chill'];
    const participants = currentRoom.users || [];

    return (
      <div className="fade-in" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
        background: 'linear-gradient(180deg, var(--bg-body) 0%, var(--surface) 100%)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header Sala */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={handleLeaveRoom} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FaTimes size={24} color="var(--text-main)" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.color, fontWeight: 700 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.color, boxShadow: `0 0 10px ${theme.color}` }} />
                EN VIVO
            </div>
        </div>

        {/* CONTENIDO PRINCIPAL: Título y Lista */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
            
            <h1 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '5px', lineHeight: 1.2 }}>{currentRoom.title}</h1>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', opacity: 0.6, fontSize: '0.8rem' }}>
                {currentRoom.isPermanent && <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaShieldAlt /> Oficial</span>}
                {currentRoom.isPrivate && <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaLock /> Privada</span>}
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaUsers /> {participants.length} conectados</span>
            </div>
            
            {/* 🔴 LISTA DE PARTICIPANTES EN TIEMPO REAL */}
            <div style={{ 
                width: '100%', maxWidth: '400px', 
                background: 'var(--surface)', borderRadius: '20px',
                padding: '20px', boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-subtle)'
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>Participantes</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {participants.map(uid => {
                        const isMe = uid === MY_ID;
                        return (
                            <div key={uid} style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px', borderRadius: '12px',
                                background: isMe ? `${theme.color}15` : 'var(--bg-body)',
                                border: isMe ? `1px solid ${theme.color}` : '1px solid transparent'
                            }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: '50%', 
                                    background: 'var(--surface)', color: 'var(--text-main)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <FaUserSecret size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                        {isMe ? "Tú" : `Usuario ${uid.slice(-4)}`}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: isMe ? theme.color : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FaCircle size={6} color={isMe ? '#4ade80' : 'var(--text-secondary)'} />
                                        {isMe ? "Conectado" : "En la sala"}
                                    </div>
                                </div>
                                {isMe && isMuted && <FaMicrophoneSlash color="var(--text-secondary)" />}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Controles Inferiores (CORREGIDO) */}
        <div style={{ 
            background: 'var(--surface)', padding: '30px', 
            borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center'
        }}>
            <button 
                onClick={toggleMute}
                className="active-press"
                style={{ 
                    width: 65, height: 65, borderRadius: '50%', 
                    // ✅ AQUI ESTABA EL ERROR (doble border). YA CORREGIDO:
                    background: isMuted ? 'var(--bg-body)' : 'var(--text-main)',
                    color: isMuted ? 'var(--text-main)' : 'var(--surface)',
                    border: isMuted ? '2px solid var(--text-main)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '1.5rem',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}
            >
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>

            <button 
                onClick={handleLeaveRoom}
                className="active-press"
                style={{ 
                    padding: '18px 40px', borderRadius: '50px', border: 'none',
                    background: '#ef4444', color: 'white', fontWeight: 800, fontSize: '1.1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 5px 20px rgba(239, 68, 68, 0.4)'
                }}
            >
                <FaSignOutAlt /> SALIR
            </button>
        </div>
      </div>
    );
  }

  // --- 4. VISTA LISTADO DE SALAS ---
  return (
    <div className="fade-in page-content" style={{ paddingBottom: '100px' }}>
      
      {/* Header Listado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
         <div>
            <h1 className="section-title" style={{marginBottom: 5}}>Salas de Voz 🎙️</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Habla en vivo con la comunidad.</p>
         </div>
         <button 
            onClick={() => setIsCreating(true)}
            className="active-press"
            style={{
                background: 'var(--text-main)', color: 'var(--surface)', border: 'none',
                width: 50, height: 50, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)', cursor: 'pointer'
            }}
         >
            <FaPlus size={20} />
         </button>
      </div>

      {/* FORMULARIO CREAR SALA */}
      {isCreating && (
          <div className="fade-in" style={{ marginBottom: '30px', padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                  <h3 style={{ margin: 0 }}>Nueva Sala</h3>
                  <button onClick={() => setIsCreating(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><FaTimes /></button>
              </div>
              
              <input 
                 type="text" placeholder="Título de la sala..." autoFocus
                 value={newRoomTitle} onChange={e => setNewRoomTitle(e.target.value)}
                 style={{ 
                     width: '100%', padding: '15px', borderRadius: '12px', 
                     border: '1px solid var(--border-subtle)', 
                     background: 'var(--bg-body)', color: 'var(--text-main)', 
                     fontSize: '1rem', marginBottom: '15px', outline: 'none'
                 }}
              />
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  {Object.entries(ROOM_THEMES).map(([key, data]) => (
                      <button 
                        key={key} 
                        type="button"
                        onClick={() => setNewRoomTheme(key)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: newRoomTheme === key ? `2px solid ${data.color}` : '1px solid var(--border-subtle)',
                            background: newRoomTheme === key ? `${data.color}20` : 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                        }}
                      >
                          {data.label}
                      </button>
                  ))}
              </div>

              <div style={{ marginBottom: '20px', padding: '10px', background: 'var(--bg-body)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isPrivate ? '10px' : '0' }}>
                      <input 
                        type="checkbox" id="privateCheck" 
                        checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                      />
                      <label htmlFor="privateCheck" style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>Hacer sala privada 🔒</label>
                  </div>
                  
                  {isPrivate && (
                      <input 
                        type="text" 
                        placeholder="Contraseña de acceso..."
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text-main)', outline: 'none' }}
                      />
                  )}
              </div>

              <button onClick={handleCreateRoom} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  Lanzar Sala 🚀
              </button>
          </div>
      )}

      {/* MODAL PASSWORD (JOIN) */}
      {passwordPromptRoom && (
          <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: 'var(--surface)', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '350px', textAlign: 'center' }}>
                  <FaLock size={40} color="var(--text-main)" style={{ marginBottom: '15px' }} />
                  <h3 style={{ margin: '0 0 10px 0' }}>Sala Privada</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Introduce la clave para entrar a "{passwordPromptRoom.title}".</p>
                  
                  <input 
                    type="text" autoFocus
                    placeholder="Contraseña..."
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-body)', color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', fontSize: '1.1rem', outline: 'none' }}
                  />
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setPasswordPromptRoom(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--bg-body)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={submitPassword} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Entrar</button>
                  </div>
              </div>
          </div>
      )}

      {/* LISTA DE SALAS */}
      {loading ? <Loader /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {rooms.sort((a, b) => (b.isPermanent ? 1 : 0) - (a.isPermanent ? 1 : 0)).map(room => {
                  const theme = ROOM_THEMES[room.theme] || ROOM_THEMES.chill;
                  const userCount = room.users ? room.users.length : 0;
                  
                  return (
                      <div key={room.id} className="active-press" style={{
                          background: 'var(--surface)', borderRadius: '20px', padding: '20px',
                          border: room.isPermanent ? `2px solid ${theme.color}` : '1px solid var(--border-subtle)', 
                          position: 'relative', overflow: 'hidden',
                          boxShadow: 'var(--shadow-sm)'
                      }}>
                          {room.isPermanent && (
                              <div style={{ position: 'absolute', top: 0, right: 0, background: theme.color, color: 'white', padding: '4px 10px', borderBottomLeftRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                                  OFICIAL
                              </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                              <div style={{ 
                                  width: 50, height: 50, borderRadius: '15px', 
                                  background: `${theme.color}20`, color: theme.color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                              }}>
                                  <theme.icon size={24} />
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                      {room.isPrivate && <FaLock size={12} color="var(--text-secondary)" />}
                                      <h3 style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.2 }}>{room.title}</h3>
                                  </div>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <FaUsers /> {userCount} oyendo
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          <button 
                            onClick={() => handleTryJoin(room)}
                            style={{
                                marginTop: '15px', width: '100%', padding: '12px', 
                                borderRadius: '12px', border: 'none',
                                background: 'var(--text-main)', color: 'var(--surface)', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: room.isPrivate ? 0.9 : 1
                            }}
                          >
                              {room.isPrivate ? <><FaUnlock /> Desbloquear</> : <><FaHeadset /> Unirme</>}
                          </button>
                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
}