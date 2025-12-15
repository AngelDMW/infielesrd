import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

// Usa tu ID de Agora desde .env o ponlo aquí directo para probar "tu-app-id"
const APP_ID = import.meta.env.VITE_AGORA_APP_ID; 

export default function useAgora(roomId, userId) {
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const client = useRef(null);

  useEffect(() => {
    if (!APP_ID) {
      console.error("Falta VITE_AGORA_APP_ID en el archivo .env");
      return;
    }

    // 1. Inicializar Cliente
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const init = async () => {
      // Eventos de Usuarios Remotos
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
        setRemoteUsers(prev => [...prev, user]);
      });

      client.current.on("user-unpublished", (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        // 2. Unirse al canal (Sala)
        // null = token (para testing), roomId = canal, userId = tu ID
        await client.current.join(APP_ID, roomId, null, userId);
        
        // 3. Crear y Publicar Audio Local
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(track);
        await client.current.publish(track);
        
        setIsConnected(true);
      } catch (error) {
        console.error("Error Agora:", error);
      }
    };

    init();

    // Cleanup al salir
    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (client.current) {
        client.current.leave();
      }
      setIsConnected(false);
    };
  }, [roomId, userId]);

  // Función para mutear/desmutear
  const toggleMute = () => {
    if (localAudioTrack) {
      const isMuted = localAudioTrack.muted;
      localAudioTrack.setMuted(!isMuted);
      return !isMuted;
    }
    return false;
  };

  return { isConnected, toggleMute, remoteUsers };
}