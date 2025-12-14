// src/pages/Admin.jsx - REDISEÑO COMPLETO, SUPER FUNCIONES Y ARREGLOS CRÍTICOS

import { useState, useEffect, useCallback } from 'react';
// 🚨 CRÍTICO: Añadir getDoc, runTransaction, serverTimestamp para solucionar el error de "getDoc is not defined"
import { 
    collection, query, where, orderBy, getDocs, 
    updateDoc, doc, deleteDoc, increment, 
    runTransaction, getDoc, serverTimestamp 
} from 'firebase/firestore'; 
import { db } from '../firebase';
import { FaChartLine, FaClipboardList, FaFlag, FaTimes, FaCheck, FaTrashAlt, FaSpinner, FaRegClock, FaUsers, FaHeart, FaCommentAlt, FaBookOpen, FaEdit, FaSearchPlus } from 'react-icons/fa';
import { formatTimeAgo } from '../utils/timeFormat'; 

// =========================================================================
// 1. Componente: Gestión de Reportes (Con Lógica de Eliminación Funcional)
// =========================================================================

const ReportsPanel = ({ fetchStats }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Función para cargar los reportes
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            // No filtrar reportes, solo ordenarlos
            const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
            const snapshot = await getDocs(q);
            setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Función para manejar las acciones (Archivar/Eliminar)
    const handleAction = async (reportId, action) => {
        if (!window.confirm(`¿Seguro que quieres ${action === 'archive' ? 'archivar' : 'eliminar'} este reporte?`)) return;

        try {
            const reportRef = doc(db, "reports", reportId);
            const reportSnapshot = await getDoc(reportRef);
            if (!reportSnapshot.exists()) {
                 alert("Error: El reporte no existe o fue eliminado.");
                 setReports(prev => prev.filter(r => r.id !== reportId));
                 return;
            }

            if (action === 'archive') {
                // Opción Archivar: simplemente eliminamos el reporte de la lista de pendientes
                await deleteDoc(reportRef); 
                alert("Reporte archivado y eliminado de la lista.");
            } else if (action === 'delete') {
                // Opción Fuerte: eliminar reporte Y el contenido reportado
                const data = reportSnapshot.data();
                const { type, contentId, storyId, parentCommentId } = data; // contentId es el ID del elemento a borrar

                if (type === 'story') {
                    // Borrar Historia (incluye comentarios, likes, etc. si usas delete en cascada, sino solo el doc)
                    await deleteDoc(doc(db, "stories", contentId));
                    alert(`Historia (ID: ${contentId}) y Reporte eliminados.`);
                } else if (type === 'comment') {
                    // Borrar Comentario Principal
                    await runTransaction(db, async (transaction) => {
                        const storyRef = doc(db, "stories", storyId);
                        const commentRef = doc(db, "stories", storyId, "comments", contentId);
                        
                        transaction.delete(commentRef);
                        transaction.update(storyRef, { commentsCount: increment(-1) });
                    });
                    alert(`Comentario (ID: ${contentId}) y Reporte eliminados.`);
                } else if (type === 'reply') {
                    // Borrar Respuesta (Nivel 1 o 2)
                     await runTransaction(db, async (transaction) => {
                        const storyRef = doc(db, "stories", storyId);
                        const replyRef = doc(db, "stories", storyId, "comments", parentCommentId, "replies", contentId);
                        
                        transaction.delete(replyRef);
                        // Decrementamos el contador de la historia (Simplificación)
                        transaction.update(storyRef, { commentsCount: increment(-1) }); 
                    });
                    alert(`Respuesta (ID: ${contentId}) y Reporte eliminados.`);
                }
                
                // Finalmente, eliminar el reporte de la colección reports
                await deleteDoc(reportRef);
                fetchStats(); // Actualizar contadores del Admin
            }
            
            // Actualizar el estado local
            setReports(prev => prev.filter(r => r.id !== reportId));

        } catch (error) {
            console.error(`Error al realizar la acción ${action}:`, error);
            alert(`Error: No se pudo completar la acción. ${error.message}.`);
        }
    };


    if (loading) return <p className="admin-loading"><FaSpinner className="spin-icon"/> Cargando reportes...</p>;

    return (
        <div className="admin-panel-list">
            {reports.length === 0 ? (
                <p className="admin-empty">🎉 ¡Panel limpio! No hay reportes pendientes.</p>
            ) : (
                reports.map(report => (
                    <div key={report.id} className="admin-card-report">
                        <div className="report-header">
                            <span className={`report-type type-${report.type}`}>{report.type.toUpperCase()} REPORTADO</span>
                            <span className="report-time"><FaRegClock /> {formatTimeAgo(report.reportedAt)}</span>
                        </div>
                        
                        <p className="report-reason"><strong>Motivo:</strong> {report.reason}</p>
                        <p className="report-snippet"><strong>Contenido:</strong> <em>"{report.contentSnippet}"</em></p>
                        <p className="report-id">ID Contenido: {report.contentId}</p>

                        <div className="report-actions">
                            <button onClick={() => handleAction(report.id, 'delete')} className="btn-delete"><FaTrashAlt /> Eliminar Contenido y Reporte</button>
                            <button onClick={() => handleAction(report.id, 'archive')} className="btn-secondary">Archivar Reporte</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};


// =========================================================================
// 2. Componente: Historias Pendientes
// =========================================================================
const PendingStoriesPanel = ({ fetchApprovedStories }) => {
    // ... (El código se mantiene igual, no necesita más cambios)
    const [pendingStories, setPendingStories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingStories = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "stories"), where("status", "==", "pending"), orderBy("createdAt", "asc"));
            const snapshot = await getDocs(q);
            setPendingStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching pending stories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingStories();
    }, [fetchPendingStories]);

    // Función para aprobar/rechazar
    const handleStoryReview = async (storyId, action) => {
        const actionText = action === 'approve' ? 'Aprobar' : 'Rechazar';
        if (!window.confirm(`¿Seguro que quieres ${actionText} esta historia?`)) return;

        try {
            const storyRef = doc(db, "stories", storyId);
            if (action === 'approve') {
                await updateDoc(storyRef, { 
                    status: "approved", 
                    publishedAt: serverTimestamp(), 
                    likes: 0,
                    commentsCount: 0
                });
                alert("Historia aprobada y publicada.");
            } else if (action === 'reject') {
                await deleteDoc(storyRef); 
                alert("Historia rechazada y eliminada.");
            }
            
            setPendingStories(prev => prev.filter(s => s.id !== storyId));
            if (action === 'approve' && fetchApprovedStories) {
                fetchApprovedStories(); 
            }

        } catch (error) {
            console.error(`Error al ${actionText.toLowerCase()} historia:`, error);
            alert(`Error: No se pudo completar la acción. ${error.message}`);
        }
    };

    if (loading) return <p className="admin-loading"><FaSpinner className="spin-icon"/> Cargando historias pendientes...</p>;

    return (
        <div className="admin-panel-list">
            {pendingStories.length === 0 ? (
                <p className="admin-empty">✅ ¡Todo al día! No hay historias pendientes de revisión.</p>
            ) : (
                pendingStories.map(story => (
                    <div key={story.id} className="admin-card-story">
                        <h3>{story.title}</h3>
                        <p className="story-content-snippet">{story.content.substring(0, 200)}...</p>
                        <p className="story-meta">Enviada: {formatTimeAgo(story.createdAt)}</p>
                        <div className="story-actions">
                            <button onClick={() => handleStoryReview(story.id, 'approve')} className="btn-approve"><FaCheck /> Aprobar</button>
                            <button onClick={() => handleStoryReview(story.id, 'reject')} className="btn-reject"><FaTimes /> Rechazar</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};


// =========================================================================
// 3. Nuevo Componente: Gestión de Historias Aprobadas (Super Funciones)
// =========================================================================

const ApprovedStoriesPanel = ({ fetchStats }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchApprovedStories = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "stories"), where("status", "==", "approved"), orderBy("publishedAt", "desc"));
            const snapshot = await getDocs(q);
            setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching approved stories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovedStories();
    }, [fetchApprovedStories]);

    // Lógica de Edición Rápida
    const handleEdit = async (storyId, currentTitle, currentContent) => {
        const newTitle = prompt("Editar Título:", currentTitle);
        if (newTitle === null) return; 

        const newContent = prompt("Editar Contenido:", currentContent);
        if (newContent === null) return;

        try {
            await updateDoc(doc(db, "stories", storyId), {
                title: newTitle,
                content: newContent,
                editedAt: serverTimestamp()
            });
            alert("Historia actualizada correctamente.");
            
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, title: newTitle, content: newContent, editedAt: new Date() } : s));

        } catch (error) {
            console.error("Error al editar historia:", error);
            alert(`Error: No se pudo editar la historia. ${error.message}`);
        }
    };
    
    // Lógica de Eliminación (Borrado forzado)
    const handleDelete = async (storyId) => {
        if (!window.confirm("¡ADVERTENCIA! ¿Estás seguro de ELIMINAR PERMANENTEMENTE esta historia y TODOS sus comentarios, likes y respuestas?")) return;
        
        try {
            await deleteDoc(doc(db, "stories", storyId));
            alert("Historia eliminada permanentemente.");
            setStories(prev => prev.filter(s => s.id !== storyId));
            fetchStats(); // Actualizar contadores
            
        } catch (error) {
            console.error("Error al eliminar historia:", error);
            alert(`Error: No se pudo eliminar la historia. ${error.message}`);
        }
    };

    // Lógica de búsqueda en el cliente
    const filteredStories = stories.filter(story => 
        (story.title && story.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (story.content && story.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <p className="admin-loading"><FaSpinner className="spin-icon"/> Cargando historias aprobadas...</p>;

    return (
        <>
            <div style={{position: 'relative', marginBottom: '20px'}}>
                <FaSearchPlus style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}}/>
                <input 
                    type="text" 
                    placeholder="Buscar historia por título o contenido..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    style={{
                        width: '100%',
                        padding: '12px 15px 12px 45px',
                        borderRadius: '15px', 
                        border: '1px solid var(--border)', 
                        background: 'var(--surface)',
                        color: 'var(--text-main)'
                    }}
                />
            </div>

            <div className="admin-panel-list">
                {filteredStories.length === 0 ? (
                    <p className="admin-empty">{searchTerm ? `No se encontraron resultados para "${searchTerm}".` : 'No hay historias aprobadas.'}</p>
                ) : (
                    filteredStories.map(story => (
                        <div key={story.id} className="admin-card-approved-story">
                            <h3>{story.title}</h3>
                            <p className="story-content-snippet">{story.content.substring(0, 150)}...</p>
                            <div className="story-meta-stats">
                                <span><FaRegClock /> {formatTimeAgo(story.publishedAt)}</span>
                                <span><FaHeart style={{color: 'var(--primary)'}} /> {story.likes || 0}</span>
                                <span><FaCommentAlt /> {story.commentsCount || 0}</span>
                            </div>
                            <div className="story-actions" style={{marginTop: '15px'}}>
                                <button 
                                    onClick={() => handleEdit(story.id, story.title, story.content)} 
                                    className="btn-edit"
                                    style={{background: 'var(--accent-blue)', color: 'white'}}
                                >
                                    <FaEdit /> Editar Rápido
                                </button>
                                <button onClick={() => handleDelete(story.id)} className="btn-reject"><FaTrashAlt /> Eliminar Forzado</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};


// =========================================================================
// 4. Componente: Estadísticas (Se mantiene)
// =========================================================================

const StatsPanel = ({ totalStories, totalReports, totalComments }) => (
    <div className="admin-stats-grid">
        <div className="admin-stats-card"><FaBookOpen size={24} style={{color: 'var(--primary)'}}/> <h4>Historias Aprobadas</h4> <p>{totalStories}</p></div>
        <div className="admin-stats-card"><FaCommentAlt size={24} style={{color: 'var(--accent-blue)'}}/> <h4>Comentarios Totales</h4> <p>{totalComments}</p></div>
        <div className="admin-stats-card"><FaFlag size={24} style={{color: 'var(--accent-red)'}}/> <h4>Reportes Pendientes</h4> <p>{totalReports}</p></div>
        <div className="admin-stats-card"><FaUsers size={24} style={{color: 'var(--text-secondary)'}}/> <h4>Usuarios (Sesiones)</h4> <p>Simulado: +100</p></div>
    </div>
);


// =========================================================================
// 5. Componente Principal: Admin
// =========================================================================

export default function Admin() {
    const [activeTab, setActiveTab] = useState('approved'); 
    const [stats, setStats] = useState({ totalStories: 0, totalComments: 0, totalReports: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            // Contar Historias Aprobadas
            const storiesQuery = query(collection(db, "stories"), where("status", "==", "approved"));
            const storiesSnap = await getDocs(storiesQuery);
            const totalStories = storiesSnap.size;

            // Contar Reportes
            const reportsQuery = query(collection(db, "reports"));
            const reportsSnap = await getDocs(reportsQuery);
            const totalReports = reportsSnap.size;

            let totalComments = 0;
            storiesSnap.forEach(doc => {
                totalComments += doc.data().commentsCount || 0;
            });
            
            setStats({ totalStories, totalComments, totalReports });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const renderContent = () => {
        if (loadingStats) return <div style={{textAlign: 'center', padding: '50px'}}><FaSpinner className="spin-icon"/> Cargando panel...</div>;
        
        switch (activeTab) {
            case 'stats':
                return <StatsPanel {...stats} />;
            case 'pending':
                return <PendingStoriesPanel fetchApprovedStories={fetchStats} />; 
            case 'reports':
                return <ReportsPanel fetchStats={fetchStats} />; // Pasar fetchStats
            case 'approved': 
                return <ApprovedStoriesPanel fetchStats={fetchStats} />; // Pasar fetchStats
            default:
                return null;
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1><FaChartLine style={{color: 'var(--primary)'}}/> Panel de Administración</h1>
                <p>Gestión de contenido, revisión y métricas.</p>
            </header>

            <nav className="admin-nav-tabs">
                <button className={activeTab === 'approved' ? 'active' : ''} onClick={() => setActiveTab('approved')}>
                    <FaBookOpen /> Contenido Aprobado
                </button>
                <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
                    <FaClipboardList /> Pendientes
                </button>
                <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
                    <FaFlag /> Reportes ({stats.totalReports})
                </button>
                <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
                    <FaChartLine /> Estadísticas
                </button>
            </nav>

            <main className="admin-main-content">
                {renderContent()}
            </main>
        </div>
    );
}