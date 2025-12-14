// src/components/BottomBar.jsx - CÓDIGO FINAL CON CHAT DE VOZ

import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaMicrophone, FaPencilAlt, FaClipboardList } from 'react-icons/fa';

export default function BottomBar() {
    const location = useLocation();

    // Define los ítems de navegación
    const navItems = [
        { path: '/', icon: FaHome, label: 'Inicio' },
        { path: '/stories', icon: FaClipboardList, label: 'Archivo' },
        // 👈 ¡NUEVO ÍTEM DE CHAT DE VOZ!
        { path: '/voice-chat', icon: FaMicrophone, label: 'Voz' }, 
        { path: '/submit', icon: FaPencilAlt, label: 'Enviar' },
    ];

    return (
        <div className="bottom-nav">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                        {/* Renderiza el ícono del item */}
                        <item.icon size={20} /> 
                        <span className="nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}