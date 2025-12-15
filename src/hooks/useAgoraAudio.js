// src/hooks/useAgoraAudio.js - SEGURO Y OPTIMIZADO

import { useState, useEffect, useCallback, useRef } from 'react'; 
import AgoraRTC from 'agora-rtc-sdk-ng';

// 🔒 SEGURIDAD: Usar variable de entorno
const APP_ID = import.meta.env.VITE_AGORA_APP_ID; 
const TOKEN_SERVER_URL = '/api/agora-token'; 

// El cliente de Agora se inicializa solo una vez
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const useAgoraAudio = (channelName, uidString) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    
    const localTrackRef = useRef(null); 
    
    const toggleMute = useCallback(() => {
        const track = localTrackRef.current;
        if (!track) return;
        
        try {
            track.setMuted(!isMuted);
            setIsMuted(prev => !prev);
        } catch (error) {
            console.error("[AGORA] Fallo al mutear/desmutear:", error);
        }
    }, [isMuted]);

    useEffect(() => {
        if (!APP_ID) {
            console.error("❌ FALTA VITE_AGORA_APP_ID en el archivo .env");
            return;
        }

        const fetchTokenAndConnect = async () => {
            try {
                // 1. Obtener Token
                const response = await fetch(`${TOKEN_SERVER_URL}?channel=${channelName}&uid=${uidString}`);
                
                if (!response.ok) {
                    throw new Error(`Error servidor token: ${response.status}`);
                }

                const data = await response.json(); 
                
                if (!data.token || data.uid === undefined) {
                    throw new Error("Token inválido recibido.");
                }
                
                // 2. Conectar
                await client.join(APP_ID, channelName, data.token, data.uid); 
                
                // 3. Publicar Audio
                const track = await AgoraRTC.createMicrophoneAudioTrack();
                await client.publish(track);
                
                localTrackRef.current = track;
                setIsConnected(true);
                setIsMuted(false); 
                
            } catch (error) {
                console.error('[AGORA] Error de Conexión:', error.message);
                setIsConnected(false);
                if (client.connectionState !== 'DISCONNECTED') {
                     await client.leave().catch(e => console.warn(e));
                }
            }
        };

        fetchTokenAndConnect();
        
        // Cleanup
        return () => {
            const track = localTrackRef.current;
            if (track) {
                track.close(); 
                localTrackRef.current = null;
            }
            if (client.connectionState === 'CONNECTED') {
                client.leave().catch(console.warn);
            }
            setIsConnected(false);
            setRemoteUsers([]);
        };

    }, [channelName, uidString]); 

    // Listeners de usuarios remotos
    useEffect(() => {
        const handleUserPublished = (user, mediaType) => {
            if (mediaType === 'audio') {
                client.subscribe(user, mediaType).then(() => {
                    user.audioTrack.play();
                    setRemoteUsers(prev => {
                        const newUsers = new Set(prev);
                        newUsers.add(user.uid);
                        return Array.from(newUsers);
                    });
                });
            }
        };

        const handleUserUnpublished = (user) => {
            setRemoteUsers(prev => prev.filter(uid => uid !== user.uid));
        };
        
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);

        return () => {
            client.off('user-published', handleUserPublished);
            client.off('user-unpublished', handleUserUnpublished);
        };
    }, []);

    return { isConnected, isMuted, remoteUsers, toggleMute };
};