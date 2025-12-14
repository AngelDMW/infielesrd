// api/agora-token.js - CORREGIDO PARA VERCEL (Node.js Serverless)

const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// 🏆 CORRECCIÓN CRÍTICA: La función debe exportarse directamente como handler (req, res) para Vercel
module.exports = async (req, res) => {
    
    // Obtener las claves secretas de las variables de entorno de Vercel (SEGURIDAD)
    const AGORA_APP_ID = process.env.AGORA_APP_ID;
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    
    // 🏆 CORRECCIÓN CRÍTICA: Los parámetros se obtienen de req.query en Vercel, no de event.queryStringParameters
    const channelName = req.query.channel; 
    const uidClientString = req.query.uid;
    
    if (!channelName || !uidClientString) {
        // 🏆 CORRECCIÓN CRÍTICA: Usar res.status().json() para Vercel
        return res.status(400).json({ error: 'Faltan parámetros de canal o UID.' });
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        console.error("VARIABLES DE ENTORNO AGORA FALTANTES O NO CONFIGURADAS");
        // Devolver un error 500 para el frontend si las claves secretas no están definidas
        return res.status(500).json({ error: 'La configuración de la APP ID o el CERTIFICATE del servidor es incorrecta.' });
    }

    // Configuración del Token
    const uid = 0; // Usaremos 0 como UID numérico (como en tus pruebas)
    const role = RtcRole.PUBLISHER; 
    const expirationTimeInSeconds = 3600; // 1 hora
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        // Generar el Token
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID, 
            AGORA_APP_CERTIFICATE, 
            channelName, 
            uid, 
            role, 
            privilegeExpiredTs
        );
        
        // 🏆 CORRECCIÓN CRÍTICA: Usar res.status().json() para Vercel
        return res.status(200).json({ token: token, uid: uid });

    } catch (error) {
        console.error("Error al generar el token de Agora:", error.message);
        // Devolver un 500 si la generación del token falla por cualquier otra razón
        return res.status(500).json({ error: 'Fallo interno al generar el token.' });
    }
};