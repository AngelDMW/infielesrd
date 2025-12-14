// src/pages/ReportsTest.jsx - CÓDIGO TEMPORAL DE VERIFICACIÓN

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { formatTimeAgo } from '../utils/timeFormat'; // Asegúrate de que esta ruta sea correcta

export default function ReportsTest() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
                const snapshot = await getDocs(q);
                setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <div>Cargando reportes...</div>;

    return (
        <div style={{ padding: '20px', background: 'var(--bg-color)', color: 'var(--text-main)'}}>
            <h2>🚨 Reportes Recibidos (TEST)</h2>
            <p><strong>Total:</strong> {reports.length}</p>
            {reports.length === 0 ? (
                <p>No hay reportes nuevos.</p>
            ) : (
                reports.map(report => (
                    <div key={report.id} style={{ border: '1px solid var(--border)', padding: '15px', margin: '10px 0', borderRadius: '10px', background: 'var(--surface)'}}>
                        <p><strong>Tipo:</strong> {report.type.toUpperCase()} ({report.contentId})</p>
                        <p><strong>Historia ID:</strong> {report.storyId}</p>
                        <p><strong>Motivo:</strong> {report.reason}</p>
                        <p><strong>Contenido:</strong> <em>{report.contentSnippet}</em></p>
                        <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Reportado: {formatTimeAgo(report.reportedAt)}</p>
                    </div>
                ))
            )}
        </div>
    );
}