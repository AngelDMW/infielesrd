// src/utils/identity.js
// Utilidad para gestionar una identidad anónima persistente en toda la aplicación

export const getAnonymousID = () => {
    const STORAGE_KEY = 'infieles_anon_uid';
    let storedId = localStorage.getItem(STORAGE_KEY);

    // Compatibilidad con tu código anterior de VoiceChat
    if (!storedId) {
        // Intentar recuperar del key antiguo si existía para no perder admins
        const oldKey = localStorage.getItem('anon_admin_uid');
        if (oldKey) {
            storedId = oldKey;
            localStorage.setItem(STORAGE_KEY, oldKey);
        } else {
            // Generar nuevo ID robusto
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            storedId = `Anon-SESS-${randomPart}`;
            localStorage.setItem(STORAGE_KEY, storedId);
        }
    }
    
    return storedId;
};

// Lista de Admins centralizada (puedes moverla a una variable de entorno más adelante)
export const ADMIN_UIDS = [
    "Anon-SESS-8127", 
    "Anon-SESS-3005"
];

export const isUserAdmin = (uid) => {
    return ADMIN_UIDS.includes(uid);
};