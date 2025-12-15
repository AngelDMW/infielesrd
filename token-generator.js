// token-generator.js - SINTAXIS DE IMPORTACIÓN COMPATIBLE CON COMMONJS EN ENTORNO ESM

// 1. Usar el método de importación sugerido por Node.js:
import pkg from 'agora-token'; 
const { RtcTokenBuilder, RtcRole } = pkg; 

// --- CONFIGURACIÓN ---
// ⚠️ IMPORTANTE: Nunca subas tus claves reales al repositorio (Git).
// Usa variables de entorno o un archivo .env si ejecutas esto en un servidor.
// Para pruebas locales, reemplaza los strings vacíos temporalmente, pero NO GUARDES el archivo.

const appId = process.env.AGORA_APP_ID || ''; // Coloca tu App ID aquí solo para ejecución local temporal
const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''; // Coloca tu Certificado aquí
const channelName = 'TEST_VOICE_CHANNEL_DEV';
const uid = 0; // UID numérico (0 permite que Agora asigne uno)
const role = RtcRole.PUBLISHER; 

// --- GENERACIÓN DEL TOKEN ---
function generateToken() {
    if (!appId || !appCertificate) {
        console.error("❌ ERROR: Faltan App ID o App Certificate.");
        return;
    }

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

if (tokenGenerado) {
    console.log("==================================================================");
    console.log("  ✅ ¡TOKEN GENERADO CON ROL PUBLISHER! ");
    console.log("==================================================================");
    console.log(tokenGenerado);
}