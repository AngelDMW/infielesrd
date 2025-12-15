const functions = require('firebase-functions');
const admin = require('firebase-admin');

// ✅ Inicialización obligatoria para que funcione en Cloud Functions
admin.initializeApp(); 

const ROOMS_COLLECTION = 'voice_rooms';

/**
 * Cierra automáticamente las salas cuando el último usuario sale.
 * Se dispara cada vez que un documento en 'voice_rooms' es actualizado.
 */
exports.autoCloseEmptyRoom = functions.firestore
    .document(`${ROOMS_COLLECTION}/{roomId}`)
    .onUpdate(async (change, context) => {
        const roomAfter = change.after.data();
        const roomId = context.params.roomId;

        // Validamos que exista el array de usuarios
        const users = roomAfter.users || [];

        // 1. Verificar si la sala quedó vacía revisando la longitud del array
        if (users.length === 0) {
            functions.logger.log(`Sala ${roomId} ha quedado vacía. Procediendo a eliminarla para limpieza.`);
            
            try {
                // Eliminar la sala inmediatamente
                await change.after.ref.delete();
                functions.logger.log(`Sala ${roomId} eliminada con éxito.`);
            } catch (error) {
                functions.logger.error(`Error eliminando sala ${roomId}:`, error);
            }
        }
        
        return null;
    });