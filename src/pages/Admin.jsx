import { useState, useEffect, useCallback } from 'react';
import { 
    collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc, 
    getCountFromServer, getDoc
} from 'firebase/firestore'; 
import { db } from '../firebase';
import { FaChartLine, FaFlag, FaCheck, FaTrashAlt, FaSpinner, FaRegClock, FaNewspaper, FaExclamationTriangle } from 'react-icons/fa';
import { formatTimeAgo } from '../utils/timeFormat'; 

// --- SUB-COMPONENTE: TABLA DE REPORTES ---
const ReportsTable = ({ onDelete }) => {
    const [reports, setReports] = useState([]);
    
    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
            const snap = await getDocs(q);
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetch();
    }, []);

    const handleDeleteContent = async (report) => {
        if (!window.confirm("¿Estás seguro de eliminar el contenido reportado?")) return;
        try {
            // Eliminar contenido (Historia)
            if (report.type === 'story') {
                await deleteDoc(doc(db, "stories", report.targetId));
            }
            // Eliminar reporte
            await deleteDoc(doc(db, "reports", report.id));
            setReports(prev => prev.filter(r => r.id !== report.id));
            alert("Contenido eliminado y reporte cerrado.");
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTimeAgo(r.reportedAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>ID Objetivo: {r.targetId} ({r.type})</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleDeleteContent(r)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Eliminar Contenido</button>
                        <button style={{ padding: '8px 16px', background: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Ignorar</button>
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
        } catch (e) { alert("Error"); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stories.map(s => (
                <div key={s.id} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{s.content}</p>
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

// --- MAIN ADMIN COMPONENT ---
export default function Admin() {
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, reports: 0 });

    useEffect(() => {
        const loadStats = async () => {
            const pendingSnap = await getCountFromServer(query(collection(db, "stories"), where("status", "==", "pending")));
            const reportsSnap = await getCountFromServer(collection(db, "reports"));
            setStats({ pending: pendingSnap.data().count, reports: reportsSnap.data().count });
        };
        loadStats();
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-body)' }}>
            <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Panel de Control</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Moderación y gestión de InfielesRD</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <div onClick={() => setActiveTab('pending')} style={{ 
                    flex: 1, padding: '20px', background: activeTab === 'pending' ? 'var(--primary)' : 'var(--surface)', 
                    color: activeTab === 'pending' ? 'white' : 'var(--text-main)', borderRadius: '12px', 
                    cursor: 'pointer', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)'
                }}>
                    <FaNewspaper size={24} style={{ marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                    <strong style={{ fontSize: '1.5rem', display: 'block' }}>{stats.pending}</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Pendientes</span>
                </div>
                
                <div onClick={() => setActiveTab('reports')} style={{ 
                    flex: 1, padding: '20px', background: activeTab === 'reports' ? 'var(--primary)' : 'var(--surface)', 
                    color: activeTab === 'reports' ? 'white' : 'var(--text-main)', borderRadius: '12px', 
                    cursor: 'pointer', boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)'
                }}>
                    <FaFlag size={24} style={{ marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                    <strong style={{ fontSize: '1.5rem', display: 'block' }}>{stats.reports}</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Reportes</span>
                </div>
            </div>

            {activeTab === 'pending' ? <PendingStories /> : <ReportsTable />}
        </div>
    );
}