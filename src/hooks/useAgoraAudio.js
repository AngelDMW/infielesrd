// src/hooks/useAgoraAudio.js - SOLUCIÓN DEFINITIVA A BUCLE INFINITO Y LENTITUD

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // <--- ¡useRef importado!
import AgoraRTC from 'agora-rtc-sdk-ng';

// 🚨 1. APP ID - Debe ser el ID de tu proyecto Agora
const APP_ID = 'c8d1e982bbe14be08f5f2b49b0f3c0f4'; 
// 🏆 2. ENDPOINT NETLIFY: La ruta a tu función generadora de tokens
const TOKEN_SERVER_URL = '/.netlify/functions/agora-token'; 

// El cliente de Agora se inicializa solo una vez (fuera del hook para ser estable)
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const useAgoraAudio = (channelName, uidString) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    
    // 💡 SOLUCIÓN CRÍTICA: Usamos useRef para almacenar la pista local de forma estable
    // Esto previene que el cambio de 'localTrack' cause un re-render del hook completo.
    const localTrackRef = useRef(null); 
    
    // Función para silenciar/activar (Es estable ya que solo depende de 'isMuted')
    const toggleMute = useCallback(() => {
        const track = localTrackRef.current;
        if (!track) return;
        
        try {
            track.setMuted(!isMuted);
            setIsMuted(prev => !prev);
        } catch (error) {
            console.error("[AGORA] Fallo al mutear/desmutear la pista:", error);
        }
        
    }, [isMuted]); // El único estado necesario en dependencias es isMuted


    // 🚩 EFECTO DE CONEXIÓN Y LIMPIEZA
    useEffect(() => {
        
        const fetchTokenAndConnect = async () => {
            try {
                // 1. Obtener Token del servidor Netlify
                const response = await fetch(`${TOKEN_SERVER_URL}?channel=${channelName}&uid=${uidString}`);
                const data = await response.json(); 

                if (!data.token || data.uid === undefined) {
                    throw new Error("Respuesta de token inválida del servidor Netlify.");
                }
                
                const token = data.token;
                const uidToUse = data.uid;
                
                // 2. CONECTAR
                await client.join(APP_ID, channelName, token, uidToUse); 
                
                // 3. OBTENER PISTA DE MICRÓFONO Y PUBLICAR
                const track = await AgoraRTC.createMicrophoneAudioTrack();
                await client.publish(track);
                
                // 4. 💡 ALMACENAR EN REF Y ACTUALIZAR ESTADO DE CONEXIÓN
                localTrackRef.current = track; // <--- Almacenamiento estable
                setIsConnected(true);
                setIsMuted(false); 
                console.log(`[AGORA] Conectado al canal: ${channelName}`);
                
            } catch (error) {
                console.error('[AGORA] Error Crítico de Conexión:', error.message);
                setIsConnected(false);
                // Si la conexión falla, intentamos una limpieza forzada.
                try { 
                    if (client.connectionState !== 'DISCONNECTED') {
                        await client.leave(); 
                    }
                } catch (e) {
                    console.warn("[AGORA/FORCE_LEAVE] Fallo al forzar desconexión:", e);
                } 
            }
        };

        fetchTokenAndConnect();
        
        // 🛑 FUNCIÓN DE LIMPIEZA CRÍTICA (Se ejecuta al salir de la sala)
        return () => {
            console.log(`[AGORA/CLEANUP] Limpiando recursos de Agora para el canal ${channelName}`);
            
            // 1. Detener y cerrar la pista local usando la referencia
            const track = localTrackRef.current;
            if (track) {
                track.close(); 
                localTrackRef.current = null; // Resetear la referencia
            }
            
            // 2. Desconectar el cliente de Agora
            if (client.connectionState === 'CONNECTED') {
                 // Usamos then().catch() para no bloquear el cleanup y gestionar el error
                client.leave().catch(err => {
                    console.warn("[AGORA/LEAVE_FAIL] Fallo al desconectar el cliente, pero se ignorará:", err);
                });
            }
            
            // 3. Resetear el estado de React 
            setIsConnected(false);
            setRemoteUsers([]);
        };

    }, [channelName, uidString]); // <--- ¡DEPENDENCIAS ESTABLES! Esto previene el bucle.

    // Efecto para manejar usuarios remotos (Estable y sin cambios)
    useEffect(() => {
        const handleUserPublished = (user, mediaType) => {
            if (mediaType === 'audio') {
                client.subscribe(user, mediaType).then(() => {
                    user.audioTrack.play();
                    // Usar Set para evitar duplicados y lentitud
                    setRemoteUsers(prev => {
                        const newUsers = new Set(prev);
                        newUsers.add(user.uid);
                        return Array.from(newUsers);
                    });
                }).catch(err => {
                    console.error("Fallo al subscribir o reproducir audio:", err);
                });
            }
        };

        const handleUserUnpublished = (user) => {
            // Limpieza de la lista al salir
            setRemoteUsers(prev => prev.filter(uid => uid !== user.uid));
        };
        
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);

        return () => {
            // DESCONECTAR LISTENERS
            client.off('user-published', handleUserPublished);
            client.off('user-unpublished', handleUserUnpublished);
        };
    }, []);

    return {
        isConnected,
        isMuted,
        remoteUsers,
        toggleMute
    };
};