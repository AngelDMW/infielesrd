// token-generator.js - SINTAXIS DE IMPORTACIÓN COMPATIBLE CON COMMONJS EN ENTORNO ESM

// 1. Usar el método de importación sugerido por Node.js:
import pkg from 'agora-token'; 
const { RtcTokenBuilder, RtcRole } = pkg; // 2. Desestructurar las clases del paquete

// --- TUS CREDENCIALES EXACTAS ---
const appId = 'c8d1e982bbe14be08f5f2b49b0f3c0f4';
const appCertificate = 'eb3bef2eecf847e4978014882cd54c90'; // Tu Primary Certificate

// --- PARÁMETROS DE TOKEN ---
const channelName = 'TEST_VOICE_CHANNEL_DEV';
const uid = 0; // UID numérico
const role = RtcRole.PUBLISHER; // Rol de Publicador

// --- GENERACIÓN DEL TOKEN ---
function generateToken() {
    // Tiempo de vida del token (1 hora)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId, 
        appCertificate, 
        channelName, 
        uid, 
        role, 
        privilegeExpiredTs
    );
    
    return token;
}

// --- EJECUCIÓN DEL SCRIPT ---
const tokenGenerado = generateToken();

console.log("==================================================================");
console.log("  ✅ ¡TOKEN GENERADO CON ROL PUBLISHER (Solución Node.js)! ");
console.log("==================================================================");
console.log(tokenGenerado);