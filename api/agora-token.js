// netlify/functions/agora-token.js

const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// 🚨 La Cloud Function de Netlify usa el formato de handler de AWS Lambda.
exports.handler = async (event) => {
    
    // Obtener las claves secretas de las variables de entorno de Netlify (SEGURIDAD)
    const AGORA_APP_ID = process.env.AGORA_APP_ID;
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    
    // El cliente envía los parámetros en el query string
    const channelName = event.queryStringParameters.channel; 
    const uidClientString = event.queryStringParameters.uid; // El UID de tu Anon-SESS-XXX
    
    if (!channelName || !uidClientString) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Faltan parámetros de canal o UID.' }),
        };
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
        
        // Devolver el token al cliente de React
        return {
            statusCode: 200,
            body: JSON.stringify({ token: token, uid: uid }), // Enviamos el token y el UID
        };

    } catch (error) {
        console.error("Error al generar el token de Agora:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Fallo interno al generar el token.' }),
        };
    }
};