import { useState, useEffect } from 'react';
import { 
    collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc, 
    onSnapshot, getCountFromServer 
} from 'firebase/firestore'; 
import { db } from '../firebase';
import { 
    FaChartLine, FaFlag, FaCheck, FaTrashAlt, FaSpinner, 
    FaRegClock, FaNewspaper, FaExclamationTriangle, FaHeadset, FaUsers 
} from 'react-icons/fa';
import { formatTimeAgo } from '../utils/timeFormat'; 

// --- SUB-COMPONENTE: GESTIÓN DE SALAS DE VOZ ---
const VoiceRoomsManager = () => {
    const [rooms, setRooms] = useState([]);
    
    // Escuchar salas en tiempo real (para ver si entra gente)
    useEffect(() => {
        const q = query(collection(db, "voice_rooms"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const handleDelete = async (id) => {
        if(window.confirm("¿Estás seguro de forzar el cierre de esta sala?")) {
            try {
                await deleteDoc(doc(db, "voice_rooms", id));
            } catch (e) {
                alert("Error borrando sala: " + e.message);
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Salas Activas ({rooms.length})</h3>
            
            {rooms.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                    No hay chats de voz activos en este momento.
                </p>
            ) : (
                rooms.map(r => (
                    <div key={r.id} style={{ 
                        background: 'var(--surface)', padding: '15px 20px', 
                        borderRadius: '12px', border: '1px solid var(--border-subtle)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                width: 40, height: 40, borderRadius: '50%', 
                                background: '#e0f7fa', color: '#0288d1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FaHeadset size={20} />
                            </div>
                            <div>
                                <strong style={{ fontSize: '1rem', display: 'block' }}>{r.name}</strong>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <FaUsers size={12} /> {r.users?.length || 0} usuarios conectados
                                </span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleDelete(r.id)} 
                            style={{ 
                                background: '#fee2e2', color: '#dc2626', border: 'none', 
                                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.85rem'
                            }}
                        >
                            <FaTrashAlt /> Eliminar
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

// --- SUB-COMPONENTE: TABLA DE REPORTES ---
const ReportsTable = () => {
    const [reports, setReports] = useState([]);
    
    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, "reports"), orderBy("createdAt", "desc")); // Asegúrate que en Firebase guardes como 'createdAt' o 'reportedAt'
            const snap = await getDocs(q);
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetch();
    }, []);

    const handleDeleteContent = async (report) => {
        if (!window.confirm("¿Eliminar contenido reportado y cerrar reporte?")) return;
        try {
            if (report.type === 'story') {
                await deleteDoc(doc(db, "stories", report.targetId));
            } else if (report.type === 'comment') {
                // Borrar comentario (requiere saber ID de historia, si guardaste storyId en el reporte ayuda)
                // Si no, solo borramos el reporte por ahora como ejemplo
            }
            await deleteDoc(doc(db, "reports", report.id));
            setReports(prev => prev.filter(r => r.id !== report.id));
            alert("Acción realizada.");
        } catch (e) { alert("Error: " + e.message); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {reports.map(r => (
                <div key={r.id} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ffcc00', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaExclamationTriangle /> {r.reason}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {r.createdAt ? formatTimeAgo(r.createdAt) : 'Hace un momento'}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                        Tipo: <strong>{r.type}</strong> | ID: {r.targetId}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleDeleteContent(r)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Eliminar Contenido</button>
                        <button onClick={() => deleteDoc(doc(db, "reports", r.id)).then(() => setReports(p => p.filter(x => x.id !== r.id)))} style={{ padding: '8px 16px', background: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Ignorar Reporte</button>
                    </div>
                </div>
            ))}
            {reports.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No hay reportes pendientes.</p>}
        </div>
    );
};

// --- SUB-COMPONENTE: HISTORIAS PENDIENTES ---
const PendingStories = () => {
    const [stories, setStories] = useState([]);

    const fetchPending = async () => {
        const q = query(collection(db, "stories"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                await updateDoc(doc(db, "stories", id), { status: "approved" });
            } else {
                await deleteDoc(doc(db, "stories", id));
            }
            setStories(prev => prev.filter(s => s.id !== id));
        } catch (e) { alert("Error: " + e.message); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stories.map(s => (
                <div key={s.id} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{marginBottom: 10}}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(206,17,38,0.1)', padding: '4px 8px', borderRadius: '4px', marginRight: 10 }}>
                            {s.category === 'other' ? `✨ ${s.customLabel}` : s.category}
                        </span>
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{s.content}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleAction(s.id, 'approve')} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Aprobar</button>
                        <button onClick={() => handleAction(s.id, 'reject')} style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Rechazar</button>
                    </div>
                </div>
            ))}
            {stories.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No hay historias pendientes.</p>}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ADMIN ---
export default function Admin() {
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, reports: 0 });

    // Cargar contadores simples
    useEffect(() => {
        const loadStats = async () => {
            try {
                const pendingSnap = await getCountFromServer(query(collection(db, "stories"), where("status", "==", "pending")));
                const reportsSnap = await getCountFromServer(collection(db, "reports"));
                setStats({ pending: pendingSnap.data().count, reports: reportsSnap.data().count });
            } catch (e) { console.log("Error stats", e); }
        };
        loadStats();
    }, []);

    const tabs = [
        { id: 'pending', label: 'Historias', icon: FaNewspaper, count: stats.pending },
        { id: 'reports', label: 'Reportes', icon: FaFlag, count: stats.reports },
        { id: 'voice', label: 'Salas Voz', icon: FaHeadset, count: null }, // Count dinámico dentro
    ];

    return (
        <div className="fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
            <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Panel de Control</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Moderación InfielesRD</p>
            </div>

            {/* TAB MENU */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="active-press"
                        style={{ 
                            flex: 1, minWidth: '100px',
                            padding: '15px', 
                            background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)', 
                            color: activeTab === tab.id ? 'white' : 'var(--text-main)', 
                            borderRadius: '12px', cursor: 'pointer', border: 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <tab.icon size={20} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tab.label}</span>
                        {tab.count !== null && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({tab.count})</span>}
                    </button>
                ))}
            </div>

            {/* CONTENIDO TABS */}
            <div>
                {activeTab === 'pending' && <PendingStories />}
                {activeTab === 'reports' && <ReportsTable />}
                {activeTab === 'voice' && <VoiceRoomsManager />}
            </div>
        </div>
    );
}