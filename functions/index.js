// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa la app de admin de Firebase (necesario para interactuar con Firestore)
// Si ya tienes este código en otro lugar, asegúrate de que solo se ejecute una vez.
// admin.initializeApp(); 

// Nombre de la colección de salas de voz
const ROOMS_COLLECTION = 'voice_rooms';
// Tiempo de espera antes de eliminar la sala (en milisegundos: 60,000 ms = 1 minuto)
const DELETION_DELAY_MS = 60000; 

/**
 * Función que escucha las actualizaciones en cualquier documento de 'voice_rooms'.
 * Si una sala queda vacía, la programa para ser eliminada después de 1 minuto.
 */
exports.autoCloseEmptyRoom = functions.firestore
    .document(`${ROOMS_COLLECTION}/{roomId}`)
    .onUpdate(async (change, context) => {
        // Los datos después del cambio
        const roomAfter = change.after.data();
        const roomId = context.params.roomId;

        // 1. Verificar si la sala quedó vacía (usersCount === 0)
        if (roomAfter.usersCount === 0) {
            
            functions.logger.log(`Sala ${roomId} vacía. Verificando tiempo de espera.`);
            
            const emptySince = roomAfter.emptySince;
            
            // Si es la primera vez que está vacía, no tiene emptySince
            if (!emptySince) {
                // Establecer la marca de tiempo de cuándo se vació.
                return change.after.ref.update({
                    emptySince: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // Si ya tiene una marca de tiempo, verificar cuánto tiempo ha pasado.
            const emptyTimestamp = emptySince.toMillis();
            const now = Date.now();
            const elapsed = now - emptyTimestamp;
            
            // 2. Comprobar si ha pasado el tiempo de espera
            if (elapsed >= DELETION_DELAY_MS) {
                
                functions.logger.log(`Sala ${roomId} ha estado vacía por más de ${DELETION_DELAY_MS / 1000}s. Eliminando.`);
                
                // 3. Eliminar la sala
                return change.after.ref.delete();
            } else {
                // Aún no ha pasado suficiente tiempo, no hacer nada.
                functions.logger.log(`Sala ${roomId} se eliminará en ${Math.ceil((DELETION_DELAY_MS - elapsed) / 1000)} segundos.`);
                return null;
            }
            
        } else {
            // Si la sala NO está vacía, asegurarse de que se elimine la marca de tiempo 'emptySince'.
            if (roomAfter.emptySince) {
                functions.logger.log(`Sala ${roomId} tiene usuarios. Cancelando la eliminación.`);
                return change.after.ref.update({
                    // Esto elimina el campo de Firestore
                    emptySince: admin.firestore.FieldValue.delete() 
                });
            }
            return null; // No hay cambios necesarios
        }
    });