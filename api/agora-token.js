// api/agora-token.js - CORREGIDO Y ACTUALIZADO
// Usamos la librería moderna 'agora-token' en lugar de la deprecada 'agora-access-token'
const { RtcTokenBuilder, RtcRole } = require('agora-token');

module.exports = async (req, res) => {
    // Configuración de CORS para permitir peticiones desde tu frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Manejo de preflight request (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Obtener credenciales de variables de entorno (Vercel)
        // Soporta ambos nombres por compatibilidad
        const AGORA_APP_ID = process.env.VITE_AGORA_APP_ID || process.env.AGORA_APP_ID;
        const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

        // Obtener parámetros del query string
        const channelName = req.query.channel;
        const uidStr = req.query.uid;

        if (!channelName || !uidStr) {
            return res.status(400).json({ error: 'Faltan parámetros: channel o uid son requeridos.' });
        }

        if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
            console.error("❌ Error: Faltan las credenciales de Agora en las variables de entorno.");
            return res.status(500).json({ error: 'Error de configuración del servidor.' });
        }

        // Configuración del token
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600; // 1 hora
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        
        // Convertir UID a entero (o usar 0 si se prefiere que Agora lo asigne, pero mejor respetar el del cliente)
        const uid = parseInt(uidStr) || 0;

        // Generar el Token
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );

        // Respuesta exitosa
        return res.status(200).json({ token, uid });

    } catch (error) {
        console.error("Error generando token:", error);
        return res.status(500).json({ error: 'Error interno generando el token.' });
    }
};